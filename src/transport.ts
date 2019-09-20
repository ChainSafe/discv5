import * as dgram from "dgram";
import { promisify } from "es6-promisify";
import {EventEmitter} from "events";

import * as constants from "./constants";
import {
  decode,
  encode,
  Packet,
  PacketType,
} from "./packet";

export interface ISocketAddr {
  port: number;
  address: string;
}

export interface IRemoteInfo {
  address: string;
  family: "IPv4" | "IPv6";
  port: number;
  size: number;
}

/**
 * This class is responsible for encoding outgoing Packets and decoding incoming Packets
 */
export class TransportService extends EventEmitter {

  private socketAddr: ISocketAddr;
  private socket: dgram.Socket;
  private whoAreYouMagic: Buffer;

  public constructor(socketAddr: ISocketAddr, whoAreYouMagic: Buffer) {
    super();
    this.socketAddr = socketAddr;
    this.whoAreYouMagic = whoAreYouMagic;
    this.socket = dgram.createSocket({
      recvBufferSize: constants.PACKET_SIZE,
      sendBufferSize: constants.PACKET_SIZE,
      type: "udp4",
    });
  }

  public async start(): Promise<void> {
    this.socket.on("message", this.handleIncoming);
    return promisify(this.socket.bind.bind(this.socket))(this.socketAddr.port);
  }

  public async close(): Promise<void> {
    this.socket.off("message", this.handleIncoming);
    return promisify(this.socket.close.bind(this.socket))();
  }

  public async send(to: ISocketAddr, type: PacketType, packet: Packet): Promise<void> {
    return promisify(this.socket.send.bind(this.socket))(encode(type, packet), to.port, to.address);
  }

  public handleIncoming(data: Buffer, rinfo: IRemoteInfo): void {
    const sender = {
      address: rinfo.address,
      port: rinfo.port,
    };
    try {
      const [type, packet] = decode(data, this.whoAreYouMagic);
      this.emit("packet", sender, type, packet);
    } catch (e) {
      this.emit("error", e, sender);
    }
  }
}
