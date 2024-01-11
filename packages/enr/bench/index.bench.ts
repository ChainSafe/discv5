import { itBench } from "@dapplion/benchmark";
import { createSecp256k1PeerId } from "@libp2p/peer-id-factory";
import {
  ENR,
  SignableENR,
  createPeerIdFromPrivateKey,
  createPeerIdFromPublicKey,
  createPrivateKeyFromPeerId,
  createPublicKeyFromPeerId,
} from "../src/index.js";

describe("ENR", async function () {
  const peerId = await createSecp256k1PeerId();
  const { privateKey } = createPrivateKeyFromPeerId(peerId);
  const enr = SignableENR.createV4(privateKey);
  enr.ip = "127.0.0.1";
  enr.tcp = 8080;

  itBench("ENR - getLocationMultiaddr - udp", () => {
    return enr.getLocationMultiaddr("udp");
  });
  itBench("ENR - getLocationMultiaddr - tcp", () => {
    return enr.getLocationMultiaddr("tcp");
  });
});

describe("createPeerIdFromPrivateKey", async function () {
  const peerId = await createSecp256k1PeerId();
  const { type, privateKey } = createPrivateKeyFromPeerId(peerId);
  const { publicKey } = createPublicKeyFromPeerId(peerId);

  itBench("createPeerIdFromPrivateKey", () => {
    return createPeerIdFromPrivateKey(type, privateKey);
  });
  itBench("createPeerIdFromPublicKey", () => {
    return createPeerIdFromPublicKey(type, publicKey);
  });
});

describe("ENR - encode/decode", async function () {
  const peerId = await createSecp256k1PeerId();
  const { privateKey } = createPrivateKeyFromPeerId(peerId);
  const enr = SignableENR.createV4(privateKey);
  enr.ip = "127.0.0.1";
  enr.tcp = 8080;
  enr.udp = 8080;

  const encoded = enr.encode();

  itBench("ENR - encode", () => {
    return enr.encode();
  });
  itBench("ENR - decode", () => {
    return ENR.decode(encoded);
  });
});
