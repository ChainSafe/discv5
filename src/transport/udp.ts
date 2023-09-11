import * as dgram from "node:dgram";
import { EventEmitter } from "events";
import { Multiaddr, multiaddr, MultiaddrObject } from "@multiformats/multiaddr";

import { decodePacket, encodePacket, IPacket, MAX_PACKET_SIZE } from "../packet/index.js";
import { BindAddrs, IPMode, IRemoteInfo, ITransportService, TransportEventEmitter } from "./types.js";
import { IRateLimiter } from "../rateLimit/index.js";
import { ENR } from "../enr/enr.js";
import { getSocketAddressOnENR, SocketAddress } from "../util/ip.js";

export type UDPTransportServiceInit = {
  bindAddrs: BindAddrs;
  nodeId: string;
  rateLimiter?: IRateLimiter;
};

type SocketOpts = {
  addr: Multiaddr;
  opts: MultiaddrObject;
  socket?: dgram.Socket;
};

/**
 * This class is responsible for encoding outgoing Packets and decoding incoming Packets over UDP
 */
export class UDPTransportService
  extends (EventEmitter as { new (): TransportEventEmitter })
  implements ITransportService
{
  readonly bindAddrs: Multiaddr[];
  readonly ipMode: IPMode;

  /**
   * IPv4 socket and configuration
   */
  private readonly ip4?: SocketOpts;
  /**
   * IPv6 socket and configuration
   */
  private readonly ip6?: SocketOpts;
  private readonly srcId: string;
  private readonly rateLimiter?: IRateLimiter;

  public constructor(init: UDPTransportServiceInit) {
    super();
    this.srcId = init.nodeId;
    this.rateLimiter = init.rateLimiter;
    if (!init.bindAddrs.ip4 && !init.bindAddrs.ip6) {
      throw new Error("Must bind with an IPv4 and/or IPv6 multiaddr");
    }
    const toSocketOpts = (addr: Multiaddr): SocketOpts => {
      const opts = addr.toOptions();
      if (opts.transport !== "udp") {
        throw new Error("Local multiaddr must use UDP");
      }
      return {
        addr,
        opts,
      };
    };

    this.bindAddrs = [];
    this.ipMode = { ip4: false, ip6: false } as unknown as IPMode;

    if (init.bindAddrs.ip4) {
      this.ip4 = toSocketOpts(init.bindAddrs.ip4);
      if (this.ip4.opts.family !== 4) {
        throw new Error("Configured IPv4 bind address must be IPv4");
      }
      this.bindAddrs.push(this.ip4.addr);
      this.ipMode.ip4 = true;
    }
    if (init.bindAddrs.ip6) {
      this.ip6 = toSocketOpts(init.bindAddrs.ip6);
      if (this.ip6.opts.family !== 6) {
        throw new Error("Configured IPv6 bind address must be IPv6");
      }
      this.bindAddrs.push(this.ip6.addr);
      this.ipMode.ip6 = true;
    }
    if (this.ip4 && this.ip6) {
      if (this.ip4.opts.port === this.ip6.opts.port) {
        throw new Error("Configured bind multiaddrs must have different ports");
      }
    }
  }

  public async start(): Promise<void> {
    const [socket4, socket6] = await Promise.all([
      this.ip4 ? openSocket(this.ip4.opts) : undefined,
      this.ip6 ? openSocket(this.ip6.opts) : undefined,
    ]);
    if (this.ip4) {
      socket4?.on("message", this.handleIncoming);
      this.ip4.socket = socket4;
    }
    if (this.ip6) {
      socket6?.on("message", this.handleIncoming);
      this.ip6.socket = socket6;
    }
  }

  public async stop(): Promise<void> {
    const socket4 = this.ip4?.socket;
    const socket6 = this.ip6?.socket;
    socket4?.off("message", this.handleIncoming);
    socket6?.off("message", this.handleIncoming);
    await Promise.all([closeSocket(socket4), closeSocket(socket6)]);
  }

  public async send(to: Multiaddr, toId: string, packet: IPacket): Promise<void> {
    const nodeAddr = to.toOptions();
    if (nodeAddr.family === 4) {
      if (!this.ip4) {
        throw new Error("Cannot send to an IPv4 address without a bound IPv4 socket");
      }
      this.ip4.socket?.send(encodePacket(toId, packet), nodeAddr.port, nodeAddr.host);
    } else if (nodeAddr.family === 6) {
      if (!this.ip6) {
        throw new Error("Cannot send to an IPv6 address without a bound IPv6 socket");
      }
      this.ip6.socket?.send(encodePacket(toId, packet), nodeAddr.port, nodeAddr.host);
    }
  }

  addExpectedResponse(ipAddress: string): void {
    this.rateLimiter?.addExpectedResponse(ipAddress);
  }

  removeExpectedResponse(ipAddress: string): void {
    this.rateLimiter?.removeExpectedResponse(ipAddress);
  }

  getContactableAddr(enr: ENR): SocketAddress | undefined {
    return getSocketAddressOnENR(enr, this.ipMode);
  }

  private handleIncoming = (data: Buffer, rinfo: IRemoteInfo): void => {
    if (this.rateLimiter && !this.rateLimiter.allowEncodedPacket(rinfo.address)) {
      return;
    }

    const mu = multiaddr(`/${String(rinfo.family).endsWith("4") ? "ip4" : "ip6"}/${rinfo.address}/udp/${rinfo.port}`);

    let packet: IPacket;
    try {
      packet = decodePacket(this.srcId, data);
    } catch (e: unknown) {
      this.emit("decodeError", e as Error, mu);
      return;
    }

    this.emit("packet", mu, packet);
  };
}

async function openSocket(opts: MultiaddrObject): Promise<dgram.Socket> {
  const socket = dgram.createSocket({
    recvBufferSize: 16 * MAX_PACKET_SIZE,
    sendBufferSize: MAX_PACKET_SIZE,
    type: opts.family === 4 ? "udp4" : "udp6",
  });
  await new Promise((resolve) => socket.bind(opts.port, opts.host, resolve as () => void));
  return socket;
}

async function closeSocket(socket?: dgram.Socket): Promise<void> {
  if (!socket) return;
  return new Promise((resolve) => socket.close(resolve));
}
