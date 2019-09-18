import RLP = require("rlp");
import { Input } from "rlp";
import * as constants from "./constants";
import { ISocketAddr } from "./discv5_session";
import { EthereumNodeRecord } from "./enr/enr";
import { packet } from "./packets";
import * as utils from "./utils";

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
  destinationAddr: SocketAddr;
  packet: packet;
  message: IMessage;
  timeout: Promise<void>;
  retries: number;
}

export interface IMessage {
  request_id: number;
  msg_type: MsgType;
  rpc_type: RpcType;
}

export interface IPing extends IMessage {
  msg_type: MsgType.Ping;
  enr_seq: bigint;
  rpc_type: RpcType.Request;
}

export interface IPong extends IMessage {
  msg_type: MsgType.Pong;
  enr_seq: bigint;
  rpc_type: RpcType.Response;
  recipient_ip: string;
  recipient_port: number;
}

export interface IFindNode extends IMessage {
  msg_type: MsgType.FindNode;
  rpc_type: RpcType.Request;
  distance: number;
}

export interface INodes extends IMessage {
  msg_type: MsgType.Nodes;
  rpc_type: RpcType.Response;
  total: number;
  nodes: any[];
}

export interface IReqTicket extends IMessage {
  msg_type: MsgType.ReqTicket;
  rpc_type: RpcType.Request;
  topic: Buffer;
}

export interface ITicket extends IMessage {
  msg_type: MsgType.Ticket;
  rpc_type: RpcType.Response;
  ticket: Buffer[];
  wait_time: number;
}

export interface IRegTopic extends IMessage {
  msg_type: MsgType.RegTopic;
  rpc_type: RpcType.Request;
  ticket: Buffer[];
  node_record: any[];
}

export interface IRegConfirmation extends IMessage {
  msg_type: MsgType.RegConfirmation;
  rpc_type: RpcType.Response;
  registered: boolean;
}

export interface ITopicQuery extends IMessage {
  msg_type: MsgType.TopicQuery;
  rpc_type: RpcType.Request;
  topic: Buffer;
}

export function matchRequestToResponse(reqType: MsgType): MsgType {
    switch (reqType) {
      case MsgType.Ping:
        return MsgType.Pong;
      case MsgType.FindNode:
        return MsgType.Nodes;
      case MsgType.ReqTicket:
        return MsgType.Ticket;
      case MsgType.RegTopic:
        return MsgType.RegConfirmation;
      case MsgType.TopicQuery:
        return 0; // Temporary as the spec doesn't define a corresponding response.
    }
}

export function encode(msg: IMessage): Buffer {
    switch (msg.msg_type) {
      case MsgType.Ping:
        return encodePing(msg as Ping);
      case MsgType.Pong:
        return encodePong(msg as Pong);
      case MsgType.FindNode:
        return encodeFindNode(msg as FindNode);
      case MsgType.Nodes:
        return encodeNodes(msg as Nodes);
      case MsgType.ReqTicket:
        return encodeReqTicket(msg as ReqTicket);
      case MsgType.Ticket:
        return encodeTicket(msg as Ticket);
      case MsgType.RegTopic:
        return encodeRegTopic(msg as RegTopic);
      case MsgType.RegConfirmation:
        return encodeRegConfirmation(msg as RegConfirmation);
      case MsgType.TopicQuery:
        return encodeTopicQuery(msg as TopicQuery);
    }
}

