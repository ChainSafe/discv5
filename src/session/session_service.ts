import * as crypto from "chainsafe/libp2p-crypto";
import * as dgram from "dgram";
import { promisify } from "es6-promisify";
import EvenEmitter from "events";
import { sha256 } from "js-sha256";
import * as constants from "../constants";
import { Discv5Service, ISocketAddr } from "../discv5_service";
import { AuthHeader, AuthResponseMessage, IRandomPacket, IWhoAreYouPacket, packet, PacketType } from "../packets";
import * as utils from "../utils";
import * as cryptoTypes from "./crypto/misc_crypto_types";
import { encodePacket } from "./encode";
import { EthereumNodeRecord } from "./enr/enr";
import { ENRKeyPair } from "./enr/enr_keypair";
import { NodeId } from "./enr/enr_types";
import { decode, encode, IMessage, IRequest, newRequest } from "./rpc";
import { Session, SessionStatus } from "./session";

class SessionService extends EventEmitter {

    public enr: EthereumNodeRecord;
    public keypair: ENRKeyPair;
    public pendingRequest: Map<NodeId, IRequest[]>;
    public whoAreYouRequest: Map<NodeId, IRequest>;
    public pendingMessages: Map<NodeId, IMessage[]>;
    public sessions: Map<NodeId, Session>;
    public service: Discv5Service;

    constructor(enr: Enr, keypair: ENRKeyPair, ip: string) {
      if (enr.uncompressedPubKey !== keypair.UncompressedPublicKey) {
        throw new Error("Discv5: Both provided keypairs don't match");
      }

      const udpPort: number = enr.udp;
      const socketAddr: ISocketAddr = { port: udpPort, address: ip };
      const magic: Buffer = sha256(Buffer.concat([ enr.nodeId, Buffer.from("WHOAREYOU")]));

      this.enr = enr;
      this.keypair = keypair;
      this.pendingRequest = new Map();
      this.whoareyouRequest = new Map();
      this.pendingMessages = new Map();
      this.sessions = new Map();
      this.service = new Discv5Service(socketAddr, magic);
    }

    get enr(): EthereumNodeRecord {
       return this.enr;
    }

    set udpSocket(socketAddr: ISocketAddr): void {
      this.enr.ipV4 = socketAddr.address;
      this.enr.udp = socketAddr.port;
      this.enr.sequenceNumber += 1;
    }

    public updateEnr(enr: EthereumNodeRecord): void {
      const session = this.sessions.get(enr.nodeId);
      if (session.updateEnr(enr)) {
        this.emit("Session::Established", enr);
      }
    }

    public async sendRequest(dstEnr: EthereumNodeRecord, msg: IMessage): Promise<void> {
      const dstNodeId = dstEnr.nodeId;
      let dstPort = dstEnr.udp;
      let dstIpAddr = dstEnr.ipV4;
      let socketAddr = ISocketAddr { dstPort, dstIpAddr};

      const session = this.sessions.get(dstNodeId);
      if ((session !== null) && !session.established()) {
        // Waiting for session to be established. Caching message
        const msgs = this.pendingMessages.get(dstNodeId);
        msgs.push(msg);
        this.pendingMessages.set(dstNodeId, msgs);
      } else if (session === null) {
          // No session established. Send random packet
          const msgs = this.pendingMessages.get(dstNodeId);
          msgs.push(message);
          this.pendingMessages.set(dstNodeId, msgs);
          const {s, p} = Session.newRandomSession(this.tag(dstNodeId), dstEnr);
          const req = newRequest(dstEnr, p, null);
          this.processRequest(dstNodeId, req);
          this.sessions.set(dstNodeId, s);
      }

      if (!session.isTrusted()) {
        throw new Error("Session not established. Trying to send request to untrusted node");
      }

      const p = await session.encryptMsg(this.tag(dstNodeId), encode(message));

      const req = newRequest(socketAddr, p, message);

      this.processRequest(dstNodeId, req);
    }

   public async sendRequestUnknownEnr(dstSocketAddr: ISocketAddr, dstNodeId: NodeId, message: IMessage): Promise<void> {
      const session = this.sessions.get(dstNodeID);
      if (!session) {
        throw new Error("Session is not established");
      }

      const packet = await session.encryptMsg(this.tag(dstNodeId), encode(message));

      const req = newRequest(dstSocketAddr, packet, message);
      this.processRequest(dstNodeId, req);
   }

