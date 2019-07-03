// DISCV5 message packet types
// Max packet size = 1280 bytes

import { Buffer } from "types/Buffer";

// Packet format
export interface IPacket {
  tag: Buffer;
  dest_node_id: Buffer;
  src_node_id: Buffer;
}

/*
 * Packet messages
 */
export interface IRandomPacket {
  random_packet: Buffer;
  auth_tag: Buffer;
  random_data: Buffer;
}

export interface IWhoAreYou {
  whoareyou_packet: Buffer;
  magic: Buffer;
  token: Buffer;
  enr_seq: bigint;
}

/**
 * To distinguish between both Message packet types,
 * check the value at offset 32 after the fixed-sized tag is an RLP list or a byte array
 */
export interface IMessagePacket {
  message_packet: Buffer;
  auth_header: Buffer[];
  auth_scheme_name: string;
  auth_response: Buffer;
  auth_response_pt: any[];
  zero_nonce: Buffer;
  id_nonce_sig: Buffer;
  static_node_key: Buffer;
  message: Buffer;
  message_pt: Buffer;
  auth_tag: Buffer;
}

export interface IMessagePacketHandshake {
  message_packet: Buffer;
  message: Buffer;
}

type request = IPing | IFindNode | IReqTicket | IRegTopic | ITopicQuery;
type response = IPong | INodes | ITicket | IRegConfirmation;

/**
 * Protocol Messages
 */

// 0x01
// Request
export interface IPing {
  message_data: any[];
  enr_seq: bigint;
}

// 0x02
// Response
export interface IPong {
  message_data: any[];
  enr_seq: bigint;
  packet_ip: Buffer;
  packet_port: number;
}

// 0x03
// Request
export interface IFindNode {
  message_data: any[];
  distance: number;
}

// 0x04
// Response
export interface INodes {
  message_data: any[];
  total: number;
}

// 0x05
// Request
export interface IReqTicket {
  message_data: any[];
  topic: Buffer;
}

// 0x06
// Response
export interface ITicket {
  message_data: any[];
  ticket: Buffer;
  wait_time: bigint;
}

// 0x07
// Request
export interface IRegTopic {
  message_data: any[];
  ticket: Buffer;
}

// 0x08
// Response
export interface IRegConfirmation {
  message_data: any[];
  registered: boolean;
}

// 0x09
// Request
export interface ITopicQuery {
  message_data: any[];
  topic: Buffer;
}