export function encodePing(ping: IPing): Buffer {
  const rlpList = RLP.encode([
    ping.request_id,
    ping.enr_seq,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(ping.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodePong(pong: IPong): Buffer {
  const rlpList = RLP.encode([
    pong.request_id,
    pong.enr_seq,
    pong.enr_seq,
    pong.recipient_ip,
    pong.recipient_port,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(pong.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeFindNode(fn: IFindNode): Buffer {
  const rlpList = RLP.encode([
    fn.request_id,
    fn.distance,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(fn.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeNodes(nodes: INodes): Buffer {
  const rlpList = RLP.encode([
    nodes.request_id,
    nodes.total,
    nodes.nodes,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(nodes.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeReqTicket(rt: IReqTicket): Buffer {
  const rlpList = RLP.encode([
    rt.request_id,
    rt.topic,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(rt.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeTicket(t: ITicket): Buffer {
  const rlpList = RLP.encode([
    t.request_id,
    t.ticket,
    t.wait_time,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(t.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeRegTopic(rt: IRegTopic): Buffer {
  const rlpList = RLP.encode([
    rt.request_id,
    rt.ticket,
    rt.node_record,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(rt.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeRegConfirmation(rc: IRegConfirmation): Buffer {
  const rlpList = RLP.encode([
    rc.request_id,
    rc.registered,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(rc.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeTopicQuery(tq: ITopicQuery): Buffer {
  const rlpList = RLP.encode([
    tq.request_id,
    tq.topic,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(tq.msg_type as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function decode(data: Buffer, msgType: MsgType): IMessage {
    switch (msgType) {
      case MsgType.Ping:
        return decodePing(data);
      case MsgType.Pong:
        return decodePong(data);
      case MsgType.FindNode:
        return decodeFindNode(data);
      case MsgType.Nodes:
        return decodeNodes(data);
      case MsgType.ReqTicket:
        return decodeReqTicket(data);
      case MsgType.Ticket:
        return decodeTicket(data);
      case MsgType.RegTopic:
        return decodeRegTopic(data);
      case MsgType.RegConfirmation:
        return decodeRegConfirmation(data);
      case MsgType.TopicQuery:
        return decodeTopicQuery(data);
    }
}

export function decodePing(data: Buffer): IPing {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    enr_seq: rlpList[1],
    msg_type: MsgType.Ping,
    request_id: rlpList[0],
    rpc_type: RpcType.Request,
  };
}

export function decodePong(data: Buffer): IPong {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    enr_seq: rlpList[1],
    msg_type: MsgType.Pong,
    recipient_ip: rlpList[2],
    recipient_port: rlpList[3],
    request_id: rlpList[0],
    rpc_type: RpcType.Response,
  };
}

export function decodeFindNode(data: Buffer): IFindNode {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    distance: rlpList[1],
    msg_type: MsgType.FindNode,
    rpc_type: RpcType.Request,
  };
}

export function decodeNodes(data: Buffer): INodes {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msg_type: MsgType.Nodes,
    nodes: rlpList[2],
    request_id: rlpList[0],
    rpc_type: RpcType.Response,
    total: rlpList[1],
  };
}

export function decodeReqTicket(data: Buffer): IReqTicket {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msg_type: MsgType.ReqTicket,
    request_id: rlpList[0],
    rpc_type: RpcType.Request,
    topic: rlpList[1],
  };
}

export function decodeTicket(data: Buffer): ITicket {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msg_type: MsgType.Ticket,
    request_id: rlpList[0],
    rpc_type: RpcType.Response,
    ticket: rlpList[1],
    wait_time: rlpList[2],
  };
}

export function decodeRegTopic(data: Buffer): IRegTopic {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msg_type: MsgType.RegTopic,
    node_record: rlpList[2],
    request_id: rlpList[0],
    rpc_type: RpcType.Request,
    ticket: rlpList[1],
  };
}

export function decodeRegConfirmation(data: Buffer): IRegConfirmation {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msg_type: MsgType.RegConfirmation,
    registered: rlpList[1],
    request_id: rlpList[0],
    rpc_type: RpcType.Reponse,
  };
}

export function decodeTopicQuery(data: Buffer): ITopicQuery {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msg_type: MsgType.TopicQuery,
    request_id: rlpList[0],
    rpc_type: RpcType.Request,
    topic: rlpList[1],
  };
}

export function newRequest(dst: ISocketAddr, p: packet, msg?: IMessage): IRequest {
  return IRequest; {
    dst,
    p,
    msg,
    delay(Date.now() + constants.REQUEST_TIMEOUT),
    1;
  }
}
