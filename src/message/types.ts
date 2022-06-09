import { SequenceNumber, ENR } from "../enr/index.js";

export type RequestId = bigint;

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
  recipientIp: string;
  recipientPort: number;
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
  protocol: Buffer;
  request: Buffer;
}

export interface ITalkRespMessage {
  type: MessageType.TALKRESP;
  id: RequestId;
  response: Buffer;
}

export interface IRegTopicMessage {
  type: MessageType.REGTOPIC;
  id: RequestId;
  topic: Buffer;
  enr: ENR;
  ticket: Buffer;
}

export interface ITicketMessage {
  type: MessageType.TICKET;
  id: RequestId;
  ticket: Buffer;
  waitTime: number;
}

export interface IRegConfirmationMessage {
  type: MessageType.REGCONFIRMATION;
  id: RequestId;
  topic: Buffer;
}

export interface ITopicQueryMessage {
  type: MessageType.TOPICQUERY;
  id: RequestId;
  topic: Buffer;
}
