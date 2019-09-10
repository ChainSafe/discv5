import { packet, PacketType } from "./packets";
import { encodePacket } from "./encode";
import { decodePacket } from "./decode";
import { promisify } from "es6-promisify";
import * as constants from "./constants";
import * as dgram from "dgram";


export interface SocketAddr {
  port: number;
  address: string;
}

export class Discv5Service {

  public socket: dgram.Socket;
  public recvBuffer: Buffer;
  public sendQueue: [SocketAddr, [packet, packetType]][];
  public whoAreYouMagic: Buffer;

  constructor(socketAddr: SocketAddr, whoAreYouMagic: buffer) {
     this.socket = dgram.createSocket("udp4");
     this.socket.bind(socketAddr.port, socketAddr.address0);
     this.socket.setRecvBufferSize(constants.PACKET_SIZE);
     this.socket.setSendBufferSize(constants.PACKET_SIZE);
  }

  send(to: SocketAddr, p: packet, pt: any): void {
    this.sendQueue.push([to, [p, pt]]); 
  }

  async poll(): Promise<[SocketAddr, [packet, packetType]]> {
    this.socket.send[promisify.argumentNames] = ["error"];
    const sendPacket = promisify(this.socket.send.bind(this.socket));
    while(this.sendQueue.length !== 0) {
      let [dst, [p, pt]] = this.sendQueue.shift();
      try {
        let res = sendPacket(encodePacket(p, pt), dst.port, dst.address);
      } catch (err) {
        // Didn't send
        this.sendQueue.insert(0, [dst, [p, pt]]);
        break;
      }
    }
    
    this.socket[promisify.argumentNames] = ["msg", "rinfo"];
    const on = promisify(this.socket.on.bind(this.socket));
    try {  
      let {msg, rinfo} = on("message");
      let decodedWhoAreYouPacket =  decodePayload(msg, PacketType.WhoAreYouPacket);
      let src = SocketAddr {rinfo.port, rinfo.address};
      return [src, [decodeWhoAreYouPacket, PacketType.WhoAreYouPacket]];
    } catch (err) {
      this.emit("error", err);
    }
  }
}
