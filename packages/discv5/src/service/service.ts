import {EventEmitter} from "node:events";
import {
  ENR,
  MAX_RECORD_SIZE,
  type NodeId,
  SignableENR,
  bytesToBigint,
  createNodeId,
  createPeerIdFromPublicKey,
} from "@chainsafe/enr";
import type {PeerId, PrivateKey} from "@libp2p/interface";
import type {Multiaddr} from "@multiformats/multiaddr";
import {randomBytes} from "@noble/hashes/utils.js";
import debug from "weald";
import {type IDiscv5Config, defaultConfig} from "../config/index.js";
import {
  EntryStatus,
  InsertResult,
  KademliaRoutingTable,
  Lookup,
  UpdateResult,
  log2Distance,
} from "../kademlia/index.js";
import {type IKeypair, createKeypair} from "../keypair/index.js";
import {
  type IFindNodeMessage,
  type INodesMessage,
  type IPingMessage,
  type IPongMessage,
  type ITalkReqMessage,
  type ITalkRespMessage,
  MessageType,
  type RequestId,
  type RequestMessage,
  type ResponseMessage,
  createFindNodeMessage,
  createNodesMessage,
  createPingMessage,
  createTalkRequestMessage,
  createTalkResponseMessage,
  requestMatchesResponse,
} from "../message/index.js";
import {type IDiscv5Metrics, type MetricsRegister, createDiscv5Metrics} from "../metrics.js";
import {MAX_PACKET_SIZE} from "../packet/index.js";
import {RateLimiter, type RateLimiterOpts} from "../rateLimit/index.js";
import {ConnectionDirection, RequestErrorType, ResponseErrorType, SessionService} from "../session/index.js";
import {
  type INodeAddress,
  type NodeContact,
  createNodeContact,
  getNodeAddress,
  getNodeId,
} from "../session/nodeInfo.js";
import {type BindAddrs, type IPMode, type ITransportService, UDPTransportService} from "../transport/index.js";
import {CodeError} from "../util/index.js";
import {
  type SocketAddress,
  getSocketAddressMultiaddrOnENR,
  getSocketAddressOnENR,
  getSocketAddressOnENRByFamily,
  isEqualSocketAddress,
  multiaddrFromSocketAddress,
  multiaddrToSocketAddress,
  normalizeIp,
  setSocketAddressOnENR,
} from "../util/ip.js";
import {AddrVotes} from "./addrVotes.js";
import {
  type ConnectionStatus,
  ConnectionStatusType,
  type Discv5EventEmitter,
  type ENRInput,
  type IActiveRequest,
  type INodesResponse,
  type PongResponse,
  type ResponseType,
  type SignableENRInput,
  toResponseType,
} from "./types.js";

const log = debug("discv5:service");

/**
 * Discovery v5 is a protocol designed for encrypted peer discovery and topic advertisement. Each peer/node
 * on the network is identified via its ENR (Ethereum Name Record) which is essentially a signed key-value
 * store containing the node's public key and optionally IP address and port.
 *
 * Discv5 employs a kademlia-like routing table to store and manage discovered peers and topics.
 * The protocol allows for external IP discovery in NAT environments through regular PING/PONGs with
 * discovered nodes.
 * Nodes return the external IP address that they have received and a simple majority is chosen as our external
 * IP address.
 *
 * This section contains protocol-level logic. In particular it manages the routing table of known ENRs, topic
 * registration/advertisement and performs lookups
 */

export interface IDiscv5CreateOptions {
  enr: SignableENRInput;
  privateKey: PrivateKey;
  bindAddrs: BindAddrs;
  config?: Partial<IDiscv5Config>;
  metricsRegistry?: MetricsRegister | null;
  transport?: ITransportService;
  /**
   * Enable optional packet rate limiter with opts
   */
  rateLimiterOpts?: RateLimiterOpts;
}

/**
 * User-facing service one can use to set up, start and use Discv5.
 *
 * The service exposes a number of user-facing operations that the user may refer to in their application:
 * * Adding a new static peers
 * * Checking the properties of a specific peer
 * * Performing a lookup for a peer
 *
 * Additionally, the service offers events when peers are added to the peer table or discovered via lookup.
 */
export class Discv5 extends (EventEmitter as {new (): Discv5EventEmitter}) {
  /**
   * Session service that establishes sessions with peers
   */
  sessionService: SessionService;

  /**
   * Configuration
   */
  private config: IDiscv5Config;

  private started = false;

  /**
   * Storage of the ENR record for each node
   *
   * BOUNDED: bounded by bucket count + size
   */
  private kbuckets: KademliaRoutingTable;

  /**
   * All the iterative lookups we are currently performing with their ID
   *
   * UNBOUNDED: consumer data, responsibility of the app layer to bound
   */
  private activeLookups: Map<number, Lookup>;

  /**
   * RPC requests that have been sent and are awaiting a response.
   * Some requests are linked to a lookup (spanning multiple req/resp trips)
   *
   * UNBOUNDED: consumer data, responsibility of the app layer to bound
   */
  private activeRequests: Map<bigint, IActiveRequest>;

  /**
   * Tracks responses received across NODES responses.
   *
   * UNBOUNDED: consumer data, responsibility of the app layer to bound
   */
  private activeNodesResponses: Map<bigint, INodesResponse>;