   public async sendResponse(dstSocketAddr: ISocketAddr, dstId: NodeId, msg: IMessage): Promise<void> {
     const session = this.session.get(dstId);
     if (!session) {
       throw new Error("Session is not established");
     }

     const p = await session.encryptMsg(this.tag(dstId), encode(msg));
     this.service.send(dstSocketAddr, p);
   }

   public async sendWhoAreYou(dstSocketAddr: ISocketAddr, nodeId: NodeId, enrSeq: bigint, remoteEnr: EthereumNodeRecord, authTag: Buffer) {
     const s = this.sessions.get(nodeId);
     if (s.established() || s.status == SessionStatus.WhoAreYouSent) {
       return;
     }

     const { session, p } = Session.newWhoAreYou(this.tag(nodeId), nodeId, enrSeq, remoteEnr, authTag);
     this.sessions.set(nodeId, session);
     const req = newRequest(dstSocketAddr, p, null);
     this.processRequest(nodeId, req);
   }

   public srcId(tag: Buffer): NodeId {
     const hash = sha256(this.enr.nodeId);
     const srcId: NodeId = Buffer.alloc(constants.NODE_ID_LENGTH);
     for (let i = 0; i < 32; i++) {
       srcId[i] = hash[i] ^ tag[i];
     }
     return srcId;
   }

   public tag(dstId: NodeId): Buffer {
     const hash = sha256(dstId);
     const tag: Buffer = Buffer.alloc(constants.TAG_LENGTH);
     for (let i = 0; i < constants.TAG_LENGTH; i++) {
         tag[i] = hash[i] ^ this.enr.nodeId[i];
       }
     return tag;
   }

   public async handleWhoAreYou(src: ISocketAddr, srcId: NodeId, token: Buffer, idNonce: cryptoTypes.Nonce, enrSeq: bigint): Promise<void> {
     const knownReqs = this.pendingRequests.get(srcId);
     const pos = knownReqs.findIndex((x) => x.packet.auth_tag === token);
     let req = knownReqs.splice(pos, pos + 1);

     if (src !== req.destinationAddr) {
       knownReqs.push(req);
       this.pendingRequest.set(srcId, knownReqs);
       throw new Error("Incorrect WHOAREYOU packet source");
     }

     const tag = this.tag(srcId);
     const session = this.sessions.get(srcId);
     let msg: IMessage;
     if (req.packet instanceof IRandomPacket) {
       const msgs = this.pendingMessages.get(srcId);
       if (msgs.length === 0) {
         throw new Error("No pending messages found for WHOAREYOU request");
       }

       msg = msgs.shift();
       this.pendingMessages.set(srcId, msgs);
     } else {
       msg = req.message;
     }

     session.setLastSeenSocket(src);

     const nonce = Session.generateNonce(idNonce);
     const sig = await this.keypair.sign(nonce);

     let updatedEnr: EthereumNodeRecord = null;
     if (enrSeq < this.enr.sequenceNumber) {
       updatedEnr = this.enr;
     }

     const authPartObj: IAuthResponseMessage = {
       version: 5,
       id_nonce_sig: sig,
       node_record: [updatedEnr],
     };
     const authPart = encodePacket(authPartObj, PacketType.AuthResponsePacket);

     let authPacket: IAuthMessagePacket;
     try {
       authPacket = await ession.encryptWithHeader(
         tag,
         this.enr.nodeId,
         idNonce,
         authPart,
         encode(msg),
       );
     } catch (err) {
       this.pendingMessages.set(srcId, [msg]);
       return err;
     }

     this.emit("session::established", srcId, session.remoteEnr);

     const req = newRequest(src, authPacket, msg);
     await this.processRequest(srcId, req);
     await this.flushMessages(src, srcId);
   }

