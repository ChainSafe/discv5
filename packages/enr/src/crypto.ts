import { NodeId } from "./types.js";
import * as defaultCrypto from "./defaultCrypto.js";

/**
 * In order to support different environments (eg: browser vs high performance), a pluggable crypto interface is provided
 */
export type V4Crypto = {
  publicKey(privKey: Uint8Array): Uint8Array;
  sign(privKey: Uint8Array, msg: Uint8Array): Uint8Array;
  verify(pubKey: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean;
  nodeId(pubKey: Uint8Array): NodeId;
};

let v4: V4Crypto = defaultCrypto;

export function setV4Crypto(crypto: V4Crypto): void {
  v4 = crypto;
}

export function getV4Crypto(): V4Crypto {
  return v4;
}
