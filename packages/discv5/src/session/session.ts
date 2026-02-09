import {ENR, type NodeId} from "@chainsafe/enr";
import {randomBytes} from "@noble/hashes/utils.js";
import {type IKeypair, createKeypair} from "../keypair/index.js";
import type {RequestId} from "../message/index.js";
import {
  type IPacket,
  MASKING_IV_SIZE,
  PacketType,
  createHeader,
  encodeChallengeData,
  encodeHandshakeAuthdata,
  encodeMessageAuthdata,
} from "../packet/index.js";
import {decryptMessage, deriveKeysFromPubkey, encryptMessage, generateSessionKeys, idSign, idVerify} from "./crypto.js";
import {type NodeContact, getNodeId, getPublicKey} from "./nodeInfo.js";
import type {IChallenge, IKeys} from "./types.js";

// The `Session` struct handles the stages of creating and establishing a handshake with a
// peer.
//
// There are two ways a Session can get initialised.
//
// - An RPC request to an unknown peer is requested by the application.
// In this scenario, a packet with random message data is sent to the unknown peer.
// - A message was received from an unknown peer and we start the `Session` by sending a
// WHOAREYOU message.
//
// This `Session` module is responsible for generating, deriving and holding keys for sessions for known peers.

interface ISessionOpts {
  keys: IKeys;
}

const ERR_NO_ENR = "No available session ENR";
export const ERR_INVALID_SIG = "Invalid signature";

/**
 * A Session containing the encryption/decryption keys. These are kept individually for a given
 * node.
 */
export class Session {
  /** The current keys used to encrypt/decrypt messages. */
  keys: IKeys;
  /**
   * If a new handshake is being established, these keys can be tried to determine if this new
   * set of keys is canon.
   */
  awaitingKeys?: IKeys;
  /**
   * If we contacted this node without an ENR, i.e. via a multiaddr, during the session
   * establishment we request the nodes ENR. Once the ENR is received and verified, this session
   * becomes established.
   *
   * This field holds the request_id associated with the ENR request.
   */
  awaitingEnr?: RequestId;

  constructor({keys}: ISessionOpts) {
    this.keys = keys;
  }

  /**
   * Generates session keys from a handshake authdata.
   * If the IP of the ENR does not match the source IP address, the session is considered untrusted.
   * The output returns a boolean which specifies if the Session is trusted or not.
   */
  static establishFromChallenge(
    localKey: IKeypair,
    localId: NodeId,
    remoteId: NodeId,
    challenge: IChallenge,
    idSignature: Uint8Array,
    ephPubkey: Uint8Array,
    enrRecord?: Uint8Array
  ): [Session, ENR] {
    let enr: ENR;
    // check and verify a potential ENR update
    if (enrRecord?.length) {
      const newRemoteEnr = ENR.decode(enrRecord);
      if (challenge.remoteEnr) {
        if (challenge.remoteEnr.seq < newRemoteEnr.seq) {
          enr = newRemoteEnr;
        } else {
          enr = challenge.remoteEnr;
        }
      } else {
        enr = newRemoteEnr;
      }
    } else if (challenge.remoteEnr) {
      enr = challenge.remoteEnr;
    } else {
      throw new Error(ERR_NO_ENR);
    }

    // verify the auth header nonce
    if (
      !idVerify(
        createKeypair({publicKey: enr.publicKey, type: enr.keypairType}),
        challenge.data,
        ephPubkey,
        localId,
        idSignature
      )
    ) {
      throw new Error(ERR_INVALID_SIG);
    }

    // The keys are derived after the message has been verified to prevent potential extra work
    // for invalid messages.

    // generate session keys
    const [decryptionKey, encryptionKey] = deriveKeysFromPubkey(localKey, localId, remoteId, ephPubkey, challenge.data);
    const keys = {decryptionKey, encryptionKey};

    return [new Session({keys}), enr];
  }

  /**
   * Encrypts a message and produces an handshake packet.
   */
  static encryptWithHeader(
    remoteContact: NodeContact,
    localKey: IKeypair,
    localNodeId: NodeId,
    updatedEnr: Uint8Array | null,
    challengeData: Uint8Array,
    message: Uint8Array
  ): [IPacket, Session] {
    // generate session keys
    const [encryptionKey, decryptionKey, ephPubkey] = generateSessionKeys(
      localNodeId,
      getNodeId(remoteContact),
      getPublicKey(remoteContact),
      challengeData
    );
    const keys = {decryptionKey, encryptionKey};

    // construct nonce signature
    const idSignature = idSign(localKey, challengeData, ephPubkey, getNodeId(remoteContact));

    // create authdata
    const authdata = encodeHandshakeAuthdata({
      ephKeySize: 33,
      ephPubkey,
      idSignature,
      record: updatedEnr || undefined,
      sigSize: 64,
      srcId: localNodeId,
    });

    const header = createHeader(PacketType.Handshake, authdata);
    const maskingIv = randomBytes(MASKING_IV_SIZE);
    const aad = encodeChallengeData(maskingIv, header);

    // encrypt the message
    const messageCiphertext = encryptMessage(keys.encryptionKey, header.nonce, message, aad);

    return [
      {
        header,
        maskingIv,
        message: messageCiphertext,
      },
      new Session({keys}),
    ];
  }

  /**
   * A new session has been established. Update this session based on the new session.
   */
  update(newSession: Session): void {
    this.awaitingKeys = newSession.keys;
    this.awaitingEnr = newSession.awaitingEnr;
  }

  /**
   * Uses the current `Session` to encrypt a message.
   * Encrypt packets with the current session key if we are awaiting a response from an
   * IAuthMessagePacket.
   */
  encryptMessage(srcId: NodeId, _destId: NodeId, message: Uint8Array): IPacket {
    const authdata = encodeMessageAuthdata({srcId});
    const header = createHeader(PacketType.Message, authdata);
    const maskingIv = randomBytes(MASKING_IV_SIZE);
    const aad = encodeChallengeData(maskingIv, header);
    const ciphertext = encryptMessage(this.keys.encryptionKey, header.nonce, message, aad);
    return {
      header,
      maskingIv,
      message: ciphertext,
    };
  }

  /**
   * Decrypts an encrypted message.
   * If a Session is already established, the original decryption keys are tried first,
   * upon failure, the new keys are attempted. If the new keys succeed,
   * the session keys are updated along with the Session state.
   */
  decryptMessage(nonce: Uint8Array, message: Uint8Array, aad: Uint8Array): Uint8Array {
    // try with the new keys
    if (this.awaitingKeys) {
      const newKeys = this.awaitingKeys;
      this.awaitingKeys = undefined;
      try {
        const result = decryptMessage(newKeys.decryptionKey, nonce, message, aad);
        this.keys = newKeys;
        return result;
      } catch {
        //
      }
    }
    return decryptMessage(this.keys.decryptionKey, nonce, message, aad);
  }
}