   public async handleAuthMsg(src: ISocketAddr, tag: Buffer, authHeader: AuthHeader, msg: Buffer): Promise<void> {
     const srcId = this.srcId(tag);

     const session = this.sessions.get(srcId);
     if (session.status === SessionStatus.WhoAreYouSent) {
       throw new Error("Dropping due to receiving authentication header without a known WHOAREYOu session");
     }

     const req = this.whoAreYouRequests.get(srcId);
     let res = this.whoAreYouRequests.delete(srcId);
     if (!res) {
       throw new Error("There was no WHOAREYOU request associated with a session");
     }

     if (src !== req.destinationAddr) {
       this.whoAreYouRequests.set(srcId, req);
       throw new Error("Expected src and referenced request must be the same");
     }

     let idNonce: cryptoTypes.Nonce;
     if (req.packet instanceof IWhoAreYouPacket) {
       idNonce = req.packet.id_nonce;
     } else {
       throw new Error("Coding error if there's no WHOAREYOU packet in this request");
     }

     session.setLastSeenSocket(src);

     res = session.establishFromHeader(tag, this.keypair, this.enr.nodeId, srcId, idNonce, authHeader);
     try {
       if (res) {
         this.emit("session::established", srcId, session.remoteEnr);
       }
       // Otherwise, do nothing since this is an untrusted session
     } catch (err) {
       this.sessions.delete(srdId);
       this.pendingMessages.delete(srcId);
     }

     let aad: Buffer = Buffer.alloc(constants.TAG_LENGTH);
     tag.copy(aad);
     aad = Buffer.concat([aad, encodeAuthHeader(authHeader)]);
     await this.handleMsg(src, srcId, authHeader.auth_tag, msg, aad);
     await this.flushMessages(src, srcId);
   }

   public async handleMsg(src: ISocketAddr, srcId: NodeId, authTag: Buffer, msg: Buffer, aad: Buffer): Promise<void> {
     const session = this.sessions.get(srcId);
     if (!session) {
       this.emit("session::WhoAreYouRequest", src, srcId, authTag);
       return;
     }

     if (!session.established()) {
       if (session.status === SessionStatus.RandomSent) {
         this.emit("session::WhoAreYouRequest", src, srcId, authTag);
       } else {
         // wait for a session to be generated. Might be a good idea to decrypt the packet and store it
       }
       return;
     }

     session.setLastSeenSocket(src);
     if (session.updatedTrusted) {
       this.emit("session::established", srcId, session.remoteEnr);
     }

     let message: Buffer = await session.decryptMsg(authTag, msg, aad);
     try {
       message = decode(message);
     } catch (err) {
       this.emit("session::WhoAreYouRequest", src, srcId, authTag);
       throw new Error();
     }

     const knownReqs = this.pendingRequests.get(srcId);
     const pos = knownReqs.findIndex((req) => req.id === message.id);
     if (pos) {
       this.emit("requestId::removed", message.id);
       known_reqs.splice(pos, pos + 1);
     }

     this.emit("message::received", message, srcId, src);

   }

   public async flushMessages(dstSocketAddr: ISocketAddr, dstId: NodeId): Promise<void> {
     const requestsToSend = [];

     const session = this.sessions.get(dstId).established() ? this.sessions.get(dstId) : (function() { throw new Error("no session"); });

     const tag = this.tag(dstId);

     const msgs = this.pendingMessages.get(dstId);
     this.pendingMessages.delete(dstId);

     for (msg in msgs) {
       const p = await session.encryptMsg(tag, encode(msg));
       const req = newRequest(dst, p, msg);
       requestsToSend.push(req);
     }

     for (r in requestsToSend) {
       this.processRequest(dstId, r);
     }
   }

   public async processRequest(nodeId: NodeId, request: IRequest): Promise<void> {
     this.service.send(request.destination, request.packet);

     if (request.packet instanceof IWhoAreYouPacket) {
       this.whoAreYouRequests.set(nodeId, request);
     } else {
       this.pendingRequests.set(nodeId, this.pendingRequests.get(nodeId).push(request));
     }
   }

   public async checkTimeouts(): Promise<void> {
     for (const [nodeId, requests] of this.pendingRequests) {
        const expiredRequests = [];

        for (const [pos, req] in requests.entries()) {
        try {
          const res = await req.timeout();
          if (req.retries >= constants.REQUEST_RETRIES) {
            // RPC expired
            switch (req.packet) {
              case req.packet instanceof IRandomPacket:
                const pm = this.pendingMessages.get(nodeId);
                this.pendingMessages.delete(nodeId);

                for (msg of pm) {
                  this.emit("session::requestFailed", nodeId, msg.id);
                }

                this.sessions.delete(nodeId);
              case req.packet instanceof IAuthMessage:
              case req.packet instanceof IMessage:
              case req.packet instanceof IWhoAreYouPacket

            }
          }

        } catch (err) {

        }
     }

   }

     async; poll(); : Promise < void > {

   };
}
