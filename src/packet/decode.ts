import RLP = require("rlp");
import {
  IAuthHeader,
  IAuthMessagePacket,
  IMessagePacket,
  IRandomPacket,
  IWhoAreYouPacket,
  Packet,
  PacketType,
  Tag,
} from "./types";

import {
  AUTH_TAG_LENGTH,
  ERR_INVALID_BYTE_SIZE,
  ERR_TOO_SMALL,
  ERR_UNKNOWN_FORMAT,
  ERR_UNKNOWN_PACKET,
  ID_NONCE_LENGTH,
  MAGIC_LENGTH,
  TAG_LENGTH,
} from "../constants";

export function decode(data: Buffer, magic: Buffer): Packet {
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
    return decodeWhoAreYou(tag, data);
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

export function decodeWhoAreYou(tag: Tag, data: Buffer): IWhoAreYouPacket {
  // 32 tag + 32 magic + 32 token + 12 id + 2 enr + 1 rlp
  const magic = data.slice(TAG_LENGTH, TAG_LENGTH + MAGIC_LENGTH);
  // decode the rlp list
  let rlp: Buffer[];
  try {
    rlp = RLP.decode(data.slice(TAG_LENGTH + MAGIC_LENGTH)) as unknown as Buffer[];
  } catch (e) {
    throw new Error(ERR_UNKNOWN_FORMAT);
  }
  if (rlp.length !== 3) {
    throw new Error(ERR_UNKNOWN_FORMAT);
  }
  const [enrSeqBytes, idNonce, token] = rlp;
  if (
    idNonce.length !== ID_NONCE_LENGTH ||
    token.length !== AUTH_TAG_LENGTH
  ) {
    throw new Error(ERR_INVALID_BYTE_SIZE);
  }
  const enrSeq = BigInt(`0x${enrSeqBytes.toString("hex")}`);
  return {
    tag,
    token,
    magic,
    id_nonce: idNonce,
    enr_seq: enrSeq,
  };
}

export function decodeStandardMessage(tag: Tag, data: Buffer): IMessagePacket {

  let authTag: Buffer;
  try {
    authTag = RLP.decode(data.slice(TAG_LENGTH, TAG_LENGTH + AUTH_TAG_LENGTH + 1));
  } catch (e) {
    throw new Error(ERR_UNKNOWN_FORMAT);
  }
  return {
    tag,
    auth_tag: authTag,
    message: data.slice(TAG_LENGTH + AUTH_TAG_LENGTH + 1),
  };
}

export function decodeAuthHeader(tag: Tag, data: Buffer, rlpLength: number): IAuthMessagePacket {
  let authHeaderRlp: Buffer[];
  try {
    authHeaderRlp = RLP.decode(data.slice(TAG_LENGTH, TAG_LENGTH + rlpLength)) as unknown as Buffer[];
  } catch (e) {
    throw new Error(ERR_UNKNOWN_FORMAT);
  }
  if (authHeaderRlp.length !== 4) {
    throw new Error(ERR_UNKNOWN_FORMAT);
  }
  const [
    authTag,
    authSchemeNameBytes,
    ephemeralPubkey,
    authResponse,
  ] = authHeaderRlp;
  return {
    tag,
    auth_header: {
      auth_tag: authTag,
      auth_scheme_name: authSchemeNameBytes.toString("utf8"),
      ephemeral_pubkey: ephemeralPubkey,
      auth_response: authResponse,
    },
    message: data.slice(TAG_LENGTH + rlpLength),
  };
}
