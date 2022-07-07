import { keccak_256 as keccak } from "@noble/hashes/sha3";
import { secp256k1 } from "../util/crypto.js";

import { NodeId } from "./types.js";
import { createNodeId } from "./create.js";
import { secp256k1PublicKeyToRaw } from "../keypair/secp256k1.js";

export function hash(input: Buffer): Buffer {
  return Buffer.from(keccak(input).buffer);
}

export function createPrivateKey(): Buffer {
  return Buffer.from(secp256k1.utils.randomPrivateKey().buffer);
}

export function publicKey(privKey: Buffer): Buffer {
  return Buffer.from(secp256k1.getPublicKey(privKey, true).buffer);
}

export function sign(privKey: Buffer, msg: Buffer): Buffer {
  return Buffer.from(secp256k1.signSync(hash(msg), privKey, { der: false }).buffer);
}

export function verify(pubKey: Buffer, msg: Buffer, sig: Buffer): boolean {
  return secp256k1.verify(sig, hash(msg), pubKey);
}

export function nodeId(pubKey: Buffer): NodeId {
  return createNodeId(hash(secp256k1PublicKeyToRaw(pubKey)));
}

export class ENRKeyPair {
  public readonly nodeId: NodeId;
  public readonly privateKey: Buffer;
  public readonly publicKey: Buffer;

  public constructor(privateKey?: Buffer) {
    if (privateKey) {
      if (!secp256k1.utils.isValidPrivateKey(privateKey)) {
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
