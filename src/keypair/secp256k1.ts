import * as secp from "@noble/secp256k1";
import { AbstractKeypair, IKeypair, IKeypairClass, KeypairType } from "./types.js";
import { ERR_INVALID_KEYPAIR_TYPE } from "./constants.js";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
secp.utils.hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  msgs.forEach((msg) => h.update(msg));
  return h.digest();
};

export function secp256k1PublicKeyToCompressed(publicKey: Buffer): Buffer {
  if (publicKey.length === 64) {
    publicKey = Buffer.concat([Buffer.from([4]), publicKey]);
  }
  return Buffer.from(secp.Point.fromHex(publicKey).toRawBytes(true));
}

export function secp256k1PublicKeyToFull(publicKey: Buffer): Buffer {
  if (publicKey.length === 64) {
    return Buffer.concat([Buffer.from([4]), publicKey]);
  }
  return Buffer.from(secp.Point.fromHex(publicKey).toRawBytes(false));
}

export function secp256k1PublicKeyToRaw(publicKey: Buffer): Buffer {
  return Buffer.from(secp.Point.fromHex(publicKey).toRawBytes(false)).slice(1);
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
    const privateKey = secp.utils.randomPrivateKey();
    const publicKey = secp.getPublicKey(privateKey);
    return new Secp256k1Keypair(Buffer.from(privateKey), Buffer.from(publicKey));
  }

  privateKeyVerify(key = this._privateKey): boolean {
    if (key) {
      return secp.utils.isValidPrivateKey(key);
    }
    return true;
  }

  publicKeyVerify(): boolean {
    try {
      secp.Point.fromHex(this.publicKey).assertValidity();
      return true;
    } catch {
      return false;
    }
  }
  sign(msg: Buffer): Buffer {
    return Buffer.from(secp.signSync(msg, this.privateKey, { der: false }));
  }
  verify(msg: Buffer, sig: Buffer): boolean {
    return secp.verify(sig, msg, this.publicKey);
  }
  deriveSecret(keypair: IKeypair): Buffer {
    if (keypair.type !== this.type) {
      throw new Error(ERR_INVALID_KEYPAIR_TYPE);
    }
    const secret = Buffer.from(secp.getSharedSecret(this.privateKey, keypair.publicKey, true));
    return secret;
  }
};
