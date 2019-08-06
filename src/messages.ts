import { EthereumNodeRecord } from "./enr";
import RLP = require('rlp');
import { Input } from 'rlp';

namespace RPC {
    export enum MsgType {
      Ping = 1,
      Pong,
      FindNode,
      Nodes,
      ReqTicket,
      Ticket,
      RegTopic,
      RegConfirmation,
      TopicQuery
    }

    export interface Message {
      request_id: number;
      msg_type: MsgType;
    }


    export interface Ping extends Message {
      msg_type: MsgType.Ping;
      enr_seq: bigint;
    }

    export interface Pong extends Message {
      msg_type: MsgType.Pong;
      enr_seq: bigint;
      recipient_ip: string;
      recipient_port: number;
    }

    export interface FindNode extends Message {
      msg_type: MsgType.FindNode;
      distance: number;
    }

    export interface Nodes extends Message {
      msg_type: MsgType.Nodes;
      total: number;
      nodes: any[];
    }

    export interface ReqTicket extends Message {
      msg_type: MsgType.ReqTicket;
      topic: Buffer;
    }

    export interface Ticket extends Message {
      msg_type: MsgType.Ticket;
      ticket: Buffer[];
      wait_time: number;
    }

    export interface RegTopic extends Message {
      msg_type: MsgType.RegTopic;
      ticket: Buffer[];
      node_record: any[];
    }

    export interface RegConfirmation extends Message {
      msg_type: MsgType.RegConfirmation;
      registered: boolean;
    }

    export interface TopicQuery extends Message {
      msg_type: MsgType.TopicQuery;
      topic: Buffer;
    }

    export function matchRequest(reqType: MsgType): MsgType {
        switch(reqType) {
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

    export function encode(msg: Message): Buffer {
        switch(msg.msg_type) {
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

    export function encodePing(ping: Ping): Buffer {
      let rlpList = RLP.encode([ 
        ping.request_id, 
        ping.enr_seq
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(ping.msg_type as number, 0);
      return Buffer.concat([buf, rlpList])
    }

    export function encodePong(pong: Pong): Buffer {
      let rlpList = RLP.encode([ 
        pong.request_id,
        pong.enr_seq,
        pong.recipient_ip,
        pong.recipient_port
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(pong.msg_type as number, 0);
      return Buffer.concat([buf, rlpList]);
    }

    export function encodeFindNode(fn: FindNode): Buffer {
      let rlpList = RLP.encode([
        fn.request_id,
        fn.distance
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(fn.msg_type as number, 0);
      return Buffer.concat([buf, rlpList]);
    }

    export function encodeNodes(nodes: Nodes): Buffer {
      let rlpList = RLP.encode([
        nodes.request_id,
        nodes.total,
        nodes.nodes
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(nodes.msg_type as number, 0);
      return Buffer.concat([buf, rlpList]);
    }

    export function encodeReqTicket(rt: ReqTicket): Buffer {
      let rlpList = RLP.encode([
        rt.request_id,
        rt.topic
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(rt.msg_type as number, 0);
      return Buffer.concat([buf, rlpList]);
    }

    export function encodeTicket(t: Ticket): Buffer {
      let rlpList = RLP.encode([
        t.request_id,
        t.ticket,
        t.wait_time
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(t.msg_type as number, 0); 
      return Buffer.concat([buf, rlpList]);
    }

    export function encodeRegTopic(rt: RegTopic): Buffer {
      let rlpList = RLP.encode([
        rt.request_id,
        rt.ticket,
        rt.node_record
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(rt.msg_type as number, 0); 
      return Buffer.concat([buf, rlpList]);
    }

    export function encodeRegConfirmation(rc: RegConfirmation): Buffer {
      let rlpList = RLP.encode([
        rc.request_id,
        rc.registered
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(rc.msg_type as number, 0); 
      return Buffer.concat([buf, rlpList]);
    }

    export function encodeTopicQuery(tq: TopicQuery): Buffer {
      let rlpList = RLP.encode([
        tq.request_id,
        tq.topic
      ]);
      let buf = Buffer.alloc(10);
      buf.writeUInt8(tq.msg_type as number, 0);  
      return Buffer.concat([buf, rlpList]);
    }

    export function decode(data: Buffer, msgType: MsgType): Message {
        switch(msgType) {
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

    export function decodePing(data: Buffer): Ping {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return { 
        msg_type: MsgType.Ping, 
        request_id: rlpList[0], 
        enr_seq: rlpList[1]
      };
    }

    export function decodePong(data: Buffer): Pong {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return { 
        msg_type: MsgType.Pong, 
        request_id: rlpList[0], 
        enr_seq: rlpList[1],
        recipient_ip: rlpList[2],
        recipient_port: rlpList[3]
      };
    }

    export function decodeFindNode(data: Buffer): FindNode {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return {
        msg_type: MsgType.FindNode,
        request_id: rlpList[0],
        distance: rlpList[1]
      };
    }

    export function decodeNodes(data: Buffer): Nodes {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return {
        msg_type: MsgType.Nodes,
        request_id: rlpList[0],
        total: rlpList[1],
        nodes: rlpList[2],
      };
    }

    export function decodeReqTicket(data: Buffer): ReqTicket {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return {
        msg_type: MsgType.ReqTicket,
        request_id: rlpList[0],
        topic: rlpList[1]
      };
    }

    export function decodeTicket(data: Buffer): Ticket {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return {
        msg_type: MsgType.Ticket,
        request_id: rlpList[0],
        ticket: rlpList[1],
        wait_time: rlpList[2]
      };
    }

    export function decodeRegTopic(data: Buffer): RegTopic {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return {
        msg_type: MsgType.RegTopic,
        request_id: rlpList[0],
        ticket: rlpList[1],
        node_record: rlpList[2]
      };
    }

    export function decodeRegConfirmation(data: Buffer): RegConfirmation {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return {
        msg_type: MsgType.RegConfirmation,
        request_id: rlpList[0],
        registered: rlpList[1],
      };
    }

    export function decodeTopicQuery(data: Buffer): TopicQuery {
      let msg_type = data.slice(0, 1);
      let rlpList = RLP.decode(data.slice(1) as Input);
      return {
        msg_type: MsgType.TopicQuery,
        request_id: rlpList[0],
        topic: rlpList[1],
      };
    }
}
