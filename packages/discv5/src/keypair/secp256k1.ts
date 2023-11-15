import secp256k1 from "bcrypto/lib/secp256k1.js";
import { KeyType } from "@libp2p/interface/keys";
import { AbstractKeypair, IKeypair, IKeypairClass } from "./types.js";
import { ERR_INVALID_KEYPAIR_TYPE } from "./constants.js";

export function secp256k1PublicKeyToCompressed(publicKey: Buffer): Buffer {
  if (publicKey.length === 64) {
    publicKey = Buffer.concat([Buffer.from([4]), publicKey]);
  }
  return secp256k1.publicKeyConvert(publicKey, true);
}

export function secp256k1PublicKeyToFull(publicKey: Buffer): Buffer {
  if (publicKey.length === 64) {
    return Buffer.concat([Buffer.from([4]), publicKey]);
  }
  return secp256k1.publicKeyConvert(publicKey, false);
}

export function secp256k1PublicKeyToRaw(publicKey: Buffer): Buffer {
  return secp256k1.publicKeyConvert(publicKey, false).slice(1);
}

export const Secp256k1Keypair: IKeypairClass = class Secp256k1Keypair extends AbstractKeypair implements IKeypair {
  readonly type: KeyType;

  constructor(privateKey?: Buffer, publicKey?: Buffer) {
    let pub = publicKey ?? secp256k1.publicKeyCreate(privateKey!);
    if (pub) {
      pub = secp256k1PublicKeyToCompressed(pub);
    }
    super(privateKey, pub);
    this.type = "secp256k1";
  }

  static generate(): Secp256k1Keypair {
    const privateKey = secp256k1.privateKeyGenerate();
    const publicKey = secp256k1.publicKeyCreate(privateKey);
    return new Secp256k1Keypair(privateKey, publicKey);
  }

  privateKeyVerify(key = this._privateKey): boolean {
    if (key) {
      return secp256k1.privateKeyVerify(key);
    }
    return true;
  }
  publicKeyVerify(key = this._publicKey): boolean {
    if (key) {
      return secp256k1.publicKeyVerify(key);
    }
    return true;
  }
  sign(msg: Buffer): Buffer {
    return secp256k1.sign(msg, this.privateKey);
  }
  verify(msg: Buffer, sig: Buffer): boolean {
    return secp256k1.verify(msg, sig, this.publicKey);
  }
  deriveSecret(keypair: IKeypair): Buffer {
    if (keypair.type !== this.type) {
      throw new Error(ERR_INVALID_KEYPAIR_TYPE);
    }
    return secp256k1.derive(keypair.publicKey, this.privateKey);
  }
};
