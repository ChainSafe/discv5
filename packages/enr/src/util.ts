import { NodeId } from "./types.js";
import { bytesToHex, hexToBytes } from "ethereum-cryptography/utils";
import { base64url } from "@scure/base";
// multiaddr 8.0.0 expects an Uint8Array with internal buffer starting at 0 offset
export function toNewUint8Array(buf: Uint8Array): Uint8Array {
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Uint8Array(arrayBuffer);
}

export function toBase64url(buf: Uint8Array): string {
  if (globalThis.Buffer != null) {
    return globalThis.Buffer.from(buf).toString("base64url");
  }
  return base64url.encode(buf);
}

export function fromBase64url(str: string): Uint8Array {
  if (globalThis.Buffer != null) {
    return globalThis.Buffer.from(str, "base64url");
  }
  return base64url.decode(str);
}

export function createNodeId(buf: Uint8Array): NodeId {
  if (buf.length !== 32) {
    throw new Error("NodeId must be 32 bytes in length");
  }

  return bytesToHex(buf);
}

export function bigintToBytes(n: bigint): Uint8Array {
  return hexToBytes(n.toString(16));
}

export function bytesToBigint(bytes: Uint8Array): bigint {
  return BigInt(`0x${bytesToHex(bytes)}`);
}
