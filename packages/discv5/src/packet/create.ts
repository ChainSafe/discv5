import type {NodeId, SequenceNumber} from "@chainsafe/enr";
import {randomBytes} from "@noble/hashes/utils.js";
import {ID_NONCE_SIZE, MASKING_IV_SIZE, NONCE_SIZE} from "./constants.js";
import {encodeMessageAuthdata, encodeWhoAreYouAuthdata} from "./encode.js";
import {type IHeader, type IPacket, PacketType} from "./types.js";

export function createHeader(flag: PacketType, authdata: Uint8Array, nonce = randomBytes(NONCE_SIZE)): IHeader {
  return {
    authdata,
    authdataSize: authdata.length,
    flag,
    nonce: nonce,
    protocolId: "discv5",
    version: 1,
  };
}

export function createRandomPacket(srcId: NodeId): IPacket {
  const authdata = encodeMessageAuthdata({srcId});
  const header = createHeader(PacketType.Message, authdata);
  const maskingIv = randomBytes(MASKING_IV_SIZE);
  const message = randomBytes(44);
  return {
    header,
    maskingIv,
    message,
  };
}

export function createWhoAreYouPacket(nonce: Uint8Array, enrSeq: SequenceNumber): IPacket {
  const idNonce = randomBytes(ID_NONCE_SIZE);
  const authdata = encodeWhoAreYouAuthdata({enrSeq, idNonce});
  const header = createHeader(PacketType.WhoAreYou, authdata, nonce);
  const maskingIv = randomBytes(MASKING_IV_SIZE);
  const message = Buffer.alloc(0);
  return {
    header,
    maskingIv,
    message,
  };
}
