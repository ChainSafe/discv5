import {expand, extract} from "@noble/hashes/hkdf.js";
import {hmac} from "@noble/hashes/hmac.js";
import {sha256} from "@noble/hashes/sha2.js";
import {Point, etc, getPublicKey, getSharedSecret, hashes, sign, utils, verify} from "@noble/secp256k1";

hashes.hmacSha256 = (k, ...m) => hmac(sha256, k, etc.concatBytes(...m));
hashes.sha256 = sha256;

export type Discv5Crypto = {
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

export const defaultCrypto: Discv5Crypto = {
  hkdf: {
    expand: (hash, key, info, outputLen) => expand(hash as never, key, info, outputLen),
    extract: (hash, secret, info) => extract(hash as never, secret, info),
  },
  secp256k1: {
    deriveSecret: (privKey, pubKey) => getSharedSecret(privKey, pubKey, true),
    generatePrivateKey: () => utils.randomSecretKey(),
    privateKeyVerify: (pk) => {
      return utils.isValidSecretKey(pk);
    },
    publicKeyConvert: (pk, compress) => Point.fromBytes(pk).toBytes(compress),
    publicKeyCreate: (pk) => getPublicKey(pk),
    publicKeyVerify: (pk) => {
      try {
        Point.fromBytes(pk).assertValidity();
        return true;
      } catch {
        return false;
      }
    },
    sign: (msg, pk) => sign(msg, pk, {prehash: false}),
    verify: (pk, msg, sig) => verify(sig, msg, pk, {prehash: false}),
  },
  sha256: sha256,
};

let crypto: Discv5Crypto = defaultCrypto;
export const getDiscv5Crypto = (): Discv5Crypto => {
  return crypto;
};

export const setDiscv5Crypto = (c: Discv5Crypto): void => {
  crypto = c;
};
