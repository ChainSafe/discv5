import Crypto from "node:crypto";

import { bufferToNumber, CodeError, numberToBuffer } from "../util/index.js";
import {
  AUTHDATA_SIZE_SIZE,
  EPH_KEY_SIZE_SIZE,
  ERR_INVALID_FLAG,
  ERR_INVALID_PROTOCOL_ID,
  ERR_INVALID_VERSION,
  ERR_INVALID_AUTHDATA_SIZE,
  ERR_TOO_LARGE,
  ERR_TOO_SMALL,
  FLAG_SIZE,
  MASKING_IV_SIZE,
  MASKING_KEY_SIZE,
  MAX_PACKET_SIZE,
  MESSAGE_AUTHDATA_SIZE,
  MIN_PACKET_SIZE,
  NONCE_SIZE,
  PROTOCOL_SIZE,
  SIG_SIZE_SIZE,
  STATIC_HEADER_SIZE,
  VERSION_SIZE,
  WHOAREYOU_AUTHDATA_SIZE,
  ID_NONCE_SIZE,
  MIN_HANDSHAKE_AUTHDATA_SIZE,
} from "./constants.js";
import { IHandshakeAuthdata, IHeader, IMessageAuthdata, IPacket, IWhoAreYouAuthdata, PacketType } from "./types.js";
import { bytesToHex, concatBytes, hexToBytes } from "ethereum-cryptography/utils.js";
import { bigintToBytes, bytesToBigint } from "@chainsafe/enr";

export function encodePacket(destId: string, packet: IPacket): Uint8Array {
  return concatBytes(packet.maskingIv, encodeHeader(destId, packet.maskingIv, packet.header), packet.message);
}

export function encodeHeader(destId: string, maskingIv: Uint8Array, header: IHeader): Uint8Array {
  const ctx = Crypto.createCipheriv("aes-128-ctr", hexToBytes(destId).slice(0, MASKING_KEY_SIZE), maskingIv);
  return ctx.update(
    concatBytes(
      // static header
      Buffer.from(header.protocolId, "ascii"),
      numberToBuffer(header.version, VERSION_SIZE),
      numberToBuffer(header.flag, FLAG_SIZE),
      header.nonce,
      numberToBuffer(header.authdataSize, AUTHDATA_SIZE_SIZE),
      // authdata
      header.authdata
    )
  );
}

export function decodePacket(srcId: string, data: Uint8Array): IPacket {
  if (data.length < MIN_PACKET_SIZE) {
    throw new CodeError(`Packet too small: ${data.length}`, ERR_TOO_SMALL);
  }
  if (data.length > MAX_PACKET_SIZE) {
    throw new CodeError(`Packet too large: ${data.length}`, ERR_TOO_LARGE);
  }

  const maskingIv = data.slice(0, MASKING_IV_SIZE);
  const [header, headerBuf] = decodeHeader(srcId, maskingIv, data.slice(MASKING_IV_SIZE));

  const message = data.slice(MASKING_IV_SIZE + headerBuf.length);
  return {
    maskingIv,
    header,
    message,
    messageAd: concatBytes(maskingIv, headerBuf),
  };
}

/**
 * Return the decoded header and the header as a buffer
 */
