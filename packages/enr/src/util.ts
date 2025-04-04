import { NodeId } from "./types.js";
import { bytesToHex, hexToBytes } from "ethereum-cryptography/utils";
import { base64urlnopad } from "@scure/base";
// multiaddr 8.0.0 expects an Uint8Array with internal buffer starting at 0 offset
export function toNewUint8Array(buf: Uint8Array): Uint8Array {
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Uint8Array(arrayBuffer);
}

export function toBase64url(buf: Uint8Array): string {
  return base64urlnopad.encode(buf);
}

export function fromBase64url(str: string): Uint8Array {
  return base64urlnopad.decode(str);
}

export function createNodeId(buf: Uint8Array): NodeId {
  if (buf.length !== 32) {
    throw new Error("NodeId must be 32 bytes in length");
  }

  return bytesToHex(buf);
}

export function bigintToBytes(n: bigint): Uint8Array {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`;
  }
  return hexToBytes(hex);
}

export function bytesToBigint(bytes: Uint8Array): bigint {
  if (bytes.length === 0) {
    return BigInt(0);
  }
  return BigInt(`0x${bytesToHex(bytes)}`);
}