  /**
   * List of peers we have established sessions with and an interval id
   * the interval handler pings the associated node
   *
   * BOUNDED: bounded by kad table size
   */
  private connectedPeers: Map<NodeId, NodeJS.Timeout>;

  /**
   * Id for the next lookup that we start
   */
  private nextLookupId: number;

  /**
   * Votes that nodes have made about our external IP address, tracked per address family
   *
   * BOUNDED
   */
  private addrVotes: {ip4?: AddrVotes; ip6?: AddrVotes};

  private metrics?: IDiscv5Metrics;

  private ipMode: IPMode;

  /**
   * Default constructor.
   * @param sessionService the service managing sessions underneath.
   */
  constructor(config: IDiscv5Config, sessionService: SessionService, metrics?: IDiscv5Metrics) {
    super();
    this.config = config;
    this.sessionService = sessionService;
    this.kbuckets = new KademliaRoutingTable(this.sessionService.enr.nodeId);
    this.activeLookups = new Map();
    this.activeRequests = new Map();
    this.activeNodesResponses = new Map();
    this.connectedPeers = new Map();
    this.nextLookupId = 1;
    this.ipMode = this.sessionService.transport.ipMode;
    this.addrVotes = {
      ip4: this.ipMode.ip4 ? new AddrVotes(config.addrVotesToUpdateEnr) : undefined,
      ip6: this.ipMode.ip6 ? new AddrVotes(config.addrVotesToUpdateEnr) : undefined,
    };
    if (metrics) {
      this.metrics = metrics;
      metrics.kadTableSize.collect = () => metrics.kadTableSize.set(this.kbuckets.size);
      metrics.connectedPeerCount.collect = () => metrics.connectedPeerCount.set(this.connectedPeers.size);
      metrics.activeSessionCount.collect = () => metrics.activeSessionCount.set(this.sessionService.sessionsSize());
      metrics.lookupCount.collect = () => metrics.lookupCount.set(this.nextLookupId - 1);
    }
  }

  /**
   * Convenience method to create a new discv5 service.
   *
   * @param enr the ENR record identifying the current node.
   * @param privateKey the PrivateKey that identifies the enr
   * @param multiaddr The multiaddr which contains the network interface and port to which the UDP server binds
   */
  static create(opts: IDiscv5CreateOptions): Discv5 {
    const {enr, privateKey, bindAddrs, config = {}, metricsRegistry, transport} = opts;
    const fullConfig = {...defaultConfig, ...config};
    const metrics = metricsRegistry ? createDiscv5Metrics(metricsRegistry) : undefined;
    const keypair = createKeypair({privateKey: privateKey.raw, type: privateKey.type});
    const decodedEnr = typeof enr === "string" ? SignableENR.decodeTxt(enr, privateKey.raw) : enr;
    const rateLimiter = opts.rateLimiterOpts && new RateLimiter(opts.rateLimiterOpts, metrics ?? null);
    const sessionService = new SessionService(
      fullConfig,
      decodedEnr,
      keypair,
      transport ?? new UDPTransportService({bindAddrs, nodeId: decodedEnr.nodeId, rateLimiter})
    );
    return new Discv5(fullConfig, sessionService, metrics);
  }

  /**
   * Starts the service and adds all initial bootstrap peers to be considered.
   */
  async start(): Promise<void> {
    if (this.started) {
      log("Starting discv5 service failed -- already started");
      return;
    }
    log(`Starting discv5 service with node id ${this.enr.nodeId}`);
    this.kbuckets.on("pendingEviction", this.onPendingEviction);
    this.kbuckets.on("appliedEviction", this.onAppliedEviction);
    this.sessionService.on("established", this.onEstablished);
    this.sessionService.on("request", this.handleRpcRequest);
    this.sessionService.on("response", this.handleRpcResponse);
    this.sessionService.on("whoAreYouRequest", this.handleWhoAreYouRequest);
    this.sessionService.on("requestFailed", this.rpcFailure);
    this.addrVotes.ip4?.clear();
    this.addrVotes.ip6?.clear();
    await this.sessionService.start();
    this.started = true;
  }

  /**
   * Stops the service, closing any underlying networking activity.
   */
  async stop(): Promise<void> {
    if (!this.started) {
      log("Stopping discv5 service -- already stopped");
      return;
    }
    log("Stopping discv5 service");
    this.kbuckets.off("pendingEviction", this.onPendingEviction);
    this.kbuckets.off("appliedEviction", this.onAppliedEviction);
    this.kbuckets.clear();
    for (const lookup of this.activeLookups.values()) {
      lookup.stop();
    }
    this.activeLookups.clear();
    this.nextLookupId = 1;
    this.activeRequests.clear();
    this.activeNodesResponses.clear();
    this.addrVotes.ip4?.clear();
    this.addrVotes.ip6?.clear();
    for (const intervalId of this.connectedPeers.values()) {
      clearInterval(intervalId);
    }
    this.connectedPeers.clear();
    this.sessionService.off("established", this.onEstablished);
    this.sessionService.off("request", this.handleRpcRequest);
    this.sessionService.off("response", this.handleRpcResponse);
    this.sessionService.off("whoAreYouRequest", this.handleWhoAreYouRequest);
    this.sessionService.off("requestFailed", this.rpcFailure);
    await this.sessionService.stop();
    this.started = false;
  }

