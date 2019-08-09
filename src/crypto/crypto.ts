/*
 * Session Key generation for Discv5
 * 
 */

import {
    AuthHeader,
    IAuthResponsePacket,
    IAuthMessagePacket,
} from "../packets";

import { DISCV5Constants } from "../constants";

import { EthereumNodeRecord } from "../enr";
import ctx from "./ctx";
import { ECDH } from "@chainsafe/milagro-crypto-js/src/ecdh";
/**
 * Implements the Hash-based Key Derivation Extract function as specified in RFC5869
 * to fit Discv5 needs
 *
 * @param ikm Initial Keying Material
 * @param salt Salt (Made non-optional here even though in the spec it's optional)
 */

export function HKDFExtract(ikm: ArrayLike<number>, salt: ArrayLike<number>): ArrayLike<number> {
  let output: ArrayLike<number> = Array(32).fill(0);
  const sha256: number = 32;  
  ECDH.HMAC(sha256, ikm, salt, output);
  return output;
}

export function HKDFexpand(prk: ArrayLike<number>, info: string): ArrayLike<number> {
  const hash_length: number = 32;
  const length: number = DISCV5Constants.KEY_LENGTH;
  const sha256: number = 32;  
  let n: number = Math.ceil(length/hash_length);
  let t: number[] = []; // t.length = 0
  let okm: number[] = []; // okm.length = n
  let infoArray = Array.from(info, c => c.charCodeAt(0)); //  
  for (let i = 1; i < n; i++) {
    let tmp = [];
    Array.prototype.push.apply(tmp, t);
    Array.prototype.push.apply(tmp, infoArray);
    ECDH.HMAC(sha256, tmp, prk, t);
    okm.splice(length * i, 0, ...t);
  }

  return okm.slice(0, length);
}
