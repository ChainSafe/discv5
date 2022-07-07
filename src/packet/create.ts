import { randomBytes } from "@noble/hashes/utils";
import { NodeId, SequenceNumber } from "../enr/index.js";
import { ID_NONCE_SIZE, MASKING_IV_SIZE, NONCE_SIZE } from "./constants.js";
import { encodeMessageAuthdata, encodeWhoAreYouAuthdata } from "./encode.js";
import { IHeader, IPacket, PacketType } from "./types.js";

export function createHeader(
  flag: PacketType,
  authdata: Buffer,
  nonce = Buffer.from(randomBytes(NONCE_SIZE))
): IHeader {
  return {
    protocolId: "discv5",
    version: 1,
    flag,
    nonce,
    authdataSize: authdata.length,
    authdata,
  };
}

export function createRandomPacket(srcId: NodeId): IPacket {
  const authdata = encodeMessageAuthdata({ srcId });
  const header = createHeader(PacketType.Message, authdata);
  const maskingIv = Buffer.from(randomBytes(MASKING_IV_SIZE).buffer);
  const message = Buffer.from(randomBytes(44).buffer);
  return {
    maskingIv,
    header,
    message,
  };
}

export function createWhoAreYouPacket(nonce: Buffer, enrSeq: SequenceNumber): IPacket {
  const idNonce = Buffer.from(randomBytes(ID_NONCE_SIZE).buffer);
  const authdata = encodeWhoAreYouAuthdata({ idNonce, enrSeq });
  const header = createHeader(PacketType.WhoAreYou, authdata, nonce);
  const maskingIv = Buffer.from(randomBytes(MASKING_IV_SIZE).buffer);
  const message = Buffer.alloc(0);
  return {
    maskingIv,
    header,
    message,
  };
}