  isStarted(): boolean {
    return this.started;
  }

  /**
   * Adds a known ENR of a peer participating in Discv5 to the routing table.
   *
   * This allows pre-populating the kademlia routing table with known addresses,
   * so that they can be used immediately in following DHT operations involving one of these peers,
   * without having to dial them upfront.
   */
  addEnr(enr: ENRInput): void {
    let decodedEnr: ENR;
    try {
      decodedEnr = typeof enr === "string" ? ENR.decodeTxt(enr) : enr;
      decodedEnr.encode();
    } catch {
      log("Unable to add enr: %o", enr);
      return;
    }
    if (this.kbuckets.insertOrUpdate(decodedEnr, EntryStatus.Disconnected) === InsertResult.Inserted) {
      this.emit("enrAdded", decodedEnr);
    }
  }

  get bindAddrs(): Multiaddr[] {
    return this.sessionService.transport.bindAddrs;
  }

  get keypair(): IKeypair {
    return this.sessionService.keypair;
  }

  get peerId(): PeerId {
    return createPeerIdFromPublicKey(this.keypair.type, this.keypair.publicKey);
  }

  get enr(): SignableENR {
    return this.sessionService.enr;
  }

  get connectedPeerCount(): number {
    return this.connectedPeers.size;
  }

  getKadValue(nodeId: NodeId): ENR | undefined {
    return this.kbuckets.getValue(nodeId);
  }

  /**
   * Return all ENRs of nodes currently contained in buckets of the kad routing table
   */
  kadValues(): ENR[] {
    return this.kbuckets.values();
  }

  async findRandomNode(): Promise<ENR[]> {
    return await this.findNode(createNodeId(randomBytes(32)));
  }

  /**
   * Starts an iterative FIND_NODE lookup
   */
  async findNode(target: NodeId): Promise<ENR[]> {
    const lookupId = this.nextLookupId;
    log("Starting a new lookup. Id: %d", lookupId);
    if (this.nextLookupId >= 2 ** 32) {
      this.nextLookupId = 1;
    } else {
      this.nextLookupId += 1;
    }

    const knownClosestPeers = this.kbuckets.nearest(target, 16).map((enr) => enr.nodeId);
    const lookup = new Lookup(this.config, target, knownClosestPeers);
    this.activeLookups.set(lookupId, lookup);
    return await new Promise((resolve) => {
      lookup.on("peer", (peer: NodeId) => this.sendLookup(lookupId, peer, lookup.createRpcRequest(peer)));
      lookup.on("finished", (closest: NodeId[]) => {
        log("Lookup Id: %d finished, %d total found", lookupId, closest.length);
        resolve(closest.map((nodeId) => this.findEnr(nodeId) as ENR).filter((enr) => enr));
        this.activeLookups.delete(lookupId);
      });

      // This will trigger "peer" events, eventually leading to a "finished" event
      lookup.start();
    });
  }

  /**
   * Returns an ENR if one is known for the given NodeId
   *
   * This includes ENRs from any ongoing lookups not yet in the kad table
   */
  findEnr(nodeId: NodeId): ENR | undefined {
    // check if we know this node id in our routing table
    const enr = this.kbuckets.getValue(nodeId);
    if (enr) {
      return enr;
    }
    // Check the untrusted addresses for ongoing lookups
    for (const lookup of this.activeLookups.values()) {
      const enr = lookup.untrustedEnrs[nodeId];
      if (enr) {
        return enr;
      }
    }
    return undefined;
  }

  /**
   * Send FINDNODE message to remote and returns response
   */
  async sendFindNode(remote: ENR | Multiaddr, distances: number[]): Promise<ENR[]> {
    const contact = createNodeContact(remote, this.ipMode);
    const request = createFindNodeMessage(distances);

    return await new Promise((resolve, reject) => {
      this.sendRpcRequest({
        callbackPromise: {
          reject,
          resolve: resolve as (val: ENR[]) => void,
        },
        contact,
        request,
      });
    });
  }

  /**
   * Send TALKREQ message to dstId and returns response
   */
  async sendTalkReq(remote: ENR | Multiaddr, payload: Uint8Array, protocol: string | Uint8Array): Promise<Uint8Array> {
    const contact = createNodeContact(remote, this.ipMode);
    const request = createTalkRequestMessage(payload, protocol);

    return await new Promise((resolve, reject) => {
      this.sendRpcRequest({
        callbackPromise: {
          reject,
          resolve: resolve as (val: Uint8Array) => void,
        },
        contact,
        request,
      });
    });
  }

  /**
   * Send TALKRESP message to requesting node
   */
  async sendTalkResp(remote: INodeAddress, requestId: RequestId, payload: Uint8Array): Promise<void> {
    const msg = createTalkResponseMessage(requestId, payload);
    this.sendRpcResponse(remote, msg);
  }

  /**
   * Hack to get debug logs to work in browser
   */
  enableLogs(): void {
    debug.enable("discv5*");
  }

