import { EthereumNodeRecord } from "./enr";

export enum RpcType {
  Request,
  Response
}

export enum Request {
  Ping,
  FindNode,
  ReqTicket,
  RegTopic,
  TopicQuery
}

export enum Response {
  Pong,
  Nodes,
  Ticket,
  RegConfirmation
}

export interface Message {
  id: number;
  body: RpcType;
}

export interface Ping {
  enr_seq: bigint;
}

export interface Pong {
  enr_seq: bigint;
  recipient_ip: string;
  recipient_port: number;
}

export interface FindNode {
  distance: number;
}

export interface Nodes {
  total: number;
  nodes: EthereumNodeRecord[];
}

export interface ReqTicket {
  topic: Buffer;
}

export interface Ticket {
  ticket: Buffer[];
  wait_time: number;
}

export interface RegTopic {
  ticket: Buffer[];
}

export interface RegConfirmation {
  registered: boolean;
}

export interface TopicQuery {
  topic: Buffer;
}
