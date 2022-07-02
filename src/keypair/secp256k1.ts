import * as secp from "@noble/secp256k1";
import { AbstractKeypair, IKeypair, IKeypairClass, KeypairType } from "./types.js";
import { ERR_INVALID_KEYPAIR_TYPE } from "./constants.js";
/*
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
*/
export const Secp256k1Keypair: IKeypairClass = class Secp256k1Keypair extends AbstractKeypair implements IKeypair {
  readonly type: KeypairType;

  constructor(privateKey?: Buffer, publicKey?: Buffer) {
    super(privateKey, publicKey);
    this.type = KeypairType.Secp256k1;
  }

  static generate(): Secp256k1Keypair {
    const privateKey = secp.utils.randomPrivateKey();
    const publicKey = secp.getPublicKey(privateKey);
    return new Secp256k1Keypair(Buffer.from(privateKey), Buffer.from(publicKey));
  }

  privateKeyVerify(key = this._privateKey): boolean {
    if (key) {
      return secp.utils.isValidPrivateKey(Uint8Array.from(key));
    }
    return true;
  }

  sign(msg: Buffer): Buffer {
    return Buffer.from(secp.sign(Uint8Array.from(msg), Uint8Array.from(this.privateKey)));
  }
  verify(msg: Buffer, sig: Buffer): boolean {
    return secp.verify(
     Uint8Array.from(sig),
      Uint8Array.from(msg),
      this.publicKey
    );
  }
  deriveSecret(keypair: IKeypair): Buffer {
    if (keypair.type !== this.type) {
      throw new Error(ERR_INVALID_KEYPAIR_TYPE);
    }
    const secret = Buffer.from(
      secp.getSharedSecret(
        Uint8Array.from(this.privateKey),
        Uint8Array.from(keypair.publicKey)
      )
    );
    return secret;
  }
};
