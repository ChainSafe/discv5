import { AbstractKeypair, IKeypair, IKeypairClass, KeypairType } from "./types.js";
import { ERR_INVALID_KEYPAIR_TYPE } from "./constants.js";
import { secp256k1 } from "../util/crypto.js";

export function secp256k1PublicKeyToCompressed(publicKey: Buffer): Buffer {
  if (publicKey.length === 64) {
    publicKey = Buffer.concat([Buffer.from([4]), publicKey]);
  }
  return Buffer.from(secp256k1.Point.fromHex(publicKey).toRawBytes(true));
}

export function secp256k1PublicKeyToFull(publicKey: Buffer): Buffer {
  if (publicKey.length === 64) {
    return Buffer.concat([Buffer.from([4]), publicKey]);
  }
  return Buffer.from(secp256k1.Point.fromHex(publicKey).toRawBytes(false).buffer);
}

export function secp256k1PublicKeyToRaw(publicKey: Buffer): Buffer {
  return Buffer.from(secp256k1.Point.fromHex(publicKey).toRawBytes(false).buffer).slice(1);
}

export const Secp256k1Keypair: IKeypairClass = class Secp256k1Keypair extends AbstractKeypair implements IKeypair {
  readonly type: KeypairType;

  constructor(privateKey?: Buffer, publicKey?: Buffer) {
    let pub = publicKey;
    if (pub) {
      pub = secp256k1PublicKeyToCompressed(pub);
    }
    super(privateKey, pub);
    this.type = KeypairType.Secp256k1;
  }

  static generate(): Secp256k1Keypair {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = secp256k1.getPublicKey(privateKey);
    return new Secp256k1Keypair(Buffer.from(privateKey.buffer), Buffer.from(publicKey.buffer));
  }

  privateKeyVerify(key = this._privateKey): boolean {
    if (key) {
      return secp256k1.utils.isValidPrivateKey(key);
    }
    return true;
  }

  publicKeyVerify(): boolean {
    try {
      secp256k1.Point.fromHex(this.publicKey).assertValidity();
      return true;
    } catch {
      return false;
    }
  }
  sign(msg: Buffer): Buffer {
    return Buffer.from(secp256k1.signSync(msg, this.privateKey, { der: false }).buffer);
  }
  verify(msg: Buffer, sig: Buffer): boolean {
    return secp256k1.verify(sig, msg, this.publicKey);
  }
  deriveSecret(keypair: IKeypair): Buffer {
    if (keypair.type !== this.type) {
      throw new Error(ERR_INVALID_KEYPAIR_TYPE);
    }
    const secret = Buffer.from(secp256k1.getSharedSecret(this.privateKey, keypair.publicKey, true).buffer);
    return secret;
  }
};
