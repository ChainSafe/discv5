import { keccak_256 as keccak } from "@noble/hashes/sha3";
import * as secp256k1 from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
secp256k1.utils.hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  msgs.forEach((msg) => h.update(msg));
  return h.digest();
};

import { NodeId } from "./types.js";
import { createNodeId } from "./create.js";

export function hash(input: Buffer): Buffer {
  return Buffer.from(keccak(input).buffer);
}

export function createPrivateKey(): Buffer {
  return Buffer.from(secp256k1.utils.randomPrivateKey());
}

export function publicKey(privKey: Buffer): Buffer {
  return Buffer.from(secp256k1.getPublicKey(privKey, true));
}

export function sign(privKey: Buffer, msg: Buffer): Buffer {
  return Buffer.from(secp256k1.signSync(Uint8Array.from(hash(msg)), privKey));
}

export function verify(pubKey: Buffer, msg: Buffer, sig: Buffer): boolean {
  return secp256k1.verify(Uint8Array.from(sig), Uint8Array.from(hash(msg)), Uint8Array.from(pubKey));
}

export function nodeId(pubKey: Buffer): NodeId {
  return createNodeId(hash(pubKey));
}

export class ENRKeyPair {
  public readonly nodeId: NodeId;
  public readonly privateKey: Buffer;
  public readonly publicKey: Buffer;

  public constructor(privateKey?: Buffer) {
    if (privateKey) {
      if (!secp256k1.utils.isValidPrivateKey(Uint8Array.from(privateKey))) {
        throw new Error("Invalid private key");
      }
    }
    this.privateKey = privateKey || createPrivateKey();
    this.publicKey = publicKey(this.privateKey);
    this.nodeId = nodeId(this.publicKey);
  }

  public async sign(msg: Buffer): Promise<Buffer> {
    return await sign(this.privateKey, msg);
  }

  public verify(msg: Buffer, sig: Buffer): boolean {
    return verify(this.publicKey, msg, sig);
  }
}
