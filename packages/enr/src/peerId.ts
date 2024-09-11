import { KeyType, PeerId } from "@libp2p/interface";
import { peerIdFromPublicKey } from "@libp2p/peer-id";
import { publicKeyFromRaw } from "@libp2p/crypto/keys";

export const ERR_TYPE_NOT_IMPLEMENTED = "Keypair type not implemented";

export function createPeerIdFromPublicKey(type: KeyType, publicKey: Uint8Array): PeerId {
  const pubKey = publicKeyFromRaw(publicKey);
  if (pubKey.type !== "secp256k1") {
    throw new Error(ERR_TYPE_NOT_IMPLEMENTED);
  }
  return peerIdFromPublicKey(pubKey);
}