  /**
   * Sends a PING request to a node and returns response
   */
  async sendPing(nodeAddr: ENR | Multiaddr): Promise<PongResponse> {
    const contact = createNodeContact(nodeAddr, this.ipMode);
    const request = createPingMessage(this.enr.seq);

    return await new Promise((resolve, reject) => {
      this.sendRpcRequest({
        callbackPromise: {
          reject,
          resolve: resolve as (val: PongResponse) => void,
        },
        contact,
        request,
      });
    });
  }

  /**
   * Ping all peers connected in the routing table
   */
  private pingConnectedPeers(): void {
    for (const entry of this.kbuckets.rawValues()) {
      if (entry.status === EntryStatus.Connected) {
        this.sendPing(entry.value).catch((e) => log("Error pinging peer %o: %s", entry.value, (e as Error).message));
      }
    }
  }

  /**
   * Returns true if we need more IP votes for the given family.
   * In dual-stack mode, when we haven't reached the vote threshold for a family,
   * we accept votes from ANY peer (not just connected outgoing ones) to bootstrap
   * IPv6 address discovery on networks with limited IPv6 peers.
   * Matches Rust sigp/discv5 `require_more_ip_votes()` behavior.
   */
  private requireMoreIpVotes(isIpv6: boolean): boolean {
    // Only applies in dual-stack mode
    if (!this.ipMode.ip4 || !this.ipMode.ip6) {
      return false;
    }

    const ip4Votes = this.addrVotes.ip4;
    const ip6Votes = this.addrVotes.ip6;
    if (!ip4Votes || !ip6Votes) {
      return false;
    }

    const ip4HasEnough = ip4Votes.currentVoteCount() >= this.config.addrVotesToUpdateEnr;
    const ip6HasEnough = ip6Votes.currentVoteCount() >= this.config.addrVotesToUpdateEnr;

    if (!ip4HasEnough && !ip6HasEnough) {
      // Need both — accept any vote
      return true;
    }
    if (isIpv6 && !ip6HasEnough) {
      // Have enough IPv4 but need IPv6 — accept IPv6 from any peer
      return true;
    }
    if (!isIpv6 && !ip4HasEnough) {
      // Have enough IPv6 but need IPv4 — accept IPv4 from any peer
      return true;
    }

    return false;
  }

  private maybeUpdateLocalEnrFromVote(voter: NodeId, observedAddr: SocketAddress): void {
    // Normalize IPv4-mapped IPv6 addresses (::ffff:x.x.x.x) to IPv4.
    // Remote peers may report our IPv4 address in IPv4-mapped format,
    // which would pollute the IPv6 vote pool and prevent real IPv6 votes
    // from reaching the threshold.
    const normalizedAddr: SocketAddress = {ip: normalizeIp(observedAddr.ip), port: observedAddr.port};

    const votes = normalizedAddr.ip.type === 4 ? this.addrVotes.ip4 : this.addrVotes.ip6;
    if (!votes) {
      return;
    }

    const isWinningVote = votes.addVote(voter, normalizedAddr);
    if (!isWinningVote) {
      return;
    }

    const currentAddr = getSocketAddressOnENRByFamily(this.enr, normalizedAddr.ip.type);
    if (currentAddr && isEqualSocketAddress(currentAddr, normalizedAddr)) {
      return;
    }

    log("Local ENR (IP & UDP) updated: %s", isWinningVote);
    setSocketAddressOnENR(this.enr, normalizedAddr);
    this.emit("multiaddrUpdated", multiaddrFromSocketAddress(normalizedAddr));
    this.pingConnectedPeers();
  }

  /**
   * Request an external node's ENR
   */
  private requestEnr(contact: NodeContact): void {
    this.sendRpcRequest({contact, request: createFindNodeMessage([0])});
  }

  /**
   * Constructs and sends a request to the session service given a target and lookup peer
   */
  private sendLookup(lookupId: number, peer: NodeId, request: RequestMessage): void {
    const enr = this.findEnr(peer);
    if (!enr || !getSocketAddressMultiaddrOnENR(enr, this.ipMode)) {
      log("Lookup %s requested an unknown ENR or ENR w/o UDP", lookupId);
      this.activeLookups.get(lookupId)?.onFailure(peer);
      return;
    }

    this.sendRpcRequest({
      contact: createNodeContact(enr, this.ipMode),
      lookupId,
      request,
    });
  }

  /**
   * Sends generic RPC requests.
   * Each request gets added to known outputs, awaiting a response
   *
   * Returns true if the request was sent successfully
   */
  private sendRpcRequest<T extends RequestMessage, U extends ResponseType>(activeRequest: IActiveRequest<T, U>): void {
    this.activeRequests.set(
      bytesToBigint(activeRequest.request.id),
      activeRequest as unknown as IActiveRequest<RequestMessage, ResponseType>
    );

    const nodeAddr = getNodeAddress(activeRequest.contact);
    log("Sending %s to node: %o", MessageType[activeRequest.request.type], nodeAddr);
    try {
      this.sessionService.sendRequest(activeRequest.contact, activeRequest.request);
      this.metrics?.sentMessageCount.inc({type: MessageType[activeRequest.request.type]});
    } catch (e) {
      this.activeRequests.delete(bytesToBigint(activeRequest.request.id));
      log("Error sending RPC to node: %o, :Error: %s", nodeAddr, (e as Error).message);
    }
  }

