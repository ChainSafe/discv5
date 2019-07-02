// DISCV5 message packet types
// Max packet size = 1280 bytes

const Buffer = require('Buffer')

// Packet format
export interface Packet {
  tag: Buffer;
  dest_node_id: Buffer;
  src_node_id: Buffer;  
}

/*
 * Packet messages
 */
export interface RandomPacket {
  random_packet: Buffer;
  auth_tag: Buffer;
  random_data: Buffer;
}

export interface WhoAreYou {
  whoareyou_packet: Buffer;
  magic: Buffer;
  token: Buffer;
  enr_seq: bigint;
}

/**
 * To distinguish between both Message packet types, 
 * check the value at offset 32 after the fixed-sized tag is an RLP list or a byte array
 */
export interface MessagePacket {
  message_packet: Buffer;
  auth_header: Array<Buffer>;
  auth_scheme_name: string;
  auth_response: Buffer;
  auth_response_pt: Array<any>;
  zero_nonce: Buffer;
  id_nonce_sig: Buffer;
  static_node_key: Buffer;
  message: Buffer;
  message_pt: Buffer;
  auth_tag: Buffer;
}

export interface MessagePacketHandshake {
  message_packet: Buffer;
  message: Buffer;
}

/**
 * Protocol Messages
 */

// 0x01
// Request
export interface Ping {
  message_data: Array<any>;
  enr_seq: bigint;
}

// 0x02
// Response
export interface Pong {
  message_data: Array<any>;
  enr_seq: bigint;
  packet_ip: Buffer;
  packet_port: number;
}

// 0x03
//Request
export interface FindNode {
  message_data: Array<any>;
  distance: number;
}

// 0x04
// Response
export interface Nodes {
  message_data: Array<any>;
  total: number;
}

// 0x05
// Request
export interface ReqTicket {
  message_data: Array<any>;
  topic: Buffer;
}

// 0x06
// Response
export interface Ticket {
  message_data: Array<any>;
  ticket: Buffer;
  wait_time: bigint;
}

// 0x07
// Request
export interface RegTopic {
  message_data: Array<any>;
  ticket: Buffer;
}

// 0x08
// Response
export interface RegConfirmation {
  message_data: Array<any>;
  registered: boolean;
}

// 0x09
// Request
export interface TopicQuery {
  message_data: Array<any>;
  topic: Buffer;
}
