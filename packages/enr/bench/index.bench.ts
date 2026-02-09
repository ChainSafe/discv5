import { describe, itBench } from "@chainsafe/benchmark";
import { generateKeyPair } from "@libp2p/crypto/keys";
import {
  ENR,
  SignableENR,
} from "../src/index.js";

describe("ENR", async function () {
  const kp = await generateKeyPair("secp256k1");
  const enr = SignableENR.createV4(kp.raw);
  enr.ip = "127.0.0.1";
  enr.tcp = 8080;

  itBench("ENR - getLocationMultiaddr - udp", () => {
    return enr.getLocationMultiaddr("udp");
  });
  itBench("ENR - getLocationMultiaddr - tcp", () => {
    return enr.getLocationMultiaddr("tcp");
  });
});

describe("ENR - encode/decode", async function () {
  const kp = await generateKeyPair("secp256k1");
  const enr = SignableENR.createV4(kp.raw);
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