  /**
   * Sends generic RPC responses.
   */
  private sendRpcResponse(nodeAddr: INodeAddress, response: ResponseMessage): void {
    log("Sending %s to node: %o", MessageType[response.type], nodeAddr);
    try {
      this.sessionService.sendResponse(nodeAddr, response);
      this.metrics?.sentMessageCount.inc({type: MessageType[response.type]});
    } catch (e) {
      log("Error sending RPC to node: %o, :Error: %s", nodeAddr, (e as Error).message);
    }
  }

  /**
   * Update the connection status of a node in the routing table.
   * This tracks whether or not we should be pinging peers.
   * Disconnected peers are removed from the queue and
   * newly added peers to the routing table are added to the queue.
   */
  private connectionUpdated(nodeId: NodeId, newStatus: ConnectionStatus): void {
    switch (newStatus.type) {
      case ConnectionStatusType.Connected: {
        // attempt to update or insert the new ENR.
        switch (this.kbuckets.insertOrUpdate(newStatus.enr, EntryStatus.Connected)) {
          case InsertResult.Inserted: {
            // We added this peer to the table
            log("New connected node added to routing table: %s", nodeId);
            clearInterval(this.connectedPeers.get(nodeId) as NodeJS.Timeout);
            this.connectedPeers.set(
              nodeId,
              setInterval(() => {
                // If the node is in the routing table, keep pinging
                if (this.kbuckets.getValue(nodeId)) {
                  this.sendPing(newStatus.enr).catch((e) =>
                    log("Error pinging peer %o: %s", newStatus.enr, (e as Error).message)
                  );
                } else {
                  clearInterval(this.connectedPeers.get(nodeId) as NodeJS.Timeout);
                  this.connectedPeers.delete(nodeId);
                }
              }, this.config.pingInterval)
            );
            // PING immediately if the direction is outgoing. This allows us to receive
            // a PONG without waiting for the ping_interval, making ENR updates faster.
            // Matches Rust sigp/discv5 behavior.
            // Deferred to next tick: SessionService emits "established" before storing
            // the session internally, so a synchronous sendPing would not find it.
            if (newStatus.direction === ConnectionDirection.Outgoing) {
              const enr = newStatus.enr;
              setTimeout(() => {
                this.sendPing(enr).catch((e) =>
                  log("Error pinging newly connected peer %o: %s", enr, (e as Error).message)
                );
              }, 0);
            }
            this.emit("enrAdded", newStatus.enr);
            break;
          }

          case InsertResult.UpdatedAndPromoted:
          case InsertResult.StatusUpdatedAndPromoted: {
            // The node was promoted
            log("Node promoted to connected: %s", nodeId);
            clearInterval(this.connectedPeers.get(nodeId) as NodeJS.Timeout);
            this.connectedPeers.set(
              nodeId,
              setInterval(() => {
                // If the node is in the routing table, keep pinging
                if (this.kbuckets.getValue(nodeId)) {
                  this.sendPing(newStatus.enr).catch((e) =>
                    log("Error pinging peer %o: %s", newStatus.enr, (e as Error).message)
                  );
                } else {
                  clearInterval(this.connectedPeers.get(nodeId) as NodeJS.Timeout);
                  this.connectedPeers.delete(nodeId);
                }
              }, this.config.pingInterval)
            );
            break;
          }

          case InsertResult.FailedBucketFull:
          case InsertResult.FailedInvalidSelfUpdate: {
            log("Could not insert node: %s", nodeId);
            clearInterval(this.connectedPeers.get(nodeId) as NodeJS.Timeout);
            this.connectedPeers.delete(nodeId);
            // On large networks with limited IPv6 nodes, it is hard to get enough
            // PONG votes to estimate our external IPv6 address. If we need more votes
            // and this is an outgoing connection, ping anyway just for the vote.
            if (
              newStatus.direction === ConnectionDirection.Outgoing &&
              this.requireMoreIpVotes(newStatus.enr.ip6 !== undefined)
            ) {
              const enr = newStatus.enr;
              setTimeout(() => {
                this.sendPing(enr).catch((e) =>
                  log("Error pinging peer for IP vote %o: %s", enr, (e as Error).message)
                );
              }, 0);
            }
            break;
          }
        }
        break;
      }

      case ConnectionStatusType.PongReceived: {
        switch (this.kbuckets.update(newStatus.enr, EntryStatus.Connected)) {
          case UpdateResult.FailedBucketFull:
          case UpdateResult.FailedKeyNonExistent: {
            log("Could not update ENR from pong. Node: %s", nodeId);
            clearInterval(this.connectedPeers.get(nodeId) as NodeJS.Timeout);
            this.connectedPeers.delete(nodeId);
            break;
          }
        }
        break;
      }

      case ConnectionStatusType.Disconnected: {
        // If the node has disconnected, remove any ping timer for the node.
        switch (this.kbuckets.updateStatus(nodeId, EntryStatus.Disconnected)) {
          case UpdateResult.FailedBucketFull:
          case UpdateResult.FailedKeyNonExistent: {
            log("Could not update node to disconnected, Node: %s", nodeId);
            break;
          }
          default: {
            log("Node set to disconnected: %s", nodeId);
            break;
          }
        }
        clearInterval(this.connectedPeers.get(nodeId) as NodeJS.Timeout);
        this.connectedPeers.delete(nodeId);
        break;
      }
    }
  }