export function decodeHeader(srcId: string, maskingIv: Uint8Array, data: Uint8Array): [IHeader, Uint8Array] {
  const ctx = Crypto.createDecipheriv("aes-128-ctr", hexToBytes(srcId).slice(0, MASKING_KEY_SIZE), maskingIv);
  // unmask the static header
  const staticHeaderBuf = ctx.update(data.slice(0, STATIC_HEADER_SIZE));

  // validate the static header field by field
  const protocolId = staticHeaderBuf.slice(0, PROTOCOL_SIZE).toString("ascii");
  if (protocolId !== "discv5") {
    throw new CodeError(`Invalid protocol id: ${protocolId}`, ERR_INVALID_PROTOCOL_ID);
  }

  const version = bufferToNumber(staticHeaderBuf.slice(PROTOCOL_SIZE, PROTOCOL_SIZE + VERSION_SIZE), VERSION_SIZE);
  if (version !== 1) {
    throw new CodeError(`Invalid version: ${version}`, ERR_INVALID_VERSION);
  }

  const flag = bufferToNumber(
    staticHeaderBuf.slice(PROTOCOL_SIZE + VERSION_SIZE, PROTOCOL_SIZE + VERSION_SIZE + FLAG_SIZE),
    FLAG_SIZE
  );
  if (PacketType[flag] == null) {
    throw new CodeError(`Invalid flag: ${flag}`, ERR_INVALID_FLAG);
  }

  const nonce = staticHeaderBuf.slice(
    PROTOCOL_SIZE + VERSION_SIZE + FLAG_SIZE,
    PROTOCOL_SIZE + VERSION_SIZE + FLAG_SIZE + NONCE_SIZE
  );

  const authdataSize = bufferToNumber(
    staticHeaderBuf.slice(PROTOCOL_SIZE + VERSION_SIZE + FLAG_SIZE + NONCE_SIZE),
    AUTHDATA_SIZE_SIZE
  );

  // Once the authdataSize is known, unmask the authdata
  const authdata = ctx.update(data.slice(STATIC_HEADER_SIZE, STATIC_HEADER_SIZE + authdataSize));

  return [
    {
      protocolId,
      version,
      flag,
      nonce,
      authdataSize,
      authdata,
    },
    Buffer.concat([staticHeaderBuf, authdata]),
  ];
}

// authdata

export function encodeWhoAreYouAuthdata(authdata: IWhoAreYouAuthdata): Uint8Array {
  return concatBytes(authdata.idNonce, bigintToBytes(authdata.enrSeq));
}

export function encodeMessageAuthdata(authdata: IMessageAuthdata): Uint8Array {
  return hexToBytes(authdata.srcId);
}

export function encodeHandshakeAuthdata(authdata: IHandshakeAuthdata): Uint8Array {
  return concatBytes(
    hexToBytes(authdata.srcId),
    numberToBuffer(authdata.sigSize, SIG_SIZE_SIZE),
    numberToBuffer(authdata.ephKeySize, EPH_KEY_SIZE_SIZE),
    authdata.idSignature,
    authdata.ephPubkey,
    authdata.record || Buffer.alloc(0)
  );
}

export function decodeWhoAreYouAuthdata(data: Uint8Array): IWhoAreYouAuthdata {
  if (data.length !== WHOAREYOU_AUTHDATA_SIZE) {
    throw new CodeError(`Invalid authdata length: ${data.length}`, ERR_INVALID_AUTHDATA_SIZE);
  }
  return {
    idNonce: data.slice(0, ID_NONCE_SIZE),
    enrSeq: bytesToBigint(data.slice(ID_NONCE_SIZE)),
  };
}

export function decodeMessageAuthdata(data: Uint8Array): IMessageAuthdata {
  if (data.length !== MESSAGE_AUTHDATA_SIZE) {
    throw new CodeError(`Invalid authdata length: ${data.length}`, ERR_INVALID_AUTHDATA_SIZE);
  }
  return {
    srcId: bytesToHex(data),
  };
}

export function decodeHandshakeAuthdata(data: Uint8Array): IHandshakeAuthdata {
  if (data.length < MIN_HANDSHAKE_AUTHDATA_SIZE) {
    throw new CodeError(`Invalid authdata length: ${data.length}`, ERR_INVALID_AUTHDATA_SIZE);
  }
  const srcId = bytesToHex(data.slice(0, 32));
  const sigSize = data[32];
  const ephKeySize = data[33];
  const idSignature = data.slice(34, 34 + sigSize);
  const ephPubkey = data.slice(34 + sigSize, 34 + sigSize + ephKeySize);
  const record = data.slice(34 + sigSize + ephKeySize);
  return {
    srcId,
    sigSize,
    ephKeySize,
    idSignature,
    ephPubkey,
    record,
  };
}

/**
 * Encode Challenge Data given masking IV and header
 * Challenge data doubles as message authenticated data
 */
export function encodeChallengeData(maskingIv: Uint8Array, header: IHeader): Uint8Array {
  return concatBytes(
    maskingIv,
    Buffer.from(header.protocolId),
    numberToBuffer(header.version, VERSION_SIZE),
    numberToBuffer(header.flag, FLAG_SIZE),
    header.nonce,
    numberToBuffer(header.authdataSize, AUTHDATA_SIZE_SIZE),
    header.authdata
  );
}
