import { KeyType } from "@libp2p/interface";
import { AbstractKeypair, IKeypair, IKeypairClass } from "./types.js";
import { ERR_INVALID_KEYPAIR_TYPE } from "./constants.js";
import { getDiscv5Crypto } from "../util/crypto.js";
import { concatBytes } from "@noble/hashes/utils";
export function secp256k1PublicKeyToCompressed(publicKey: Uint8Array): Uint8Array {
  if (publicKey.length === 64) {
    publicKey = concatBytes(Uint8Array.from([4]), publicKey);
  }
  return getDiscv5Crypto().secp256k1.publicKeyConvert(publicKey, true);
}

export function secp256k1PublicKeyToRaw(publicKey: Uint8Array): Uint8Array {
  return getDiscv5Crypto().secp256k1.publicKeyConvert(publicKey, false);
}

export const Secp256k1Keypair: IKeypairClass = class Secp256k1Keypair extends AbstractKeypair implements IKeypair {
  readonly type: KeyType;

  constructor(privateKey?: Uint8Array, publicKey?: Uint8Array) {
    let pub = publicKey ?? getDiscv5Crypto().secp256k1.publicKeyCreate(privateKey!);
    if (pub) {
      pub = secp256k1PublicKeyToCompressed(pub);
    }
    super(privateKey, pub);
    this.type = "secp256k1";
  }

  static generate(): Secp256k1Keypair {
    const privateKey = getDiscv5Crypto().secp256k1.generatePrivateKey();
    const publicKey = getDiscv5Crypto().secp256k1.publicKeyCreate(privateKey);
    return new Secp256k1Keypair(privateKey, publicKey);
  }

  privateKeyVerify(key = this._privateKey): boolean {
    if (key) {
      return getDiscv5Crypto().secp256k1.privateKeyVerify(key);
    }
    return true;
  }
  publicKeyVerify(key = this._publicKey): boolean {
    if (key) {
      return getDiscv5Crypto().secp256k1.publicKeyVerify(key);
    }
    return true;
  }
  sign(msg: Uint8Array): Uint8Array {
    return getDiscv5Crypto().secp256k1.sign(msg, this.privateKey);
  }
  verify(msg: Uint8Array, sig: Uint8Array): boolean {
    return getDiscv5Crypto().secp256k1.verify(this.publicKey, msg, sig);
  }
  deriveSecret(keypair: IKeypair): Uint8Array {
    if (keypair.type !== this.type) {
      throw new Error(ERR_INVALID_KEYPAIR_TYPE);
    }
    return getDiscv5Crypto().secp256k1.deriveSecret(this.privateKey, keypair.publicKey);
  }
};