  /**
   * Processes discovered peers from a query
   */
  private discovered(srcId: NodeId, enrs: ENR[], lookupId?: number): void {
    const localId = this.enr.nodeId;
    const others: ENR[] = [];
    for (const enr of enrs) {
      if (enr.nodeId === localId) {
        continue;
      }

      // send the discovered event
      //if (this.config.reportDiscoveredPeers)
      this.emit("discovered", enr);

      // ignore peers that don't pass the table filter
      // if (this.config.tableFilter(enr)) {}

      // If any of the discovered nodes are in the routing table,
      // and there contains an older ENR, update it.
      const entry = this.kbuckets.getWithPending(enr.nodeId);
      if (entry && entry.value.seq < enr.seq) {
        switch (this.kbuckets.update(enr)) {
          case UpdateResult.FailedBucketFull:
          case UpdateResult.FailedKeyNonExistent: {
            clearInterval(this.connectedPeers.get(enr.nodeId) as NodeJS.Timeout);
            this.connectedPeers.delete(enr.nodeId);
            log("Failed to update discovered ENR. Node: %s", enr.nodeId);
            continue;
          }
        }
      }

      others.push(enr);
    }

    // If this is part of a lookup, update the lookup
    if (lookupId) {
      const lookup = this.activeLookups.get(lookupId);
      if (lookup) {
        for (const enr of others) {
          const enrNodeId = enr.nodeId;
          if (!lookup.untrustedEnrs[enrNodeId]) {
            lookup.untrustedEnrs[enrNodeId] = enr;
          }
        }
        log("%d peers found for lookup Id: %d, Node: %s", others.length, lookupId, srcId);
        lookup.onSuccess(
          srcId,
          others.map((enr) => enr.nodeId)
        );
      }
    }
  }

  // process kad updates

  private onPendingEviction = (enr: ENR): void => {
    this.sendPing(enr).catch((e) => log("Error pinging peer %o: %s", enr, (e as Error).message));
  };

  private onAppliedEviction = (inserted: ENR, evicted?: ENR): void => {
    this.emit("enrAdded", inserted, evicted);
  };

  // process events from the session service

  private onEstablished = (
    _nodeAddr: INodeAddress,
    enr: ENR,
    direction: ConnectionDirection,
    verified: boolean
  ): void => {
    // Ignore sessions with unverified or non-contactable ENRs
    if (!verified || !getSocketAddressOnENR(enr, this.ipMode)) {
      return;
    }

    const nodeId = enr.nodeId;
    log("Session established with Node: %s, Direction: %s", nodeId, ConnectionDirection[direction]);
    this.connectionUpdated(nodeId, {direction, enr, type: ConnectionStatusType.Connected});
  };

  private handleWhoAreYouRequest = (nodeAddr: INodeAddress, nonce: Uint8Array): void => {
    // Check what our latest known ENR is for this node
    const enr = this.findEnr(nodeAddr.nodeId) ?? null;
    if (enr) {
      log("Received WHOAREYOU, Node known, Node: %o", nodeAddr);
    } else {
      log("Received WHOAREYOU, Node unknown, requesting ENR. Node: %o", nodeAddr);
    }
    this.sessionService.sendChallenge(nodeAddr, nonce, enr);
  };

  // handle rpc request

  /**
   * Processes an RPC request from a peer.
   *
   * Requests respond to the received socket address, rather than the IP of the known ENR.
   */
  private handleRpcRequest = (nodeAddr: INodeAddress, request: RequestMessage): void => {
    const requestType = MessageType[request.type];
    this.metrics?.rcvdMessageCount.inc({type: requestType});

    try {
      switch (request.type) {
        case MessageType.PING:
          this.handlePing(nodeAddr, request as IPingMessage);
          break;
        case MessageType.FINDNODE:
          this.handleFindNode(nodeAddr, request as IFindNodeMessage);
          break;
        case MessageType.TALKREQ:
          this.handleTalkReq(nodeAddr, request as ITalkReqMessage);
          break;
        default:
          log("Received request type which is unimplemented: %s", request.type);
          // TODO Implement all RPC methods
          return;
      }
    } catch {
      log("Error handling rpc request: node: %o, requestType: %s", nodeAddr, requestType);
    }
  };

  private handlePing(nodeAddr: INodeAddress, message: IPingMessage): void {
    // check if we need to update the known ENR
    const entry = this.kbuckets.getWithPending(nodeAddr.nodeId);
    if (entry && entry.value.seq < message.enrSeq) {
      this.requestEnr(createNodeContact(entry.value, this.ipMode));
    }

    const ipUDP = multiaddrToSocketAddress(nodeAddr.socketAddr);

    const pongMessage: IPongMessage = {
      addr: ipUDP,
      enrSeq: this.enr.seq,
      id: message.id,
      type: MessageType.PONG,
    };

    // build the Pong response
    log("Sending PONG response to node: %o", nodeAddr);
    try {
      this.sessionService.sendResponse(nodeAddr, pongMessage);
      this.metrics?.sentMessageCount.inc({type: MessageType[MessageType.PONG]});
    } catch (e) {
      log("Failed to send Pong. Error %s", (e as Error).message);
    }
  }

