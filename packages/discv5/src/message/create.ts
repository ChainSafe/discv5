import { randomBytes } from "@noble/hashes/utils";
import { toBigIntBE } from "bigint-buffer";
import { SequenceNumber, ENR } from "@chainsafe/enr";

import {
  RequestId,
  IPingMessage,
  MessageType,
  IFindNodeMessage,
  INodesMessage,
  ITalkReqMessage,
  ITalkRespMessage,
} from "./types.js";
import { toBuffer } from "../index.js";

export function createRequestId(): RequestId {
  return toBigIntBE(toBuffer(randomBytes(8)));
}

export function createPingMessage(enrSeq: SequenceNumber): IPingMessage {
  return {
    type: MessageType.PING,
    id: createRequestId(),
    enrSeq,
  };
}

export function createFindNodeMessage(distances: number[]): IFindNodeMessage {
  return {
    type: MessageType.FINDNODE,
    id: createRequestId(),
    distances,
  };
}

export function createNodesMessage(id: RequestId, total: number, enrs: ENR[]): INodesMessage {
  return {
    type: MessageType.NODES,
    id,
    total,
    enrs,
  };
}

export function createTalkRequestMessage(request: string | Uint8Array, protocol: string | Uint8Array): ITalkReqMessage {
  return {
    type: MessageType.TALKREQ,
    id: createRequestId(),
    protocol: Buffer.from(protocol),
    request: Buffer.from(request),
  };
}
export function createTalkResponseMessage(requestId: RequestId, payload: Uint8Array): ITalkRespMessage {
  return {
    type: MessageType.TALKRESP,
    id: requestId,
    response: toBuffer(payload),
  };
}
