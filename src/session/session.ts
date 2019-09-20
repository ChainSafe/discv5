import * as crypto from "chainsafe/libp2p-crypto";
import * as dgram from "dgram";
import { sha256 } from "js-sha256";
import { Secp256k1PrivateKey, Secp256k1PublicKey } from "libp2p-crypto-secp256k1";

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
  Packet,
} from "../packet";
import { ISocketAddr } from "../transport";
import * as utils from "../utils";
import * as sessionCrypto from "./session_crypto";

export enum SessionStatus {
  /**
   * A WHOAREYOU packet has been sent, and the Session is awaiting an Authentication response.
   */
  WhoAreYouSent,
  /**
   * A RANDOM packet has been sent and the Session is awaiting a WHOAREYOU response.
   */
  RandomSent,
  /**
   * A Session has been established, but the IP address of the remote ENR does not match the IP
   * of the source. In this state, the service will respond to requests, but does not treat the node as
   * connected until the IP is updated to match the source IP.
   */
  Untrusted,
  /**
   * A Session has been established and the ENR IP matches the source IP.
   */
  Established,
}

export interface IKeys {
  authRespKey: Buffer;
  encryptionKey: Buffer;
  decryptionKey: Buffer;
}

export class Session {

  public static newRandomSession(
    tag: Buffer,
    remoteEnr: EthereumNodeRecord,
  ): { session: Session, randomPacket: Packet } {
    const randomPacket: IRandomPacket = {tag, randomData: crypto.randomBytes(44)};

    const session: Session = new Session();
    session.status = SessionStatus.RandomSent;
    session.remoteENR = remoteEnr;
    session.ephemPubKey = null;
    session.keys = {};
    session.timeout = null;
    session.lastSeenSocket = {};

    return { session, randomPacket };
  }

  public static newWhoAreYou(tag: Buffer, nodeId: NodeId, enrSeq: bigint, remoteEnr: EthereumNodeRecord, authTag: Buffer): {session: Session, whoAreYouPacket: Packet} {
    const magic: Buffer = sha256(Buffer.concat([nodeId, constants.WHOAREYOU_STR]));
    const idNonce: Nonce = crypto.randomBytes(constants.ID_NONCE_LENGTH);

    const whoareyouPacket: IWhoAreYouPacket = {
      tag,
      magic,
      token: authTag,
      idNonce,
      enrSeq,
    };

    const session = new Session();
    session.status = SessionStatus.WhoAreYouSent;
    session.remoteENR = remoteEnr;
    session.ephemPubKey = null;
    session.keys = {};
    session.timeout = null;
    session.lastSeenSocket = {};

    return { session, whoareyouPacket };
  }

  public static generateNonce(idNonce: Nonce): Nonce {
   return Buffer.concat([Buffer.from(constants.NONCE_STR), idNonce]);
  }

  public status: SessionStatus;
  public remoteENR: EthereumNodeRecord;
  public ephemPubKey: Buffer;
  public keys: IKeys;
  public timeout: Promise<void>;
  public lastSeenSocket: ISocketAddr;

  public async generateKeys(localNodeId: NodeId, idNonce: Nonce): Promise<void> {
    const { encKey, decKey, authRepKey, ephemKey } = await sessionCrypto.generateSessionKeys();

    this.ephemPubKey = ephemKey;  
    this.keys = {
      encryptionKey: encKey,
      decryptionKey: decKey,
      authRespKey: authRepKey,
    };

    this.timeout = utils.delay(Date.now() + constants.SESSION_TIMEOUT);

    this.status = SessionStatus.Established;
  }

  public async encryptMsg(tag: Buffer, msg: Buffer): Promise<Packet> {
    const authTag: Buffer = crypto.randomBytes(constants.AUTH_TAG_LENGTH);

    const ciphertext = await sessionCrypto.encryptMsg(this.keys.encryptionKey, authTag, msg);

    const msgPacket: IMessagePacket = {
      tag,
      authTag,
      message: msg,
    };

    return msgPacket;
  }

  public async encryptWithHeader(
    tag: Buffer,
    localNodeId: NodeId,
    idNonce: Nonce,
    authPt: Buffer,
    msg: Buffer,
  ): Promise<Packet> {
    await this.generateKeys(localNodeId, idNonce);
    const { authHeader, ciphertext } = await sessionCrypto.encryptWithHeader(
      this.keys.authRespKey,
      this.keys.encryptionKey,
      authPt,
      msg,
      this.ephemPubKey,
      tag,
    );

    const authMsg: IAuthMessagePacket = {
      tag,
      authHeader,
      message: msg,
    };

    return authMsg;
  }

  public async establishFromHeader(
    tag: Buffer,
    localKeyPair: ENRKeyPair,
    localId: NodeId,
    remoteId: NodeId,
    idNonce: Nonce,
    authHeader: IAuthHeader,
  ): Promise<boolean> {
      const {decKey, encKey, authRespKey } = sessionCrypto.deriveKeysFromPubKey(
        localKeyPair,
        localId,
        remoteId,
        idNonce,
        authHeader.ephemeralPubkey,
      );

      const authResp = await sessionCrypto.decryptAuthHeader(authRespKey, authHeader, tag);

      if (authResp) {
        if (this.remoteENR.sequenceNumber < authResp.node_record.sequenceNumber) {
          this.remoteENR = authResp.node_record;
        }
      } else {
        // Didn't receive an updated ENR
        throw new Error("Invalid ENR");
      }

      const remotePubKey: Buffer = Buffer.alloc(constants.KEY_LENGTH);
      this.remoteENR.compressedPubKey.copy(remotePubKey);

      const verificationBool = await sessionCrypto.verifyAuthNonce(
        remotePubKey,
        this.generateNonce(idNonce),
        authResp.id_nonce_sig,
      );

      if (!verificationBool) {
        // Invalid signature
        throw new Error("Invalid Auth Response signature");
      }

      authHeader.ephemeralPubkey.copy(this.ephemPubKey);

      this.keys = {
        encryptionKey: encKey,
        decryptionKey: decKey,
        authRespKey,
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
    return this.status === SessionStatus.Established;
  }

  public established(): boolean {
    switch (this.status) {
      case SessionStatus.WhoAreYouSent:
        return false;
      case SessionStatus.RandomSent:
        return false;
      case SessionStatus.Established:
        return true;
      case SessionStatus.Untrusted:
        return true;
    }
  }
}
