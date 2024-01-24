import keccak from "bcrypto/lib/keccak.js";
import secp256k1 from "bcrypto/lib/secp256k1.js";

import { createNodeId, NodeId } from "@chainsafe/enr";

export function hash(input: Uint8Array): Buffer {
  return keccak.digest(Buffer.from(input));
}

export function publicKey(privKey: Uint8Array): Buffer {
  return secp256k1.publicKeyCreate(Buffer.from(privKey));
}

export function sign(privKey: Uint8Array, msg: Uint8Array): Buffer {
  return secp256k1.sign(hash(msg), Buffer.from(privKey));
}

export function verify(pubKey: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean {
  return secp256k1.verify(hash(msg), Buffer.from(sig), Buffer.from(pubKey));
}

export function nodeId(pubKey: Uint8Array): NodeId {
  return createNodeId(hash(secp256k1.publicKeyConvert(Buffer.from(pubKey), false).slice(1)));
}
