import {bigintToBytes} from "@chainsafe/enr";
import * as Rlp from "@ethereumjs/rlp";
import {concatBytes} from "@noble/hashes/utils.js";
import {ipToBytes} from "../util/ip.js";
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

export function encode(message: Message): Uint8Array {
  switch (message.type) {
    case MessageType.PING:
      return encodePingMessage(message as IPingMessage);
    case MessageType.PONG:
      return encodePongMessage(message as IPongMessage);
    case MessageType.FINDNODE:
      return encodeFindNodeMessage(message as IFindNodeMessage);
    case MessageType.NODES:
      return encodeNodesMessage(message as INodesMessage);
    case MessageType.TALKREQ:
      return encodeTalkReqMessage(message as ITalkReqMessage);
    case MessageType.TALKRESP:
      return encodeTalkRespMessage(message as ITalkRespMessage);
    case MessageType.REGTOPIC:
      return encodeRegTopicMessage(message as IRegTopicMessage);
    case MessageType.TICKET:
      return encodeTicketMessage(message as ITicketMessage);
    case MessageType.REGCONFIRMATION:
      return encodeRegConfirmMessage(message as IRegConfirmationMessage);
    case MessageType.TOPICQUERY:
      return encodeTopicQueryMessage(message as ITopicQueryMessage);
  }
}

export function encodePingMessage(m: IPingMessage): Uint8Array {
  return concatBytes(Uint8Array.from([MessageType.PING]), Rlp.encode([m.id, bigintToBytes(m.enrSeq)]));
}

export function encodePongMessage(m: IPongMessage): Uint8Array {
  if (m.addr.port < 0 || m.addr.port > 65535) {
    throw new Error("invalid port for encoding");
  }
  return concatBytes(
    Uint8Array.from([MessageType.PONG]),
    Rlp.encode([m.id, bigintToBytes(m.enrSeq), ipToBytes(m.addr.ip), m.addr.port])
  );
}

export function encodeFindNodeMessage(m: IFindNodeMessage): Uint8Array {
  return concatBytes(Uint8Array.from([MessageType.FINDNODE]), Rlp.encode([m.id, m.distances]));
}

export function encodeNodesMessage(m: INodesMessage): Uint8Array {
  return concatBytes(
    Uint8Array.from([MessageType.NODES]),
    Rlp.encode([m.id, m.total, m.enrs.map((enr) => enr.encodeToValues())])
  );
}

export function encodeTalkReqMessage(m: ITalkReqMessage): Uint8Array {
  return concatBytes(Uint8Array.from([MessageType.TALKREQ]), Rlp.encode([m.id, m.protocol, m.request]));
}

export function encodeTalkRespMessage(m: ITalkRespMessage): Uint8Array {
  return concatBytes(Uint8Array.from([MessageType.TALKRESP]), Rlp.encode([m.id, m.response]));
}

export function encodeRegTopicMessage(m: IRegTopicMessage): Uint8Array {
  return concatBytes(
    Uint8Array.from([MessageType.REGTOPIC]),
    Rlp.encode([m.id, m.topic, m.enr.encodeToValues(), m.ticket])
  );
}

export function encodeTicketMessage(m: ITicketMessage): Uint8Array {
  return concatBytes(Uint8Array.from([MessageType.TICKET]), Rlp.encode([m.id, m.ticket, m.waitTime]));
}

export function encodeRegConfirmMessage(m: IRegConfirmationMessage): Uint8Array {
  return concatBytes(Uint8Array.from([MessageType.REGCONFIRMATION]), Rlp.encode([m.id, m.topic]));
}

export function encodeTopicQueryMessage(m: ITopicQueryMessage): Uint8Array {
  return concatBytes(Uint8Array.from([MessageType.TOPICQUERY]), Rlp.encode([m.id, m.topic]));
}
