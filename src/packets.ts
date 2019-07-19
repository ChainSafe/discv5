// DISCV5 message packet types
// Max packet size = 1280 bytes

type packet = IRandomPacket | IWhoAreYouPacket | IAuthPacket | IMessagePacket;

type AuthHeader = IAuthHeader;

// Packet format
export interface IPacket {
  tag: Buffer;
}

/*
 * Packet messages
 */
export interface IRandomPacket extends IPacket {
  auth_tag: Buffer;
  random_data: Buffer;
}

export interface IWhoAreYouPacket extends IPacket {
  magic: Buffer;
  token: Buffer;
  enr_seq: bigint;
  id_nonce: Buffer;
}

export interface IAuthHeader {
  auth_tag: Buffer;
  auth_scheme_name: string;
  ephemeral_pubkey: Buffer;
  auth_response: Buffer;
}

export interface IAuthPacket extends IPacket {
  auth_header: AuthHeader;
  message: Buffer;
}

export interface IMessagePacket extends IPacket {
  message: Buffer;
  auth_tag: Buffer;
}
export enum PacketType {
  RandomPacket = 1,
  WhoAreYouPacket,
  AuthPacket,
  MessagePacket,
}
