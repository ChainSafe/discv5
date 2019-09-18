import {
  AuthHeader,
  IAuthMessagePacket,
  IMessagePacket,
  IRandomPacket,
  IRegularPacket,
  IWhoAreYouPacket,
} from "../packets";

import * as crypto from "chainsafe/libp2p-crypto";
import * as dgram from "dgram";
import { sha256 } from "js-sha256";
import { Secp256k1PrivateKey, Secp256k1PublicKey } from "libp2p-crypto-secp256k1";
import * as constants from "../constants";
import * as cryptoTypes from "../crypto/misc_crypto_types";
import { ISocketAddr } from "../discv5_service";
import { EthereumNodeRecord } from "../enr/enr";
import { NodeId } from "../enr/enr_types";
import * as utils from "../utils";
import * as sessionCrypto from "./session_crypto";

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


  public static newRandomSession(tag: Buffer, remoteEnr: EthereumNodeRecord): { session: Session, randomPacket: packet } {
    let randomPacket = IRandomPacket {auth_tag: tag, random_data: crypto.randomBytes; (44); }  public status: SessionStatus;
  public remoteENR: EthereumNodeRecord;
  public ephemPubKey: Buffer;
  public keys: Keys;
  public timeout: Promise<void>;
  public lastSeenSocket: ISocketAddr;

const session: Session = new Session();
session; .status = SessionStatus.RandomSent;
session; .remoteENR = remoteEnr;
session; .ephemPubKey = null;
session; .keys = {};
session; .timeout = null;
session; .lastSeenSocket = {};

return { session, randomPacket };
  }

  static newWhoAreYou(tag: Buffer, nodeId: NodeId, enrSeq: bigint, remoteEnr: EthereumNodeRecord, authTag: Buffer); : {session: Session, whoAreYouPacket; : packet; } {
    let magic: Buffer = sha256(Buffer.concat([nodeId, constants.WHOAREYOU_STR]));
    let idNonce: Nonce = crypto.randomBytes(constants.ID_NONCE_LENGTH);

    let whoareyouPacket = IWhoAreYouPacket {
      tag: tag,
      magic: magic,
      token: authTag,
      id_nonce: idNonce,
      enr_seq: enrSeq,
    };

    const session: Session = new Session();
    session.status = SessionStatus.WhoAreYouSent;
    session.remoteENR = remoteEnr;
    session.ephemPubKey = null;
    session.keys = {};
    session.timeout = null;
    session.lastSeenSocket = {};

    return { session, whoareyouPacket };
  }

async; generateKeys(localNodeId: NodeId, idNonce: Nonce); : Promise < void > {
    let; { encKey, decKey, authRepKey, ephemKey; } = await sessionCrypto.generateSessionKeys();

this.ephemPubKey = ephemKey;
this.keys = Keys; {
      encKey,
      decKey,
      authRepKey, ;
    }

this.timeout = utils.delay(Date.now() + constants.SESSION_TIMEOUT);

this.status = SessionStatus.Established;
  }

async; encryptMsg(tag: Buffer, msg: Buffer); : Promise < packet > {
    let authTag: Buffer = crypto.randomBytes(constants.AUTH_TAG_LENGTH);

    let ciphertext: Buffer = await sessionCrypto.encryptMsg(this.sessionKeys.encryptionKey, authTag, msg);

    let msgPacket = IMessagePacket; {
      tag: tag,
      message; : msg,
      auth_tag; : authTag;
    }

return msgPacket;
  }

async; encryptWithHeader(tag: Buffer, localNodeId: NodeId, idNonce: Nonce, authPt: Buffer, msg: Buffer); : Promise < packet > {
    await this.generateKeys(localNodeId, idNonce);
{ authHeader, ciphertext; } = await sessionCrypto.encryptWithHeader(
        this.keys.authResponseKey,
        this.keys.encryptionKey,
        authPt,
        msg,
        this.ephemPubKey,
        tag,
    );

let authMsg = IAuthMessagePacket {
      tag: tag,
      auth_header: authHeader,
      message: msg,
    };

return authMsg;
  }

  static generateNonce(idNonce: Nonce); : Nonce; {
   return Buffer.concat([Buffer.from(constants.NONCE_STR), idNonce]);
  }

async; establishFromHeader(
    tag: Buffer,
    localKeyPair: ENRKeyPair,
    localId: NodeId,
    remoteId: NodeId,
    idNonce: Nonce,
    authHeader: AuthHeader,
  ); : Promise < boolean > {
      let; {decKey, encKey, authRespKey; } = sessionCrypto.deriveKeysFromPubKey(
        localKeyPair,
        localId,
        remoteId,
        idNonce,
        auth_header.ephemeral_pubkey,
      );

const authResp = sessionCrypto.decryptAuthHeader(authRespKey, authHeader, tag);

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

const verificationBool = await sessionCrypto.verifyAuthNonce(remotePubKey, this.generateNonce(idNonce), authResp.id_nonce_sig);

if (!verificationBool) {
        // Invalid signature
        throw new Error("Invalid Auth Response signature");
      }

authHeader.ephemeral_pubkey.copy(this.ephemPubKey);

this.keys = Keys; {
        encKey,
        authRespKey,
        decKey;
      }

this.timeout = utils.delay(Date.now() + constants.SESSION_TIMEOUT);

this.status = SessionStatus.Untrusted;

return this.updateTrusted();
  }

async; decryptMsg(nonce: Buffer, msg: Buffer, aad: Buffer); : Promise < Buffer > {
      return await sessionCrypto.decryptMsg(this.keys.decryptionKey, nonce, msg, aad); ,
  };

updateEnr(enr: EthereumNodeRecord); : boolean; {
      if (this.remoteENR.sequenceNumber < enr.sequenceNumber) {
        this.remoteENR = enr;
        return this.updateTrusted();
      }
      return false;
  }

updateTrusted(); : boolean; {
      if (self.status === SessionStatus.Untrusted) {
          if (self.lastSeenSocket === this.remoteENR.udp) {
             self.status = SessionStatus.Established;
             return true;
          }
      } else if (this.status === SessionStatus.Established) {
          if (self.lastSeenSocket !== this.remoteENR.udp) {
             self.status = SessionStatus.Untrusted;
          }

      }

      return false;
  }

set; lastSeenSocket(socket: ISocketAddr); : void {
      this.lastSeenSocket = socket; ,
  };

incrementTimeout(millisecs: number); : void {
      self.timeout = utils.delay(Date.now() + millisecs); ,
  };

get; timeout(); : Promise < void > {
     return this.timeout; ,
  };

get; status(); : SessionStatus; {
     return this.status;
  }

get; remoteEnr(); : EthereumNodeRecord; {
    return this.remoteENR;
  }

isTrusted(); : boolean; {
    if (status.Established) {
      return true;
    } else {
      return false;
    }
  }

established(); : boolean; {
    switch (this.status) {
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
