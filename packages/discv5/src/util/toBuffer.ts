export function toBuffer(arr: Uint8Array): Buffer {
  if (arr instanceof Buffer) return arr;
  return Buffer.from(arr.buffer, arr.byteOffset, arr.length);
}

export function numberToBuffer(value: number, length: number): Buffer {
  const res = Buffer.alloc(length);
  res.writeUIntBE(value, 0, length);
  return res;
}

export function bufferToNumber(buffer: Buffer, length: number, offset = 0): number {
  return buffer.readUIntBE(offset, length);
}
