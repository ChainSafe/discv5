export function numberToBytes(value: number, length: number): Uint8Array {
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[length - 1 - i] = (value >> (i * 8)) & 0xff;
  }
  return array;
}

export function bytesToNumber(array: Uint8Array, length: number, offset = 0): number {
  let value = 0;
  for (let i = 0; i < length; i++) {
    value = (value << 8) | array[offset + i];
  }
  return value;
}
