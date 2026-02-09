import {ENR, bytesToBigint} from "@chainsafe/enr";
import * as Rlp from "@ethereumjs/rlp";
import {ipFromBytes} from "../util/ip.js";
import {
  type IFindNodeMessage,
  type INodesMessage,
  type IPingMessage,
  type IPongMessage,
  type IRegConfirmationMessage,
  type IRegTopicMessage,
  type ITalkReqMessage,
  type ITalkRespMessage,
  type ITicketMessage,
  type ITopicQueryMessage,
  type Message,
  MessageType,
} from "./types.js";

const ERR_INVALID_MESSAGE = "invalid message";

export function decodeRequestId(rlpRaw: Uint8Array[]): Uint8Array {
  if (rlpRaw[0].length > 8) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return rlpRaw[0];
}

export function decode(data: Uint8Array): Message {
  const type = data[0];
  switch (type) {
    case MessageType.PING:
      return decodePing(data);
    case MessageType.PONG:
      return decodePong(data);
    case MessageType.FINDNODE:
      return decodeFindNode(data);
    case MessageType.NODES:
      return decodeNodes(data);
    case MessageType.TALKREQ:
      return decodeTalkReq(data);
    case MessageType.TALKRESP:
      return decodeTalkResp(data);
    case MessageType.REGTOPIC:
      return decodeRegTopic(data);
    case MessageType.TICKET:
      return decodeTicket(data);
    case MessageType.REGCONFIRMATION:
      return decodeRegConfirmation(data);
    case MessageType.TOPICQUERY:
      return decodeTopicQuery(data);
    default:
      throw new Error(ERR_INVALID_MESSAGE);
  }
}

function decodePing(data: Uint8Array): IPingMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    enrSeq: bytesToBigint(rlpRaw[1]),
    id: decodeRequestId(rlpRaw),
    type: MessageType.PING,
  };
}

function decodePong(data: Uint8Array): IPongMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 4) {
    throw new Error(ERR_INVALID_MESSAGE);
  }

  const ip = ipFromBytes(rlpRaw[2]);
  // IP must be 4 or 16 bytes
  if (ip === undefined) {
    throw new Error(ERR_INVALID_MESSAGE);
  }

  // recipientPort is a uint16 (2 bytes)
  if (rlpRaw[3].length > 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  const port = rlpRaw[3].length ? Number(bytesToBigint(rlpRaw[3])) : 0;

  return {
    addr: {ip, port},
    enrSeq: bytesToBigint(rlpRaw[1]),
    id: decodeRequestId(rlpRaw),
    type: MessageType.PONG,
  };
}

function decodeFindNode(data: Uint8Array): IFindNodeMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  if (!Array.isArray(rlpRaw[1])) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  const distances = (rlpRaw[1] as Uint8Array[]).map((x) => (x.length ? Number(bytesToBigint(x)) : 0));
  return {
    distances,
    id: decodeRequestId(rlpRaw),
    type: MessageType.FINDNODE,
  };
}

function decodeNodes(data: Uint8Array): INodesMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Rlp.NestedUint8Array;
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 3 || !Array.isArray(rlpRaw[2])) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    enrs: rlpRaw[2].map((enrRaw) => ENR.decodeFromValues(enrRaw as Uint8Array[])),
    id: decodeRequestId(rlpRaw as Uint8Array[]),
    total: rlpRaw[1].length ? Number(bytesToBigint(rlpRaw[1] as Uint8Array)) : 0,
    type: MessageType.NODES,
  };
}

function decodeTalkReq(data: Uint8Array): ITalkReqMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 3) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    id: decodeRequestId(rlpRaw),
    protocol: rlpRaw[1],
    request: rlpRaw[2],
    type: MessageType.TALKREQ,
  };
}

function decodeTalkResp(data: Uint8Array): ITalkRespMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    id: decodeRequestId(rlpRaw),
    response: rlpRaw[1],
    type: MessageType.TALKRESP,
  };
}

function decodeRegTopic(data: Uint8Array): IRegTopicMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 4 || !Array.isArray(rlpRaw[2])) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    enr: ENR.decodeFromValues(rlpRaw[2] as Uint8Array[]),
    id: decodeRequestId(rlpRaw),
    ticket: rlpRaw[3],
    topic: rlpRaw[1],
    type: MessageType.REGTOPIC,
  };
}

function decodeTicket(data: Uint8Array): ITicketMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 3) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    id: decodeRequestId(rlpRaw),
    ticket: rlpRaw[1],
    type: MessageType.TICKET,
    waitTime: rlpRaw[2].length ? Number(bytesToBigint(rlpRaw[2] as Uint8Array)) : 0,
  };
}

function decodeRegConfirmation(data: Uint8Array): IRegConfirmationMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    id: decodeRequestId(rlpRaw),
    topic: rlpRaw[1],
    type: MessageType.REGCONFIRMATION,
  };
}

function decodeTopicQuery(data: Uint8Array): ITopicQueryMessage {
  const rlpRaw = Rlp.decode(data.slice(1)) as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    id: rlpRaw[0],
    topic: rlpRaw[1],
    type: MessageType.TOPICQUERY,
  };
}
