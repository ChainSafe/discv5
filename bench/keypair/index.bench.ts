import {itBench, setBenchOpts} from "@dapplion/benchmark";
import {createPeerIdFromKeypair, generateKeypair} from "../../src/keypair";

describe("createPeerIdFromKeypair", function() {
  setBenchOpts({runs: 4000});

  const keypairWithPrivateKey = generateKeypair("secp256k1");
  const keypairWithoutPrivateKey = generateKeypair("secp256k1");
  delete (keypairWithoutPrivateKey as any)._privateKey;

  itBench("createPeerIdFromKeypair - private key", () => {
    return createPeerIdFromKeypair(keypairWithPrivateKey);
  });
  itBench("createPeerIdFromKeypair - no private key", () => {
    return createPeerIdFromKeypair(keypairWithoutPrivateKey);
  });
});