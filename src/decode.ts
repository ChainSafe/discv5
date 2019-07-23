import { AuthHeader, IAuthPacket, IMessagePacket, IRandomPacket, IWhoAreYouPacket, packet, PacketType } from "./packets";
import RLP = require("rlp");


export function decodePayload(payload: Buffer, pt: any): packet {
  switch(pt) {
    case pt.RandomPacket:
      return decodeRandomPacket(payload);
    case pt.WhoAreYouPacket:
      return decodeWhoAreYouPacket(payload);
    case pt.AuthPacket:
      return decodeAuthPacket(payload);
    case pt.MessagePacket(payload):
      return decodeMessagePacket(payload);
  }
}

export function decodeRandomPacket(payload: Buffer): IRandomPacket {
  let tag = payload.slice(0,33);
  let auth_tag = payload.slice(33,46);
  let random_data = payload.slice(46);

  return {tag: tag, auth_tag: auth_tag, random_data: random_data};
}

export function decodeWhoAreYouPacket(payload: Buffer): IWhoAreYouPacket {
  let tag = payload.slice(0, 33);
  let magic = payload.slice(33, 66);
  let rlpList = RLP.decode(payload.slice(66));

  return {tag: tag, token: rlpList[0] as Buffer, id_nonce: rlpList[1] as Buffer, enr_seq: bigint(rlpList[2]), magic: magic};

}

export function decodeAuthPacket(payload: Buffer): IAuthPacket {
  let tag = payload.slice(0, 33);
  let rlpList = payload.slice(33, 162);
  rlpList = RLP.decode(rlpList);
  let message = payload.slice(162);

  let ah: AuthHeader = {
    auth_tag: rlpList[0],
    auth_scheme_name: "gcm",
    auth_ephemeral_pubkey: rlpList[2],
    auth_response: rlpList[3]
  }

  return {
    tag: tag,
    auth_header: ah,
    message: message
  }
}

export function decodeMessagePacket(payload: Buffer): IMessagePacket{
  let tag = payload.slice(0, 33);
  let auth_tag = RLP.decode(payload.slice(33, 46));
  let message = payload.slice(46);

  return {tag: tag, message: message, auth_tag: auth_tag};
}
