import { Input } from "rlp";
import RLP = require("rlp");
import * as constants from "../constants.ts";
import {
 IFindNode,
 IMessage,
 INodes,
 IPing,
 IPong,
 IRegConfirmation,
 IRegTopic,
 IReqTicket,
 IRequest,
 ITicket,
 ITopicQuery,
 MsgType,
 RpcType,
} from "./types";

export function encode(msg: IMessage): Buffer {
    switch (msg.msgType) {
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
    ping.requestId,
    ping.enrSeq,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(ping.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodePong(pong: IPong): Buffer {
  const rlpList = RLP.encode([
    pong.requestId,
    pong.enrSeq,
    pong.recipientIp,
    pong.recipientPort,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(pong.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeFindNode(fn: IFindNode): Buffer {
  const rlpList = RLP.encode([
    fn.requestId,
    fn.distance,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(fn.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeNodes(nodes: INodes): Buffer {
  const rlpList = RLP.encode([
    nodes.requestId,
    nodes.total,
    nodes.nodes,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(nodes.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeReqTicket(rt: IReqTicket): Buffer {
  const rlpList = RLP.encode([
    rt.requestId,
    rt.topic,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(rt.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeTicket(t: ITicket): Buffer {
  const rlpList = RLP.encode([
    t.requestId,
    t.ticket,
    t.waitTime,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(t.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeRegTopic(rt: IRegTopic): Buffer {
  const rlpList = RLP.encode([
    rt.requestId,
    rt.ticket,
    rt.nodeRecord,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(rt.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeRegConfirmation(rc: IRegConfirmation): Buffer {
  const rlpList = RLP.encode([
    rc.requestId,
    rc.registered,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(rc.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}

export function encodeTopicQuery(tq: ITopicQuery): Buffer {
  const rlpList = RLP.encode([
    tq.requestId,
    tq.topic,
  ]);
  const buf = Buffer.alloc(10);
  buf.writeUInt8(tq.msgType as number, 0);
  return Buffer.concat([buf, rlpList]);
}
