import RLP = require("rlp");
import {
  IAuthHeader,
  IAuthMessagePacket,
  IAuthResponsePacket,
  IMessagePacket,
  IRandomPacket,
  IWhoAreYouPacket,
  Packet,
  PacketType,
} from "./types";

export function encode(type: PacketType, packet: Packet): Buffer {
  switch (type) {
    case PacketType.RandomPacket:
      return encodeRandomPacket(packet as IRandomPacket);
    case PacketType.WhoAreYouPacket:
      return encodeWhoAreYouPacket(packet as IWhoAreYouPacket);
    case PacketType.AuthResponsePacket:
      return encodeAuthResponsePacket(packet as IAuthResponsePacket);
    case PacketType.AuthMessagePacket:
      return encodeAuthMessagePacket(packet as IAuthMessagePacket);
    case PacketType.MessagePacket:
      return encodeMessagePacket(packet as IMessagePacket);
  }
}

export function encodeAuthHeader(h: IAuthHeader): Buffer {
  return RLP.encode([
    h.auth_tag,
    h.auth_scheme_name,
    h.ephemeral_pubkey,
    h.auth_response,
  ]);
}

function encodeRandomPacket(p: IRandomPacket): Buffer {
  return Buffer.concat([
    p.tag,
    RLP.encode(p.auth_tag),
    p.random_data,
  ]);
}

function encodeWhoAreYouPacket(p: IWhoAreYouPacket): Buffer {
  return Buffer.concat([
    p.magic,
    RLP.encode([
      p.token,
      p.id_nonce,
      p.enr_seq,
    ]),
  ]);
}

function encodeAuthResponsePacket(p: IAuthResponsePacket): Buffer {
  return RLP.encode([
    p.version,
    p.id_nonce_sig,
    p.node_record,
  ]);
}

function encodeAuthMessagePacket(p: IAuthMessagePacket): Buffer {
  return Buffer.concat([
    p.tag,
    encodeAuthHeader(p.auth_header),
    p.message,
  ]);
}

function encodeMessagePacket(p: IMessagePacket): Buffer {
  return Buffer.concat([
    p.tag,
    RLP.encode(p.auth_tag),
    p.message,
  ]);
}
