import { toHex } from "../util/index.js";
import { NodeId } from "./types.js";

export function createNodeId(buffer: Buffer): NodeId {
  if (buffer.length !== 32) {
    throw new Error("NodeId must be 32 bytes in length");
  }
  return toHex(buffer);
}
