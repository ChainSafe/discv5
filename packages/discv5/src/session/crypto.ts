import Crypto from "node:crypto";
import { NodeId } from "@chainsafe/enr";

import { generateKeypair, IKeypair, createKeypair } from "../keypair/index.js";
import { getDiscv5Crypto } from "../util/crypto.js";
import { concatBytes, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

// Implementation for generating session keys in the Discv5 protocol.
// Currently, Diffie-Hellman key agreement is performed with known public key types. Session keys
// are then derived using the HKDF (SHA2-256) key derivation function.
//
// There is no abstraction in this module as the specification explicitly defines a singular
// encryption and key-derivation algorithms. Future versions may abstract some of these to allow
// for different algorithms.

const KEY_AGREEMENT_STRING = "discovery v5 key agreement";
const ID_SIGNATURE_TEXT = "discovery v5 identity proof";
const KEY_LENGTH = 16;
export const MAC_LENGTH = 16;

// Generates session keys for a challengeData and remote ENR. This currently only
// supports Secp256k1 signed ENR's.
// Returns [initiatorKey, responderKey, ephemPK]
export function generateSessionKeys(
  localId: NodeId,
  remoteId: NodeId,
  remotePubkey: IKeypair,
  challengeData: Uint8Array
): [Uint8Array, Uint8Array, Uint8Array] {
  const ephemKeypair = generateKeypair(remotePubkey.type);
  const secret = ephemKeypair.deriveSecret(remotePubkey);
  /* TODO possibly not needed, check tests
  const ephemPubkey =
    remoteKeypair.type === "secp256k1"
      ? secp256k1PublicKeyToCompressed(ephemKeypair.publicKey)
      : ephemKeypair.publicKey;
  */
  return [...deriveKey(secret, localId, remoteId, challengeData), ephemKeypair.publicKey] as [
    Uint8Array,
    Uint8Array,
    Uint8Array
  ];
}

export function deriveKey(
  secret: Uint8Array,
  firstId: NodeId,
  secondId: NodeId,
  challengeData: Uint8Array
): [Uint8Array, Uint8Array] {
  const info = concatBytes(utf8ToBytes(KEY_AGREEMENT_STRING), hexToBytes(firstId), hexToBytes(secondId));
  const output = getDiscv5Crypto().hkdf.expand(
    getDiscv5Crypto().sha256,
    getDiscv5Crypto().hkdf.extract(getDiscv5Crypto().sha256, secret, challengeData),
    info,
    2 * KEY_LENGTH
  );
  return [output.slice(0, KEY_LENGTH), output.slice(KEY_LENGTH, 2 * KEY_LENGTH)];
}

export function deriveKeysFromPubkey(
  kpriv: IKeypair,
  localId: NodeId,
  remoteId: NodeId,
  ephemPK: Uint8Array,
  challengeData: Uint8Array
): [Uint8Array, Uint8Array] {
  const secret = kpriv.deriveSecret(createKeypair({ type: kpriv.type, publicKey: ephemPK }));
  return deriveKey(secret, remoteId, localId, challengeData);
}

// Generates a signature given a keypair.
export function idSign(
  kpriv: IKeypair,
  challengeData: Uint8Array,
  ephemPK: Uint8Array,
  destNodeId: NodeId
): Uint8Array {
  const signingNonce = generateIdSignatureInput(challengeData, ephemPK, destNodeId);
  return kpriv.sign(signingNonce);
}

// Verifies the id signature
export function idVerify(
  kpub: IKeypair,
  challengeData: Uint8Array,
  remoteEphemPK: Uint8Array,
  srcNodeId: NodeId,
  sig: Uint8Array
): boolean {
  const signingNonce = generateIdSignatureInput(challengeData, remoteEphemPK, srcNodeId);
  return kpub.verify(signingNonce, sig);
}

export function generateIdSignatureInput(challengeData: Uint8Array, ephemPK: Uint8Array, nodeId: NodeId): Uint8Array {
  return getDiscv5Crypto().sha256(
    concatBytes(utf8ToBytes(ID_SIGNATURE_TEXT), challengeData, ephemPK, hexToBytes(nodeId))
  );
}

export function decryptMessage(key: Uint8Array, nonce: Uint8Array, data: Uint8Array, aad: Uint8Array): Uint8Array {
  if (data.length < MAC_LENGTH) {
    throw new Error("message data not long enough");
  }
  const ctx = Crypto.createDecipheriv("aes-128-gcm", key, nonce);
  ctx.setAAD(aad);
  ctx.setAuthTag(data.slice(data.length - MAC_LENGTH));
  return concatBytes(
    ctx.update(data.slice(0, data.length - MAC_LENGTH)), // remove appended mac
    ctx.final()
  );
}

export function encryptMessage(key: Uint8Array, nonce: Uint8Array, data: Uint8Array, aad: Uint8Array): Uint8Array {
  const ctx = Crypto.createCipheriv("aes-128-gcm", key, nonce);
  ctx.setAAD(aad);
  return concatBytes(
    ctx.update(data),
    ctx.final(),
    ctx.getAuthTag() // append mac
  );
}
