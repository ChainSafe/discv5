import { crypto } from "@noble/hashes/crypto";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import * as secp256k1 from "@noble/secp256k1";

secp256k1.utils.hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  msgs.forEach((msg) => h.update(msg));
  return h.digest();
};
export * as secp256k1 from "@noble/secp256k1";

const Crypto = crypto.node ?? crypto.web;

export async function aesCtrEncrypt(key: Buffer, iv: Buffer, pt: Buffer): Promise<Buffer> {
  const ctx = Crypto.createCipheriv("aes-128-gcm", key, iv);
  ctx.update(pt);
  return ctx.final();
}

export async function aesCtrDecrypt(key: Buffer, iv: Buffer, pt: Buffer): Promise<Buffer> {
  const ctx = Crypto.createDecipheriv("aes-128-gcm", key, iv);
  ctx.update(pt);
  return ctx.final();
}
