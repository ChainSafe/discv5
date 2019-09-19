import * as crypto from "chainsafe/libp2p-crypto";
import * as dgram from "dgram";
import { Secp256k1PrivateKey, Secp256k1PublicKey } from "libp2p-crypto-secp256k1";
import { sha256 } from "js-sha256";

import * as constants from "../constants";
import * as cryptoTypes from "../crypto/misc_crypto_types";
import { EthereumNodeRecord } from "../enr/enr";
import { NodeId } from "../enr/enr_types";
import {
  IAuthHeader,
  IAuthMessagePacket,
  IMessagePacket,
  IRandomPacket,
  IRegularPacket,
  IWhoAreYouPacket,
} from "../packet";
import * as sessionCrypto from "./session_crypto";
import { ISocketAddr } from "../transport";
import * as utils from "../utils";

export enum SessionStatus {
  WhoAreYouSent,
  RandomSent,
  Untrusted,
  Established,
}

export interface Keys {
  authRespKey: Buffer;
  encryptionKey: Buffer;
  decryptionKey: Buffer;
}

export class Session {
  public status: SessionStatus;
  public remoteENR: EthereumNodeRecord;
  public ephemPubKey: Buffer;
  public keys: Keys;
  public timeout: Promise<void>;
  public lastSeenSocket: ISocketAddr;

  public static newRandomSession(tag: Buffer, remoteEnr: EthereumNodeRecord): { session: Session, randomPacket: packet } {
    const randomPacket: IRandomPacket = {auth_tag: tag, random_data: crypto.randomBytes(44)};

    const session: Session = new Session();
    session.status = SessionStatus.RandomSent;
    session.remoteENR = remoteEnr;
    session.ephemPubKey = null;
    session.keys = {};
    session.timeout = null;
    session.lastSeenSocket = {};

    return { session, randomPacket };
  }

  public static newWhoAreYou(tag: Buffer, nodeId: NodeId, enrSeq: bigint, remoteEnr: EthereumNodeRecord, authTag: Buffer): {session: Session, whoAreYouPacket: packet} {
    let magic: Buffer = sha256(Buffer.concat([nodeId, constants.WHOAREYOU_STR]));
    let idNonce: Nonce = crypto.randomBytes(constants.ID_NONCE_LENGTH);

    let whoareyouPacket: IWhoAreYouPacket = {
      tag: tag,
      magic: magic,
      token: authTag,
      id_nonce: idNonce,
      enr_seq: enrSeq
    };

    let session: Session = new Session();
    session.status = SessionStatus.WhoAreYouSent;
    session.remoteENR = remoteEnr;
    session.ephemPubKey = null;
    session.keys = {};
    session.timeout = null;
    session.lastSeenSocket = {};

    return { session, whoareyouPacket };
  }

  public async generateKeys(localNodeId: NodeId, idNonce: Nonce): Promise<void> {
    const { encKey, decKey, authRepKey, ephemKey } = await sessionCrypto.generateSessionKeys();

    this.ephemPubKey = ephemKey;  
    this.keys = {
      encKey,
      decKey,
      authRepKey,
    };

    this.timeout = utils.delay(Date.now() + constants.SESSION_TIMEOUT);

    this.status = SessionStatus.Established;
  }

  public async encryptMsg(tag: Buffer, msg: Buffer): Promise<Packet> {
    const authTag: Buffer = crypto.randomBytes(constants.AUTH_TAG_LENGTH);

    const ciphertext = await sessionCrypto.encryptMsg(this.sessionKeys.encryptionKey, authTag, msg);

    let msgPacket: IMessagePacket = {
      tag: tag,
      message: msg,
      auth_tag: authTag,
    };

    return msgPacket;
  }

