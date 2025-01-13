export function numberToBuffer(value: number, length: number): Uint8Array {
  const res = Buffer.alloc(length);
  res.writeUIntBE(value, 0, length);
  return res;
}

export function bufferToNumber(buffer: Buffer, length: number, offset = 0): number {
  return buffer.readUIntBE(offset, length);
}
