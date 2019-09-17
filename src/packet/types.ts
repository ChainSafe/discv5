// DISCV5 message packet types

import { EthereumNodeRecord } from "../enr/enr";

export type Tag = Buffer; // TAG_LENGTH
export type Nonce = Buffer; // ID_NONCE_LENGTH
export type AuthTag = Buffer; // AUTH_TAG_LENGTH
export type Magic = Buffer; // MAGIC_LENGTH

export enum PacketType {
  Random = 1,
  WhoAreYou,
  AuthMessage,
  Message,
}

export type Packet = IRandomPacket | IWhoAreYouPacket | IAuthMessagePacket | IMessagePacket;

export interface IAuthHeader {
  auth_tag: Buffer;
  auth_scheme_name: "gcm" | string;
  ephemeral_pubkey: Buffer;
  auth_response: Buffer;
}

// Packet format

export interface IRegularPacket {
  // The XOR(SHA256(dest-node-id), src-node-id).
  tag: Tag;
}

/**
 * Packets
 */

export interface IRandomPacket extends IRegularPacket {
  // Random auth_tag formatted as rlp_bytes(bytes).
  auth_tag: AuthTag;
  // At least 44 bytes of random data.
  random_data: Buffer;
}

export interface IWhoAreYouPacket extends IRegularPacket {
  // SHA256(`dest-node-id` || "WHOAREYOU").
  magic: Magic;
  // The auth-tag of the request.
  token: AuthTag;
  // The `id-nonce` to prevent handshake replays.
  id_nonce: Nonce;
  // Highest known ENR sequence number of node.
  enr_seq: bigint;
}

export interface IAuthMessagePacket extends IRegularPacket {
  // Authentication header.
  auth_header: IAuthHeader;
  // The encrypted message including the authentication header.
  message: Buffer;
}

export interface IMessagePacket extends IRegularPacket {
  // 12 byte Authentication nonce.
  auth_tag: AuthTag;
  // The encrypted message as raw bytes.
  message: Buffer;
}