  public async encryptWithHeader(tag: Buffer, localNodeId: NodeId, idNonce: Nonce, authPt: Buffer, msg: Buffer): Promise<Packet> {
    await this.generateKeys(localNodeId, idNonce);
    const { authHeader, ciphertext } = await sessionCrypto.encryptWithHeader(
        this.keys.authResponseKey,
        this.keys.encryptionKey,
        authPt,
        msg,
        this.ephemPubKey,
        tag
    );

    const authMsg: IAuthMessagePacket = {
      tag: tag,
      auth_header: authHeader,
      message: msg
    } 

    return authMsg;
  }

  public static generateNonce(idNonce: Nonce): Nonce {
   return Buffer.concat([Buffer.from(constants.NONCE_STR), idNonce]);
  }

  public async establishFromHeader(
    tag: Buffer,
    localKeyPair: ENRKeyPair,
    localId: NodeId,
    remoteId: NodeId,
    idNonce: Nonce,
    authHeader: AuthHeader
  ): Promise<boolean> {
      let {decKey, encKey, authRespKey } = sessionCrypto.deriveKeysFromPubKey(
        localKeyPair,
        localId,
        remoteId,
        idNonce,
        auth_header.ephemeral_pubkey
      );

      let authResp = sessionCrypto.decryptAuthHeader(authRespKey, authHeader, tag);
      

      if (authResp) {
        if (this.remoteENR.sequenceNumber < authResp.node_record.sequenceNumber) {
          this.remoteENR = authResp.node_record;  
        }
      } else {
        // Didn't receive an updated ENR
        throw new Error("Invalid ENR");
      }

      let remotePubKey: Buffer = Buffer.alloc(constants.KEY_LENGTH);
      this.remoteENR.compressedPubKey.copy(remotePubKey);

      let verificationBool = await sessionCrypto.verifyAuthNonce(remotePubKey, this.generateNonce(idNonce), authResp.id_nonce_sig);

      if (!verificationBool) {
        // Invalid signature
        throw new Error("Invalid Auth Response signature");
      }

      authHeader.ephemeral_pubkey.copy(this.ephemPubKey);

      this.keys = Keys {
        encKey,
        authRespKey,
        decKey
      };

      this.timeout = utils.delay(Date.now() + constants.SESSION_TIMEOUT);
      
      this.status = SessionStatus.Untrusted;

      return this.updateTrusted();
  }

  public async decryptMsg(nonce: Buffer, msg: Buffer, aad: Buffer): Promise<Buffer> {
    return await sessionCrypto.decryptMsg(this.keys.decryptionKey, nonce, msg, aad);
  }

  public updateEnr(enr: EthereumNodeRecord): boolean {
    if (this.remoteENR.sequenceNumber < enr.sequenceNumber) {
      this.remoteENR = enr;
      return this.updateTrusted();
    }
    return false;
  }

  public updateTrusted(): boolean {
    if (this.status === SessionStatus.Untrusted) {
      if (this.lastSeenSocket === this.remoteENR.udp) {
        this.status = SessionStatus.Established;
        return true;
      }
    } else if (this.status === SessionStatus.Established) {
      if (this.lastSeenSocket !== this.remoteENR.udp) {
        this.status = SessionStatus.Untrusted;
      }
    }

    return false;
  }

  set lastSeenSocket(socket: ISocketAddr): void {
      this.lastSeenSocket = socket;
  }

  public incrementTimeout(millisecs: number): void {
      self.timeout = utils.delay(Date.now() + millisecs);
  }

  get timeout(): Promise<void> {
     return this.timeout;
  }

  get status(): SessionStatus {
     return this.status;
  }

  get remoteEnr(): EthereumNodeRecord {
    return this.remoteENR;
  }

  public isTrusted(): boolean {
    return(this.status === SessionStatus.Established;
  }

  public established(): boolean {
    switch(this.status) {
      case this.status.WhoAreYouSent:
        return false;
      case this.status.RandomSent:
        return false;
      case this.status.Established:
        return true;
      case this.status.Untrusted:
        return true;
    }
  }
}

