import { randomBytes } from "bcrypto/lib/random.js";
import { toBigIntBE } from "bigint-buffer";

import {
  RequestId,
  IPingMessage,
  MessageType,
  IFindNodeMessage,
  INodesMessage,
  ITalkReqMessage,
  ITalkRespMessage,
  IRelayRequestMessage,
  IRelayResponseMessage,
} from "./types.js";
import { SequenceNumber, ENR } from "../enr/index.js";

export function createRequestId(): RequestId {
  return toBigIntBE(randomBytes(8));
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
    response: Buffer.from(payload),
  };
}

export function createRelayRequestMessage(fromNodeId: bigint, toNodeId: bigint): IRelayRequestMessage {
  return {
    type: MessageType.RELAYREQUEST,
    id: createRequestId(),
    fromNodeId,
    toNodeId,
  };
}

export function createRelayResponseMessage(response: number): IRelayResponseMessage {
  return {
    type: MessageType.RELAYRESPONSE,
    id: createRequestId(),
    response,
  };
}