  /**
   * Sends a NODES response, given a list of found ENRs.
   * This function splits the nodes up into multiple responses to ensure the response stays below
   * the maximum packet size
   */
  private handleFindNode(nodeAddr: INodeAddress, message: IFindNodeMessage): void {
    const {id, distances} = message;
    let nodes: ENR[] = [];
    for (const distance of new Set(distances)) {
      // filter out invalid distances
      if (distance < 0 || distance > 256) {
        continue;
      }
      // if the distance is 0, send our local ENR
      if (distance === 0) {
        nodes.push(this.enr.toENR());
      } else {
        nodes.push(...this.kbuckets.valuesOfDistance(distance));
      }
    }
    // limit response to 16 nodes
    nodes = nodes.slice(0, 16);
    if (nodes.length === 0) {
      log("Sending empty NODES response to %o", nodeAddr);
      try {
        this.sessionService.sendResponse(nodeAddr, createNodesMessage(id, 1, nodes));
        this.metrics?.sentMessageCount.inc({type: MessageType[MessageType.NODES]});
      } catch (e) {
        log("Failed to send a NODES response. Error: %s", (e as Error).message);
      }
      return;
    }
    // Responses assume that a session is established.
    // Thus, on top of the encoded ENRs the packet should be a regular message.
    // A regular message has a tag (32 bytes), an authTag (12 bytes)
    // and the NODES response has an ID (8 bytes) and a total (8 bytes).
    // The encryption adds the HMAC (16 bytes) and can be at most 16 bytes larger
    // So, the total empty packet size can be at most 92
    const nodesPerPacket = Math.floor((MAX_PACKET_SIZE - 92) / MAX_RECORD_SIZE);
    const total = Math.ceil(nodes.length / nodesPerPacket);
    log("Sending %d NODES responses to %o", total, nodeAddr);
    for (let i = 0; i < nodes.length; i += nodesPerPacket) {
      const _nodes = nodes.slice(i, i + nodesPerPacket);
      try {
        this.sessionService.sendResponse(nodeAddr, createNodesMessage(id, total, _nodes));
        this.metrics?.sentMessageCount.inc({type: MessageType[MessageType.NODES]});
      } catch (e) {
        log("Failed to send a NODES response. Error: %s", (e as Error).message);
      }
    }
  }

  private handleTalkReq = (nodeAddr: INodeAddress, message: ITalkReqMessage): void => {
    log("Received TALKREQ message from Node: %o", nodeAddr);
    this.emit("talkReqReceived", nodeAddr, this.findEnr(nodeAddr.nodeId) ?? null, message);
  };

  // handle rpc response

  /**
   * Processes an RPC response from a peer.
   */
  private handleRpcResponse = (nodeAddr: INodeAddress, response: ResponseMessage): void => {
    const responseType = MessageType[response.type];
    this.metrics?.rcvdMessageCount.inc({type: responseType});

    // verify we know of the rpc id

    const activeRequest = this.activeRequests.get(bytesToBigint(response.id));
    if (!activeRequest) {
      log("Received an RPC response which doesn't match a request. Id: &s", response.id);
      return;
    }
    this.activeRequests.delete(bytesToBigint(response.id));

    // Check that the responder matches the expected request
    const requestNodeAddr = getNodeAddress(activeRequest.contact);
    if (requestNodeAddr.nodeId !== nodeAddr.nodeId || !requestNodeAddr.socketAddr.equals(nodeAddr.socketAddr)) {
      log(
        "Received a response from an unexpected address. Expected %o, received %o, request id: %s",
        requestNodeAddr,
        nodeAddr,
        response.id
      );
      activeRequest.callbackPromise?.reject(
        new CodeError(
          "Received a response from an nexpected address",
          ResponseErrorType[ResponseErrorType.WrongAddress]
        )
      );
      return;
    }

    // Check that the response type matches the request
    if (!requestMatchesResponse(activeRequest.request, response)) {
      log("Node gave an incorrect response type. Ignoring response from: %o", nodeAddr);
      activeRequest.callbackPromise?.reject(
        new CodeError("Response has incorrect response type", ResponseErrorType[ResponseErrorType.WrongResponseType])
      );
      return;
    }

    try {
      switch (response.type) {
        case MessageType.PONG:
          this.handlePong(nodeAddr, activeRequest, response as IPongMessage);
          break;
        case MessageType.NODES:
          if (!this.handleNodes(nodeAddr, activeRequest as IActiveRequest<IFindNodeMessage>, response as INodesMessage))
            return;
          break;
        case MessageType.TALKRESP:
          this.handleTalkResp(nodeAddr, activeRequest as IActiveRequest<ITalkReqMessage>, response as ITalkRespMessage);
          break;
        default:
          // TODO Implement all RPC methods
          return;
      }

      activeRequest.callbackPromise?.resolve(toResponseType(response));
    } catch (e) {
      log("Error handling rpc response: node: %o response: %s", nodeAddr, responseType);
      activeRequest.callbackPromise?.reject(
        new CodeError((e as Error).message, ResponseErrorType[ResponseErrorType.InternalError])
      );
    }
  };

