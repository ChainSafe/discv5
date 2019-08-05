import { IAuthMessagePacket, IAuthResponsePacket, IMessagePacket, IRandomPacket, IWhoAreYouPacket, packet, PacketType } from "./packets";
import RLP = require("rlp");


export function encodePacket(data: packet, pt: any): Buffer {
  switch(pt) {
    case pt.RandomPacket: 
      return encodeRandomPacket(data as IRandomPacket);
    case pt.WhoAreYouPacket:
      return encodeWhoAreYouPacket(data as IWhoAreYouPacket);
    case pt.AuthResponsePacket:
      return encodeAuthResponsePacket(data as IAuthResponsePacket);
    case pt.AuthMessagePacket:
      return encodeAuthMessagePacket(data as IAuthMessagePacket);
    case pt.MessagePacket:
      return encodeMessagePacket(data as IMessagePacket);
  }
}

function encodeRandomPacket(rp: IRandomPacket): Buffer {
  let rlpEncodedAuthTag = RLP.encode(rp.auth_tag);
  return Buffer.concat([rp.tag, rlpEncodedAuthTag, rp.random_data]);
}

function encodeWhoAreYouPacket(wp: IWhoAreYouPacket): Buffer {
  let rlpList = RLP.encode([
    wp.token, 
    wp.id_nonce,
    wp.enr_seq  
  ]);  

  return Buffer.concat([wp.magic, rlpList]);  
}

function encodeAuthResponsePacket(ar: IAuthResponsePacket): Buffer {
  let rlpList = RLP.encode([
    ar.version,
    ar.id_nonce_sig,
    ar.node_record
  ]);

  return rlpList;
}

function encodeAuthMessagePacket(ap: IAuthMessagePacket): Buffer {
  let rlpList = RLP.encode([
    ap.auth_header.auth_tag,
    ap.auth_header.auth_scheme_name,
    ap.auth_header.ephemeral_pubkey,
    ap.auth_header.auth_response 
  ]);
  return Buffer.concat([ap.tag, rlpList, ap.message]);
}

function encodeMessagePacket(mp: IMessagePacket): Buffer {
  return Buffer.concat([mp.tag, RLP.encode(mp.auth_tag), mp.message]);
}
