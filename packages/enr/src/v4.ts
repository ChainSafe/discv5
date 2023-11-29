import keccak from "bcrypto/lib/keccak.js";
import secp256k1 from "bcrypto/lib/secp256k1.js";

import { NodeId } from "./types.js";
import { createNodeId } from "./create.js";

export function hash(input: Buffer): Buffer {
  return keccak.digest(input);
}

export function publicKey(privKey: Buffer): Buffer {
  return secp256k1.publicKeyCreate(privKey);
}

export function sign(privKey: Buffer, msg: Buffer): Buffer {
  return secp256k1.sign(hash(msg), privKey);
}

export function verify(pubKey: Buffer, msg: Buffer, sig: Buffer): boolean {
  return secp256k1.verify(hash(msg), sig, pubKey);
}

export function nodeId(pubKey: Buffer): NodeId {
  return createNodeId(hash(secp256k1.publicKeyConvert(pubKey, false).slice(1)));
}
