import { crypto } from "@noble/hashes/crypto";

const Crypto = crypto.node ?? crypto.web

export async function aesCtrEncrypt(key: Buffer, iv: Buffer, pt: Buffer): Promise<Buffer> {
  const ctx = Crypto.createCipheriv('aes-128-gcm', key, iv);
    ctx.update(pt);
    return ctx.final();
}

export async function aesCtrDecrypt(key: Buffer, iv: Buffer, pt: Buffer): Promise<Buffer> {
  const ctx = Crypto.createDecipheriv('aes-128-gcm', key, iv);
  ctx.update(pt);
  return ctx.final();
}
