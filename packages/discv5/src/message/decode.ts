import * as RLP from "rlp";
import { toBigIntBE } from "bigint-Uint8Array";
import { ENR } from "@chainsafe/enr";
import {
  IPingMessage,
  IPongMessage,
  IFindNodeMessage,
  INodesMessage,
  IRegTopicMessage,
  ITicketMessage,
  IRegConfirmationMessage,
  ITopicQueryMessage,
  Message,
  MessageType,
  ITalkReqMessage,
  ITalkRespMessage,
} from "./types.js";
import { ipFromBytes } from "../util/ip.js";

const ERR_INVALID_MESSAGE = "invalid message";

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
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    type: MessageType.PING,
    id: toBigIntBE(rlpRaw[0]),
    enrSeq: toBigIntBE(rlpRaw[1]),
  };
}

function decodePong(data: Uint8Array): IPongMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as Uint8Array[];
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
  const port = rlpRaw[3].length ? rlpRaw[3].readUIntBE(0, rlpRaw[3].length) : 0;

  return {
    type: MessageType.PONG,
    id: toBigIntBE(rlpRaw[0]),
    enrSeq: toBigIntBE(rlpRaw[1]),
    addr: { ip, port },
  };
}

function decodeFindNode(data: Uint8Array): IFindNodeMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  if (!Array.isArray(rlpRaw[1])) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  const distances = (rlpRaw[1] as unknown as Uint8Array[]).map((x) => (x.length ? x.readUIntBE(0, x.length) : 0));
  return {
    type: MessageType.FINDNODE,
    id: toBigIntBE(rlpRaw[0]),
    distances,
  };
}

function decodeNodes(data: Uint8Array): INodesMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as RLP.Decoded;
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 3 || !Array.isArray(rlpRaw[2])) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    type: MessageType.NODES,
    id: toBigIntBE(rlpRaw[0]),
    total: rlpRaw[1].length ? rlpRaw[1].readUIntBE(0, rlpRaw[1].length) : 0,
    enrs: rlpRaw[2].map((enrRaw) => ENR.decodeFromValues(enrRaw)),
  };
}

function decodeTalkReq(data: Uint8Array): ITalkReqMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as RLP.Decoded;
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 3) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    type: MessageType.TALKREQ,
    id: toBigIntBE(rlpRaw[0]),
    protocol: rlpRaw[1],
    request: rlpRaw[2],
  };
}

function decodeTalkResp(data: Uint8Array): ITalkRespMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as RLP.Decoded;
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    type: MessageType.TALKRESP,
    id: toBigIntBE(rlpRaw[0]),
    response: rlpRaw[1],
  };
}

function decodeRegTopic(data: Uint8Array): IRegTopicMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 4 || !Array.isArray(rlpRaw[2])) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    type: MessageType.REGTOPIC,
    id: toBigIntBE(rlpRaw[0]),
    topic: rlpRaw[1],
    enr: ENR.decodeFromValues(rlpRaw[2] as unknown as Uint8Array[]),
    ticket: rlpRaw[3],
  };
}

function decodeTicket(data: Uint8Array): ITicketMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 3) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    type: MessageType.TICKET,
    id: toBigIntBE(rlpRaw[0]),
    ticket: rlpRaw[1],
    waitTime: rlpRaw[2].length ? rlpRaw[2].readUIntBE(0, rlpRaw[2].length) : 0,
  };
}

function decodeRegConfirmation(data: Uint8Array): IRegConfirmationMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    type: MessageType.REGCONFIRMATION,
    id: toBigIntBE(rlpRaw[0]),
    topic: rlpRaw[1],
  };
}

function decodeTopicQuery(data: Uint8Array): ITopicQueryMessage {
  const rlpRaw = RLP.decode(data.slice(1)) as unknown as Uint8Array[];
  if (!Array.isArray(rlpRaw) || rlpRaw.length !== 2) {
    throw new Error(ERR_INVALID_MESSAGE);
  }
  return {
    type: MessageType.TOPICQUERY,
    id: toBigIntBE(rlpRaw[0]),
    topic: rlpRaw[1],
  };
}
