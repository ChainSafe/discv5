import { aes } from "@libp2p/crypto";

export async function aesCtrEncrypt(key: Buffer, iv: Buffer, pt: Buffer): Promise<Buffer> {
  const ctx = await aes.create(Uint8Array.from(key), Uint8Array.from(iv))
  const encoded = await ctx.encrypt(Uint8Array.from(pt))
  return Buffer.from(encoded)
}

export async function aesCtrDecrypt(key: Buffer, iv: Buffer, pt: Buffer): Promise<Buffer> {
  const ctx = await aes.create(Uint8Array.from(key), Uint8Array.from(iv))
  const decoded = await ctx.decrypt(Uint8Array.from(pt))
  return Buffer.from(decoded)
}
