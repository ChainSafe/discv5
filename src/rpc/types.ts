import { ISocketAddr } from "./discv5_session";
import { Packet } from "./packets";

export enum MsgType {
  Ping = 1,
  Pong,
  FindNode,
  Nodes,
  ReqTicket,
  Ticket,
  RegTopic,
  RegConfirmation,
  TopicQuery,
}

export enum RpcType {
  Request,
  Response,
}

export interface IRequest {
  destinationAddr: ISocketAddr;
  packet: Packet;
  message: IMessage;
  timeout: Promise<void>;
  retries: number;
}

export interface IMessage {
  requirestId: number;
  msgType: MsgType;
  rpcType: RpcType;
}

export interface IPing extends IMessage {
  msgType: MsgType.Ping;
  enrSeq: bigint;
  rpcType: RpcType.Request;
}

export interface IPong extends IMessage {
  msgType: MsgType.Pong;
  enrSeq: bigint;
  rpcType: RpcType.Response;
  recipientIp: string;
  recipientPort: number;
}

export interface IFindNode extends IMessage {
  msgType: MsgType.FindNode;
  rpcType: RpcType.Request;
  distance: number;
}

export interface INodes extends IMessage {
  msgType: MsgType.Nodes;
  rpcType: RpcType.Response;
  total: number;
  nodes: any[];
}

export interface IReqTicket extends IMessage {
  msgType: MsgType.ReqTicket;
  rpcType: RpcType.Request;
  topic: Buffer;
}

export interface ITicket extends IMessage {
  msgType: MsgType.Ticket;
  rpcType: RpcType.Response;
  ticket: Buffer[];
  waitTime: number;
}

export interface IRegTopic extends IMessage {
  msgType: MsgType.RegTopic;
  rpcType: RpcType.Request;
  ticket: Buffer[];
  nodeRecord: any[];
}

export interface IRegConfirmation extends IMessage {
  msgType: MsgType.RegConfirmation;
  rpcType: RpcType.Response;
  registered: boolean;
}

export interface ITopicQuery extends IMessage {
  msgType: MsgType.TopicQuery;
  rpcType: RpcType.Request;
  topic: Buffer;
}
