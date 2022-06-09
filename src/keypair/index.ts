import { PeerId } from "@libp2p/interfaces/peer-id";
import { peerIdFromKeys } from "@libp2p/peer-id";
import { keysPBM, supportedKeys } from "@libp2p/crypto/keys";

import { IKeypair, KeypairType } from "./types.js";
import { ERR_TYPE_NOT_IMPLEMENTED } from "./constants.js";
import { Secp256k1Keypair } from "./secp256k1.js";
import { toBuffer } from "../util/index.js";

export * from "./types.js";
export * from "./secp256k1.js";

export function generateKeypair(type: KeypairType): IKeypair {
  switch (type) {
    case KeypairType.Secp256k1:
      return Secp256k1Keypair.generate();
    default:
      throw new Error(ERR_TYPE_NOT_IMPLEMENTED);
  }
}

export function createKeypair(type: KeypairType, privateKey?: Buffer, publicKey?: Buffer): IKeypair {
  switch (type) {
    case KeypairType.Secp256k1:
      return new Secp256k1Keypair(privateKey, publicKey);
    default:
      throw new Error(ERR_TYPE_NOT_IMPLEMENTED);
  }
}

export async function createPeerIdFromKeypair(keypair: IKeypair): Promise<PeerId> {
  switch (keypair.type) {
    case KeypairType.Secp256k1: {
      if (keypair.hasPrivateKey()) {
        const privKey = new supportedKeys.secp256k1.Secp256k1PrivateKey(keypair.privateKey, keypair.publicKey);
        const pubKey = privKey.public;
        return peerIdFromKeys(pubKey.bytes, privKey.bytes);
      } else {
        const pubKey = new supportedKeys.secp256k1.Secp256k1PublicKey(keypair.publicKey);
        return peerIdFromKeys(pubKey.bytes);
      }
    }
    default:
      throw new Error(ERR_TYPE_NOT_IMPLEMENTED);
  }
}

export function createKeypairFromPeerId(peerId: PeerId): IKeypair {
  // pub/privkey bytes from peer-id are encoded in protobuf format
  if (!peerId.publicKey) {
    throw new Error("Public key required");
  }
  const pub = keysPBM.PublicKey.decode(peerId.publicKey);
  if (peerId.privateKey) {
    const priv = keysPBM.PrivateKey.decode(peerId.privateKey);
    return createKeypair(KeypairType[pub.Type] as KeypairType, toBuffer(priv.Data), toBuffer(pub.Data));
  } else {
    return createKeypair(KeypairType[pub.Type] as KeypairType, undefined, toBuffer(pub.Data));
  }
}
