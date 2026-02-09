import type {ENR, SequenceNumber} from "@chainsafe/enr";
import {randomBytes, utf8ToBytes} from "@noble/hashes/utils.js";

import {
  type IFindNodeMessage,
  type INodesMessage,
  type IPingMessage,
  type ITalkReqMessage,
  type ITalkRespMessage,
  MessageType,
  type RequestId,
} from "./types.js";

export function createRequestId(): RequestId {
  return randomBytes(8);
}

export function createPingMessage(enrSeq: SequenceNumber): IPingMessage {
  return {
    enrSeq,
    id: createRequestId(),
    type: MessageType.PING,
  };
}

export function createFindNodeMessage(distances: number[]): IFindNodeMessage {
  return {
    distances,
    id: createRequestId(),
    type: MessageType.FINDNODE,
  };
}

export function createNodesMessage(id: RequestId, total: number, enrs: ENR[]): INodesMessage {
  return {
    enrs,
    id,
    total,
    type: MessageType.NODES,
  };
}

export function createTalkRequestMessage(request: string | Uint8Array, protocol: string | Uint8Array): ITalkReqMessage {
  return {
    id: createRequestId(),
    protocol: protocol instanceof Uint8Array ? protocol : utf8ToBytes(protocol),
    request: request instanceof Uint8Array ? request : utf8ToBytes(request),
    type: MessageType.TALKREQ,
  };
}
export function createTalkResponseMessage(requestId: RequestId, payload: Uint8Array): ITalkRespMessage {
  return {
    id: requestId,
    response: payload,
    type: MessageType.TALKRESP,
  };
}
