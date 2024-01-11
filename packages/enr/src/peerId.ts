import { KeyType, PeerId } from "@libp2p/interface";
import { peerIdFromKeys } from "@libp2p/peer-id";
import { keysPBM, supportedKeys } from "@libp2p/crypto/keys";

export const ERR_TYPE_NOT_IMPLEMENTED = "Keypair type not implemented";

/** Translate to KeyType from keysPBM enum */
enum KeyTypeTranslator {
  RSA = "RSA",
  Ed25519 = "Ed25519",
  Secp256k1 = "secp256k1",
}

export async function createPeerIdFromPublicKey(type: KeyType, publicKey: Uint8Array): Promise<PeerId> {
  switch (type) {
    case "secp256k1": {
      const pubKey = new supportedKeys.secp256k1.Secp256k1PublicKey(publicKey);
      return peerIdFromKeys(pubKey.bytes);
    }
    default:
      throw new Error(ERR_TYPE_NOT_IMPLEMENTED);
  }
}

export async function createPeerIdFromPrivateKey(type: KeyType, privateKey: Uint8Array): Promise<PeerId> {
  switch (type) {
    case "secp256k1": {
      const privKey = new supportedKeys.secp256k1.Secp256k1PrivateKey(privateKey);
      return peerIdFromKeys(privKey.public.bytes, privKey.bytes);
    }
    default:
      throw new Error(ERR_TYPE_NOT_IMPLEMENTED);
  }
}

export function createPublicKeyFromPeerId(peerId: PeerId): { type: KeyType; publicKey: Uint8Array } {
  // pub/privkey bytes from peer-id are encoded in protobuf format
  if (!peerId.publicKey) {
    throw new Error("Public key required");
  }
  const pub = keysPBM.PublicKey.decode(peerId.publicKey);
  return { type: KeyTypeTranslator[pub.Type!], publicKey: pub.Data! };
}

export function createPrivateKeyFromPeerId(peerId: PeerId): { type: KeyType; privateKey: Uint8Array } {
  // pub/privkey bytes from peer-id are encoded in protobuf format
  if (!peerId.privateKey) {
    throw new Error("Private key required");
  }
  const priv = keysPBM.PrivateKey.decode(peerId.privateKey);
  return { type: KeyTypeTranslator[priv.Type!], privateKey: priv.Data! };
}
