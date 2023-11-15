import {itBench, setBenchOpts} from "@dapplion/benchmark";
import {generateKeypair} from "../../src/keypair/index.js";
import { createPeerIdFromPrivateKey, createPeerIdFromPublicKey } from "../../src/enr/index.js";

describe("createPeerIdFromPrivateKey", function() {
  setBenchOpts({runs: 4000});

  const keypair = generateKeypair("secp256k1");

  itBench("createPeerIdFromPrivateKey", () => {
    return createPeerIdFromPrivateKey(keypair.type, keypair.privateKey);
  });
  itBench("createPeerIdFromPublicKey", () => {
    return createPeerIdFromPublicKey(keypair.type, keypair.publicKey);
  });
});