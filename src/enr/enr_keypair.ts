import crypto from "@chainsafe/libp2p-crypto";
import { keccak256 } from "ethereumjs-util";
import { Secp256k1PrivateKey, Secp256k1PublicKey } from "libp2p-crypto-secp256k1";
import { NodeId } from "./enr_types";

export class ENRKeyPair {
  private privateKey: Secp256k1PrivateKey;
  private publicKey: Secp256k1PublicKey;

  public async generateKeyPair(): Promise<void> {
    this.privateKey = await crypto.keys.generateKeyPair("secp256k1", 256);
    this.publicKey = this.privateKey.public;
  }

  public get compressedPublicKey(): Buffer {
    return crypto.compressPublicKey(this.publicKey);
  }

  public get uncompressedPublicKey(): Buffer {
    return crypto.decompressPublicKey(this.publicKey);
  }

  public get privateKeyBuf(): Buffer {
    return crypto.keys.marshalPrivateKey(this.privateKey, "SECP256K1");
  }

  public async sign(msg: Buffer): Promise<Buffer> {
    return await this.privateKey.sign(msg);
  }

  public async verify(sig: Buffer, msg: Buffer): Promise<boolean> {
    return await this.publicKey.verify(msg, sig);
  }

  public derive(): NodeId {
     return keccak256(this.uncompressedPublicKey);
  }
}
