import RLP = require("rlp");
import { Input } from "rlp";
import {
  AuthHeader,
  IAuthMessagePacket,
  IAuthResponsePacket,
  IMessagePacket,
  IRandomPacket,
  IWhoAreYouPacket,
  packet,
  PacketType,
} from "./packets";

export function decodePayload(payload: Buffer, pt: any): packet {
  switch (pt) {
    case pt.RandomPacket:
      return decodeRandomPacket(payload);
    case pt.WhoAreYouPacket:
      return decodeWhoAreYouPacket(payload);
    case pt.AuthResponsePacket:
      return decodeAuthResponsePacket(payload);
    case pt.AuthMessagePacket:
      return decodeAuthMessagePacket(payload);
    case pt.MessagePacket(payload):
      return decodeMessagePacket(payload);
  }
}

export function decodeRandomPacket(payload: Buffer): IRandomPacket {
  const tag = payload.slice(0, 33);
  const authTag = RLP.decode(payload.slice(33, 47));
  const randomData = payload.slice(47);

  return {tag, auth_tag, random_data};
}

export function decodeWhoAreYouPacket(payload: Buffer): IWhoAreYouPacket {
  const magic = payload.slice(0, 33);
  const rlpList = RLP.decode(payload.slice(33) as Input);

  return {token: rlpList[0], id_nonce: rlpList[1], enr_seq: BigInt(rlpList[2]), magic};

}

export function decodeAuthResponsePacket(payload: Buffer): IAuthResponsePacket {
  const rlpList = RLP.decode(payload as Input);

  return {version: rlpList[0], id_nonce_sig: rlpList[1], node_record: rlpList[2]};
}

export function decodeAuthMessagePacket(payload: Buffer): IAuthMessagePacket {
  const tag = payload.slice(0, 33);
  const rlpList = RLP.decode(payload.slice(33, 177) as Input);
  const message = payload.slice(177);

  const ah: AuthHeader = {
    auth_response: rlpList[3],
    auth_scheme_name: "gcm",
    auth_tag: rlpList[0],
    ephemeral_pubkey: rlpList[2],
  };

  return {
    auth_header: ah,
    message,
    tag,
  };
}

export function decodeMessagePacket(payload: Buffer): IMessagePacket {
  const tag = payload.slice(0, 33);
  const authTag = RLP.decode(payload.slice(33, 47));
  const message = payload.slice(46);

  return {tag, message, auth_tag};
}

export function decodeAuthHeader(payload: Buffer): AuthHeader {
  const authTag = RLP.decode(payload.slice(0, 13));
  const authSchemeName = RLP.decode(payload.slice(13, 17));
  const ephemeralPubkey = RLP.decode(payload.slice(17, 34));
  const authResponse = RLP.decode(payload.slice(34));
  return { auth_tag, auth_scheme_name, ephemeral_pubkey, auth_response};
}
