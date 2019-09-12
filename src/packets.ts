// DISCV5 message packet types
// Max packet size = 1280 bytes
import { Nonce } from "./crypto/misc_crypto_types";

import { EthereumNodeRecord } from "./enr/enr";

export type packet = IRandomPacket | IRegularPacket | IWhoAreYouPacket | IAuthResponsePacket | IAuthMessagePacket | IMessagePacket;

export type AuthHeader = IAuthHeader;

// Packet format
export interface IRegularPacket {
  tag: Buffer;
}

/*
 * Packet messages
 */
export interface IRandomPacket extends IRegularPacket {
  auth_tag: Buffer;
  random_data: Buffer;
}

export interface IWhoAreYouPacket extends IRegularPacket {
  magic: Buffer;
  token: Buffer;
  enr_seq: bigint;
  id_nonce: Nonce;
}

export interface IAuthResponsePacket {
  version: 5;
  id_nonce_sig: Buffer;
  node_record: EthereumNodeRecord[];
}

export interface IAuthHeader {
  auth_tag: Buffer;
  auth_scheme_name: "gcm";
  ephemeral_pubkey: Buffer;
  auth_response: Buffer;
}

export interface IAuthMessagePacket extends IRegularPacket {
  auth_header: AuthHeader;
  message: Buffer;
}

export interface IMessagePacket extends IRegularPacket {
  message: Buffer;
  auth_tag: Buffer;
}

export enum PacketType {
  RandomPacket = 1,
  WhoAreYouPacket,
  AuthMessagePacket,
  AuthResponsePacket,
  MessagePacket,
}
