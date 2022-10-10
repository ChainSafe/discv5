import { IDiscv5Metrics } from "../service";
import { RateLimiterGRCA, RateLimiterQuota } from "./rateLimiterGRCA";

type IPAddress = string;
type NodeID = string;

export interface PacketSrc {
  address: IPAddress;
  family: "IPv4" | "IPv6";
  port: number;
  size: number;
}

export interface RateLimiterOpts {
  maxBannedNodesByIp: number
  globalQuota: RateLimiterQuota;
  byIPQuota: RateLimiterQuota;
  byNodeIDQuota: RateLimiterQuota;
}

export interface IRateLimiter {
  allowEncodedPacket(ip: IPAddress): boolean;
  allowDecodedPacket(ip: IPAddress, nodeId: NodeID): boolean;
  addExpectedResponse(ip: IPAddress): void;
  removeExpectedResponse(ip: IPAddress): void;
}

export class RateLimiter implements IRateLimiter {
  private readonly rateLimiterGlobal: RateLimiterGRCA<null>;
  private readonly rateLimiterIP: RateLimiterGRCA<IPAddress>;
  private readonly rateLimiterNodeID: RateLimiterGRCA<NodeID>;

  private readonly bannedIPs = new Map<IPAddress, number>();
  private readonly bannedNodeIDs = new Map<NodeID, number>();
  private readonly bannedNodesByIP = new Map<IPAddress, number>();
  private readonly expectedResponsesByIP = new Map<IPAddress, number>();

  constructor(private readonly opts: RateLimiterOpts, private readonly metrics: IDiscv5Metrics | null ) {
    this.rateLimiterGlobal = RateLimiterGRCA.fromQuota(opts.globalQuota);
    this.rateLimiterIP = RateLimiterGRCA.fromQuota(opts.byIPQuota);
    this.rateLimiterNodeID = RateLimiterGRCA.fromQuota(opts.byNodeIDQuota);
  }

  allowEncodedPacket(ip: IPAddress): boolean {
    if (this.bannedIPs.has(ip)) {
      return false;
    }

    if (this.expectsResponseFromIP(ip)) {
      return true;
    }

    if (!this.rateLimiterIP.allows(ip, 1)) {
      this.metrics?.rateLimitHitIP.inc()

      this.bannedIPs.set(ip, Date.now())

      return false;
    }

    if (!this.rateLimiterGlobal.allows(null, 1)) {
      this.metrics?.rateLimitHitTotal.inc()
      return false;
    }

    return true
  }

  allowDecodedPacket(ip: IPAddress, nodeId: NodeID): boolean {
    if (this.bannedNodeIDs.has(nodeId)) {
      return false;
    }

    if (this.expectsResponseFromIP(ip)) {
      return true;
    }

    if (!this.rateLimiterNodeID.allows(nodeId, 1)) {
      this.metrics?.rateLimitHitNodeID.inc()

      this.bannedNodeIDs.set(nodeId, Date.now())

      const bannedNodesInIp = (this.bannedNodesByIP.get(ip) ?? 0) + 1
      this.bannedNodesByIP.set(ip, bannedNodesInIp)
      if (bannedNodesInIp > this.opts.maxBannedNodesByIp) {
        this.bannedIPs.set(ip, Date.now())
      }

      return false
    }

    return true
  }

  addExpectedResponse(ip: IPAddress): void {
    this.expectedResponsesByIP.set(ip, (this.expectedResponsesByIP.get(ip) ?? 0) + 1);
  }

  removeExpectedResponse(ip: IPAddress): void {
    const expectedResponses = this.expectedResponsesByIP.get(ip)
    if (expectedResponses !== undefined) {
      if (expectedResponses > 1) {
        this.expectedResponsesByIP.set(ip, expectedResponses - 1);
      } else {
        this.expectedResponsesByIP.delete(ip);
      }
    }
  }

  /** After a request initiated by us we expected a response from this IP */
  private expectsResponseFromIP(ip: IPAddress): boolean {
    return this.expectedResponsesByIP.has(ip)
  }
}
