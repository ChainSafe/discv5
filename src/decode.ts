import { AuthHeader, IAuthMessagePacket, IAuthResponsePacket, IMessagePacket, IRandomPacket, IWhoAreYouPacket, packet, PacketType } from "./packets";
import RLP = require("rlp");
import { Input } from 'rlp';

export function decodePayload(payload: Buffer, pt: any): packet {
  switch(pt) {
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
  let tag = payload.slice(0,33);
  let auth_tag = RLP.decode(payload.slice(33,47));
  let random_data = payload.slice(47);

  return {tag: tag, auth_tag: auth_tag, random_data: random_data};
}

export function decodeWhoAreYouPacket(payload: Buffer): IWhoAreYouPacket {
  let magic = payload.slice(0, 33);
  let rlpList = RLP.decode(payload.slice(33) as Input);

  return {token: rlpList[0], id_nonce: rlpList[1], enr_seq: BigInt(rlpList[2]), magic: magic};

}

export function decodeAuthResponsePacket(payload: Buffer): IAuthResponsePacket {
  let rlpList = RLP.decode(payload as Input);

  return {version: rlpList[0], id_nonce_sig: rlpList[1], node_record: rlpList[2]};
}

export function decodeAuthMessagePacket(payload: Buffer): IAuthMessagePacket {
  let tag = payload.slice(0, 33);
  let rlpList = RLP.decode(payload.slice(33, 177) as Input);
  let message = payload.slice(177);

  let ah: AuthHeader = {
    auth_tag: rlpList[0],
    auth_scheme_name: "gcm",
    ephemeral_pubkey: rlpList[2],
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
  let auth_tag = RLP.decode(payload.slice(33, 47));
  let message = payload.slice(46);

  return {tag: tag, message: message, auth_tag: auth_tag};
}