  private handlePong(nodeAddr: INodeAddress, activeRequest: IActiveRequest, message: IPongMessage): void {
    log("Received a PONG response from %o", nodeAddr);

    if (this.config.enrUpdate) {
      this.maybeUpdateLocalEnrFromVote(nodeAddr.nodeId, message.addr);
    }

    // Check if we need to request a new ENR
    const enr = this.findEnr(nodeAddr.nodeId);
    if (enr) {
      if (enr.seq < message.enrSeq) {
        log("Requesting an ENR update from node: %o", nodeAddr);
        this.sendRpcRequest({
          contact: activeRequest.contact,
          request: createFindNodeMessage([0]),
        });
      }
      this.connectionUpdated(nodeAddr.nodeId, {enr, type: ConnectionStatusType.PongReceived});
    }
  }

  /**
   * Return true if this nodes message is the final in the response
   */
  private handleNodes(
    nodeAddr: INodeAddress,
    activeRequest: IActiveRequest<IFindNodeMessage>,
    message: INodesMessage
  ): boolean {
    const {request, lookupId} = activeRequest;
    // Currently a maximum of 16 peers can be returned.
    // Datagrams have a max size of 1280 and ENRs have a max size of 300 bytes.
    // There should be no more than 5 responses to return 16 peers
    if (message.total > 5) {
      log("NODES response has a total larger than 5, nodes will be truncated");
    }

    // Filter out any nodes that are not of the correct distance
    // TODO: if a swarm peer reputation is built,
    // downvote the peer if all peers do not have the correct distance
    const distancesRequested = request.distances;
    message.enrs = message.enrs.filter((enr) => distancesRequested.includes(log2Distance(enr.nodeId, nodeAddr.nodeId)));

    // handle the case that there is more than one response
    if (message.total > 1) {
      const currentResponse = this.activeNodesResponses.get(bytesToBigint(message.id)) || {count: 1, enrs: []};
      this.activeNodesResponses.delete(bytesToBigint(message.id));
      log("NODES response: %d of %d received, length: %d", currentResponse.count, message.total, message.enrs.length);
      // If there are more requests coming, store the nodes and wait for another response
      if (currentResponse.count < 5 && currentResponse.count < message.total) {
        currentResponse.count += 1;
        currentResponse.enrs.push(...message.enrs);
        this.activeRequests.set(bytesToBigint(message.id), activeRequest as IActiveRequest<RequestMessage>);
        this.activeNodesResponses.set(bytesToBigint(message.id), currentResponse);
        return false;
      }

      // Have received all the Nodes responses we are willing to accept
      message.enrs.push(...currentResponse.enrs);
    }
    log(
      "Received NODES response of length: %d, total: %d, from node: %o",
      message.enrs.length,
      message.total,
      nodeAddr
    );

    this.activeNodesResponses.delete(bytesToBigint(message.id));

    this.discovered(nodeAddr.nodeId, message.enrs, lookupId);

    return true;
  }

  private handleTalkResp = (
    nodeAddr: INodeAddress,
    _activeRequest: IActiveRequest<ITalkReqMessage>,
    message: ITalkRespMessage
  ): void => {
    log("Received TALKRESP message from Node: %o", nodeAddr);
    this.emit("talkRespReceived", nodeAddr, this.findEnr(nodeAddr.nodeId) ?? null, message);
  };

  /**
   * A session could not be established or an RPC request timed out
   */
  private rpcFailure = (rpcId: RequestId, error: RequestErrorType): void => {
    log("RPC error, removing request. Reason: %s, id %s", RequestErrorType[error], rpcId);
    const req = this.activeRequests.get(bytesToBigint(rpcId));
    if (!req) {
      return;
    }
    const {request, contact, lookupId, callbackPromise} = req;
    this.activeRequests.delete(bytesToBigint(request.id));

    const nodeId = getNodeId(contact);
    // If a failed FindNodes Request, ensure we haven't partially received responses.
    // If so, process the partially found nodes
    if (request.type === MessageType.FINDNODE) {
      const nodesResponse = this.activeNodesResponses.get(bytesToBigint(request.id));
      if (nodesResponse) {
        this.activeNodesResponses.delete(bytesToBigint(request.id));

        if (nodesResponse.enrs.length) {
          log("NODES response failed, but was partially processed from Node: %s", nodeId);
          // If its a query, mark it as a success, to process the partial collection of its peers
          this.discovered(nodeId, nodesResponse.enrs, lookupId);
        }
      } else {
        // There was no partially downloaded nodes, inform the lookup of the failure if its part of a query
        const lookup = this.activeLookups.get(lookupId as number);
        if (lookup) {
          lookup.onFailure(nodeId);
        } else {
          log("Failed %s request: %O for node: %s", MessageType[request.type], request, nodeId);
        }
      }
    } else {
      // for all other requests, if any are lookups, mark them as failures.
      const lookup = this.activeLookups.get(lookupId as number);
      if (lookup) {
        lookup.onFailure(nodeId);
      } else {
        log("Failed %s request: %O for node: %s", MessageType[request.type], request, nodeId);
      }
    }

    // report the node as being disconnected
    this.connectionUpdated(nodeId, {type: ConnectionStatusType.Disconnected});

    // If this is initiated by the user, return the error on the callback.
    callbackPromise?.reject(new CodeError("RPC failure", RequestErrorType[error]));
  };
}
