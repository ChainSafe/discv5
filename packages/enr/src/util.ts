import { toBigIntBE } from "bigint-buffer";
import { fromString, toString } from "uint8arrays";
import { NodeId } from "./types.js";

// multiaddr 8.0.0 expects an Uint8Array with internal buffer starting at 0 offset
export function toNewUint8Array(buf: Uint8Array): Uint8Array {
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Uint8Array(arrayBuffer);
}

export function toBase64url(buf: Uint8Array): string {
  if (globalThis.Buffer != null) {
    return globalThis.Buffer.from(buf).toString("base64url");
  }
  return toString(buf, "base64url");
}

export function fromBase64url(str: string): Uint8Array {
  if (globalThis.Buffer != null) {
    return globalThis.Buffer.from(str, "base64url");
  }
  return fromString(str, "base64url");
}

export function toBigInt(buf: Uint8Array): bigint {
  if (globalThis.Buffer != null) {
    return toBigIntBE(globalThis.Buffer.from(buf));
  }

  if (buf.length === 0) {
    return BigInt(0);
  }

  return BigInt(`0x${toString(buf, "hex")}`);
}

export function createNodeId(buf: Uint8Array): NodeId {
  if (buf.length !== 32) {
    throw new Error("NodeId must be 32 bytes in length");
  }

  if (globalThis.Buffer != null) {
    return globalThis.Buffer.from(buf).toString("hex");
  }

  return toString(buf, "hex");
}
