import { SequenceNumber, ENR } from "@chainsafe/enr";
import { SocketAddress } from "../util/ip.js";

export type RequestId = bigint;

export type NodeAddressIP = {
  family: 4 | 6;
  octets: number[];
  port: number;
};

export enum MessageType {
  PING = 1,
  PONG = 2,
  FINDNODE = 3,
  NODES = 4,
  TALKREQ = 5,
  TALKRESP = 6,
  REGTOPIC = 7,
  TICKET = 8,
  REGCONFIRMATION = 9,
  TOPICQUERY = 10,
}

export function isRequestType(type: MessageType): boolean {
  return (
    type === MessageType.PING ||
    type === MessageType.FINDNODE ||
    type === MessageType.TALKREQ ||
    type === MessageType.REGTOPIC ||
    type === MessageType.TOPICQUERY
  );
}

export type Message = RequestMessage | ResponseMessage;

export type RequestMessage = IPingMessage | IFindNodeMessage | ITalkReqMessage | IRegTopicMessage | ITopicQueryMessage;

export type ResponseMessage =
  | IPongMessage
  | INodesMessage
  | ITalkRespMessage
  | ITicketMessage
  | IRegConfirmationMessage;

export interface IPingMessage {
  type: MessageType.PING;
  id: RequestId;
  enrSeq: SequenceNumber;
}

export interface IPongMessage {
  type: MessageType.PONG;
  id: RequestId;
  enrSeq: SequenceNumber;
  addr: SocketAddress;
}

export interface IFindNodeMessage {
  type: MessageType.FINDNODE;
  id: RequestId;
  distances: number[];
}

export interface INodesMessage {
  type: MessageType.NODES;
  id: RequestId;
  total: number;
  enrs: ENR[];
}

export interface ITalkReqMessage {
  type: MessageType.TALKREQ;
  id: RequestId;
  protocol: Uint8Array;
  request: Uint8Array;
}

export interface ITalkRespMessage {
  type: MessageType.TALKRESP;
  id: RequestId;
  response: Uint8Array;
}

export interface IRegTopicMessage {
  type: MessageType.REGTOPIC;
  id: RequestId;
  topic: Uint8Array;
  enr: ENR;
  ticket: Uint8Array;
}

export interface ITicketMessage {
  type: MessageType.TICKET;
  id: RequestId;
  ticket: Uint8Array;
  waitTime: number;
}

export interface IRegConfirmationMessage {
  type: MessageType.REGCONFIRMATION;
  id: RequestId;
  topic: Uint8Array;
}

export interface ITopicQueryMessage {
  type: MessageType.TOPICQUERY;
  id: RequestId;
  topic: Uint8Array;
}
