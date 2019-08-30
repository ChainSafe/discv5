/*
 * Session Key generation for Discv5
 *
 */

import {
    AuthHeader,
    IAuthMessagePacket,
    IAuthResponsePacket,
    PacketType,
} from "../packets";

import { encodeAuthHeader } from "../encode";

import { decodeAuthHeader, decodeAuthResponsePacket } from "../decode";

import * as constants from "../constants";

import { EthereumNodeRecord } from "../enr/enr";

import { ENRKeyPair } from "../enr/enr_keypair";

import { NodeId } from "../enr/enr_types";

import * as cryptoTypes from "../crypto/misc_crypto_types";

import { Secp256k1PublicKey } from "libp2p-crypto-secp256k1";

import crypto from "@chainsafe/libp2p-crypto";

export interface ISessionKeys {
  initiatorKey: Buffer;
  responderKey: Buffer;
  authResponseKey: Buffer;
  ephemKey?: Buffer;
}

export async function generateSessionKeys(
    remoteEnr: EthereumNodeRecord,
    localId: NodeId,
    idNonce: cryptoTypes.Nonce,
): Promise<ISessionKeys> {
  const pubKey: Buffer = remoteEnr.compressedPubKey;
  const ephemKeyObj = await crypto.keys.generateEphemeralKeyPair("SECP256K1");
  const ephemKey: Buffer = ephemKeyObj.key;
  const sharedSecret: Buffer = ephemKeyObj.genSharedKey(pubKey, ephemKey);
  const res: SessionKeys = await deriveKeys(sharedSecret, localId, remoteEnr.nodeId, idNonce);
  const initiatorKey = res.initiatorKey;
  const responderKey = res.responderKey;
  const authRespKey  = res.authResponseKey;

  return { initiatorKey, responderKey, authResponseKey: authRespKey, ephemKey };
}

export async function deriveKeys(
    secret: Buffer,
    id1: NodeId,
    id2: NodeId,
    idNonce: cryptoTypes.Nonce,
): Promise<ISessionKeys> {
  const info = Buffer.concat([Buffer.from(constants.KEY_AGREEMENT_STR), id1, id2]);
  const hk: Buffer = crypto.hkdf.extract("SHA-256", 32, secret, idNonce);
  const okm: Buffer = crypto.hkdf.expand("SHA-256", 32, hk, 3 * constants.KEY_LENGTH, info);
  const initiatorKey: Buffer = okm.slice(0, constants.KEY_LENGTH);
  const responderKey: Buffer = okm.slice(constants.KEY_LENGTH, 2 * constants.KEY_LENGTH);
  const authRespKey: Buffer = okm.slice(2 * constants.KEY_LENGTH, 3 * constants.KEY_LENGTH);

  return { initiatorKey, responderKey, authRespKey };
}

export async function deriveKeysFromPubkey(
    localKeyPair: ENRKeyPair,
    localId: NodeId,
    remoteId: NodeId,
    idNonce: cryptoTypes.Nonce,
    ephemPubKey: Buffer,
): Promise<any> {
  let secret: Buffer;
  const remotePubKey: Buffer = Buffer.alloc(16);
  ephemPubKey.copy(remotePubKey, 0, ephemPubKey.length);

  secret = await crypto.keys
    .generateEphemeralKeyPair("SECP256K1")
    .genSharedKey(remotePubKey, localKeyPair.privateKeyBuf);

  return deriveKeys(secret, remoteId, localId, idNonce);
}

export async function decryptAuthHeader(
    authRespKey: Buffer,
    header: AuthHeader,
    tag: Buffer,
): Promise<IAuthResponsePacket> {
  if (header.auth_scheme_name !== constants.KNOWN_SCHEME) {
    throw new Error("Invalid authentication scheme");
  }

  const rlpEncodedAuthResp: Buffer = await encryptMsg(authRespKey, Buffer.alloc(16), header.auth_response);
  const authResponse = decodeAuthResponsePacket(rlpEncodedAuthResp);
  return authResponse;
}

export async function verifyAuthNonce(
    remotePubKey: Secp256k1PublicKey,
    generatedNonce: Buffer,
    sig: Buffer,
): Promise<boolean> {
  return await remotePubKey.verify(generatedNonce, sig);
}

export async function decryptMessage(
    key: Buffer,
    nonce: Buffer,
    msg: Buffer,
): Promise<Buffer> {
  const aesCipherObj = await crypto.aes.create(key, nonce);
  return await aesCipherObj.decrypt(msg);
}

export async function encryptWithHeader(
    authRespKey: Buffer,
    encryptionKey: Buffer,
    authPart: Buffer,
    msg: Buffer,
    ephemPubKey: Buffer,
    tag: Buffer,
): Promise<any> {
  let ciphertext: Buffer = await encryptMsg(authRespKey, Buffer.alloc(12), authPart);

  const authTag: cryptoTypes.Nonce = crypto.randomBytes(12);
  const authHeader: AuthHeader = {
    auth_response: ciphertext,
    auth_scheme_name: "gcm",
    auth_tag: authTag,
    ephemeral_pubkey: ephemPubKey,
  };

  ciphertext = await encryptMsg(encryptionKey, authTag, msg);
  return { authHeader, ciphertext };
}

export async function encryptMsg(
    key: Buffer,
    nonce: cryptoTypes.Nonce,
    msg: Buffer,
): Promise<Buffer> {
  const aesCipherObj = await crypto.aes.create(key, nonce);
  return await aesCipherObj.encrypt(msg);
}
