import RLP = require("rlp");
import { Input } from "rlp";
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
    enrSeq: rlpList[1],
    msgType: MsgType.Ping,
    requestId: rlpList[0],
    rpcType: RpcType.Request,
  };
}

export function decodePong(data: Buffer): IPong {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    enrSeq: rlpList[1],
    msgType: MsgType.Pong,
    recipientIp: rlpList[2],
    recipientPort: rlpList[3],
    requestId: rlpList[0],
    rpcType: RpcType.Response,
  };
}

export function decodeFindNode(data: Buffer): IFindNode {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    distance: rlpList[1],
    msgType: MsgType.FindNode,
    rpcType: RpcType.Request,
  };
}

export function decodeNodes(data: Buffer): INodes {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msgType: MsgType.Nodes,
    nodes: rlpList[2],
    requestId: rlpList[0],
    rpcType: RpcType.Response,
    total: rlpList[1],
  };
}

export function decodeReqTicket(data: Buffer): IReqTicket {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msgType: MsgType.ReqTicket,
    requestId: rlpList[0],
    rpcType: RpcType.Request,
    topic: rlpList[1],
  };
}

export function decodeTicket(data: Buffer): ITicket {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msgType: MsgType.Ticket,
    requestId: rlpList[0],
    rpcType: RpcType.Response,
    ticket: rlpList[1],
    waitTime: rlpList[2],
  };
}

export function decodeRegTopic(data: Buffer): IRegTopic {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msgType: MsgType.RegTopic,
    nodeRecord: rlpList[2],
    requestId: rlpList[0],
    rpcType: RpcType.Request,
    ticket: rlpList[1],
  };
}

export function decodeRegConfirmation(data: Buffer): IRegConfirmation {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msgType: MsgType.RegConfirmation,
    registered: rlpList[1],
    requestId: rlpList[0],
    rpcType: RpcType.Reponse,
  };
}

export function decodeTopicQuery(data: Buffer): ITopicQuery {
  const msgType = data.slice(0, 1);
  const rlpList = RLP.decode(data.slice(1) as Input);
  return {
    msgType: MsgType.TopicQuery,
    requestId: rlpList[0],
    rpcType: RpcType.Request,
    topic: rlpList[1],
  };
}
