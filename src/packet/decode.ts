import RLP = require("rlp");
import { Input } from "rlp";
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

import {
  AUTH_TAG_LENGTH,
  ERR_TOO_SMALL,
  ERR_UNKNOWN_PACKET,
  MAGIC_LENGTH,
  TAG_LENGTH,
  ERR_UNKNOWN_FORMAT,
  ERR_INVALID_BYTE_SIZE,
} from "../constants";

export function decode(data: Buffer, magic: Buffer): [PacketType, Packet] {
  // ensure the packet is large enough to contain the correct headers
  if (data.length < TAG_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error(ERR_TOO_SMALL);
  }
  const tag = data.slice(0, TAG_LENGTH);

  // initially look for a WHOAREYOU packet
  if (
    data.length >= TAG_LENGTH + MAGIC_LENGTH &&
    data.slice(TAG_LENGTH, TAG_LENGTH + MAGIC_LENGTH).equals(magic)
  ) {
    return decodeWhoAreYouPacket(tag, data);
  } else if (data[TAG_LENGTH] === 140) { // check for RLP(bytes) or RLP(list)
    return decodeStandardMessage(tag, data);
  }
  // not a Random Packet or standard message, may be a message with authentication header
  const rlp = RLP.decode(data.slice(TAG_LENGTH));
  if (Array.isArray(rlp)) {
    // potentially authentication header
    const rlpLength = rlp.length;
    return decodeAuthHeader(tag, data, rlpLength);
  }
  throw new Error(ERR_UNKNOWN_PACKET);
}

export function decodeRandomPacket(payload: Buffer): IRandomPacket {
  const tag = payload.slice(0, 33);
  const authTag = RLP.decode(payload.slice(33, 47));
  const randomData = payload.slice(47);

  return {tag, auth_tag, random_data};
}

export function decodeWhoAreYouPacket(tag: Tag, data: Buffer): IWhoAreYouPacket {
  // 32 tag + 32 magic + 32 token + 12 id + 2 enr + 1 rlp
  const magic = data.slice(TAG_LENGTH, TAG_LENGTH + MAGIC_LENGTH);
  // decode the rlp list
  let rlp: Buffer[];
  try {
    rlp = RLP.decode(data.slice(TAG_LENGTH + MAGIC_LENGTH));
  } catch (e) {
    throw new Error(ERR_UNKNOWN_FORMAT);
  }
  if (rlp.length !== 3) {
    throw new Error(ERR_UNKNOWN_FORMAT);
  }
  const [enrSeqBytes, idNonceBytes, tokenBytes] = rlp;
  if (
    idNonceBytes.length !== ID_NONCE_LENGTH ||
    tokenBytes.length !== AUTH_TAG_LENGTH
  ) {
    throw new Error(ERR_INVALID_BYTE_SIZE);
  }
  const enrSeq = BigInt(`0x${enrSeqBytes.toString("hex")}`);




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
