import * as dgram from "dgram";
import { EventEmitter } from "events";
import { Multiaddr, multiaddr } from "@multiformats/multiaddr";

import { decodePacket, encodePacket, getPacketNodeID, IPacket, MAX_PACKET_SIZE } from "../packet/index.js";
import { IRemoteInfo, ITransportService, TransportEventEmitter } from "./types.js";
import { IRateLimiter, RateLimiter } from "../rateLimit/index.js";

/**
 * This class is responsible for encoding outgoing Packets and decoding incoming Packets over UDP
 */
export class UDPTransportService
  extends (EventEmitter as { new (): TransportEventEmitter })
  implements ITransportService
{
  private socket!: dgram.Socket;

  public constructor(
    readonly multiaddr: Multiaddr,
    private readonly srcId: string,
    private readonly rateLimiter?: IRateLimiter
  ) {
    super();
    const opts = multiaddr.toOptions();
    if (opts.transport !== "udp") {
      throw new Error("Local multiaddr must use UDP");
    }
  }

  public async start(): Promise<void> {
    const opts = this.multiaddr.toOptions();
    this.socket = dgram.createSocket({
      recvBufferSize: 16 * MAX_PACKET_SIZE,
      sendBufferSize: MAX_PACKET_SIZE,
      type: opts.family === 4 ? "udp4" : "udp6",
    });
    this.socket.on("message", this.handleIncoming);
    return new Promise((resolve) => this.socket.bind(opts.port, opts.host, resolve));
  }

  public async stop(): Promise<void> {
    this.socket.off("message", this.handleIncoming);
    return new Promise((resolve) => this.socket.close(resolve));
  }

  public async send(to: Multiaddr, toId: string, packet: IPacket): Promise<void> {
    const nodeAddr = to.toOptions();
    return new Promise((resolve) =>
      this.socket.send(encodePacket(toId, packet), nodeAddr.port, nodeAddr.host, () => resolve())
    );
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

    const nodeId = getPacketNodeID(packet)
    if (this.rateLimiter && nodeId !== null && !this.rateLimiter.allowDecodedPacket(rinfo.address, nodeId)) {
      return;
    }

    this.emit("packet", mu, packet);
  };
}
