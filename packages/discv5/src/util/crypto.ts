import { sha256 } from "@noble/hashes/sha256";
import { hmac } from "@noble/hashes/hmac";
import { expand, extract } from "@noble/hashes/hkdf";
import { sign, verify, ProjectivePoint as Point, getPublicKey, getSharedSecret, utils, etc } from "@noble/secp256k1";

etc.hmacSha256Sync = (k, ...m) => hmac(sha256, k, etc.concatBytes(...m));
export type discv5Crypto = {
  sha256: (data: Uint8Array) => Uint8Array;
  secp256k1: {
    publicKeyVerify: (publicKey: Uint8Array) => boolean;
    publicKeyCreate: (privateKey: Uint8Array) => Uint8Array;
    publicKeyConvert: (publicKey: Uint8Array, compressed: boolean) => Uint8Array;
    sign: (msg: Uint8Array, pk: Uint8Array) => Uint8Array;
    verify: (publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array) => boolean;
    deriveSecret: (privateKey: Uint8Array, publicKey: Uint8Array) => Uint8Array;
    generatePrivateKey: () => Uint8Array;
    privateKeyVerify: (privateKey: Uint8Array) => boolean;
  };
  hkdf: {
    extract: (hash: (data: Uint8Array) => Uint8Array, secret: Uint8Array, info: Uint8Array) => Uint8Array;
    expand: (
      hash: (data: Uint8Array) => Uint8Array,
      secret: Uint8Array,
      info: Uint8Array,
      outputLen: number
    ) => Uint8Array;
  };
};

export const defaultCrypto: discv5Crypto = {
  sha256: sha256,
  secp256k1: {
    publicKeyVerify: (pk) => {
      try {
        Point.fromHex(pk).assertValidity();
        return true;
      } catch {
        return false;
      }
    },
    publicKeyCreate: (pk) => getPublicKey(pk),
    publicKeyConvert: (pk, compress) => Point.fromHex(pk).toRawBytes(compress),
    sign: (msg, pk) => sign(msg, pk).toCompactRawBytes(),
    verify: (pk, msg, sig) => verify(sig, msg, pk),
    deriveSecret: (privKey, pubKey) => getSharedSecret(privKey, pubKey, true),
    generatePrivateKey: () => utils.randomPrivateKey(),
    privateKeyVerify: (pk) => {
      return utils.isValidPrivateKey(pk);
    },
  },
  hkdf: {
    extract: (hash, secret, info) => extract(hash as never, secret, info),
    expand: (hash, key, info, outputLen) => expand(hash as never, key, info, outputLen),
  },
};

let crypto: discv5Crypto = defaultCrypto;
export const getDiscv5Crypto = (): discv5Crypto => {
  return crypto;
};

export const setDiscv5Crypto = (c: discv5Crypto): void => {
  crypto = c;
};
