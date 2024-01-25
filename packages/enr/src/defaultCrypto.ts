import { keccak256 } from "ethereum-cryptography/keccak";
import { secp256k1 } from "ethereum-cryptography/secp256k1";

import { createNodeId } from "./create.js";
import { NodeId } from "./types.js";

export function hash(input: Uint8Array): Uint8Array {
  return keccak256(input);
}

export function publicKey(privKey: Uint8Array): Uint8Array {
  return secp256k1.getPublicKey(privKey, true);
}

export function sign(privKey: Uint8Array, msg: Uint8Array): Uint8Array {
  return secp256k1.sign(hash(msg), privKey).toCompactRawBytes();
}

export function verify(pubKey: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean {
  return secp256k1.verify(sig, hash(msg), pubKey);
}

function uncompressPublicKey(pubKey: Uint8Array): Uint8Array {
  return secp256k1.ProjectivePoint.fromHex(pubKey).toRawBytes(false);
}

export function nodeId(pubKey: Uint8Array): NodeId {
  return createNodeId(Buffer.from(hash(uncompressPublicKey(pubKey).slice(1))));
}
