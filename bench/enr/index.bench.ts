import {itBench, setBenchOpts} from "@dapplion/benchmark";
import {generateKeypair} from "../../src/keypair";
import {SignableENR} from "../../src/enr";

describe("ENR", function() {
  setBenchOpts({runs: 50000});

  const keypairWithPrivateKey = generateKeypair("secp256k1");
  const enr = SignableENR.createV4(keypairWithPrivateKey);
  enr.ip = "127.0.0.1";
  enr.tcp = 8080;

  itBench("ENR - getLocationMultiaddr - udp", () => {
    return enr.getLocationMultiaddr("udp");
  });
  itBench("ENR - getLocationMultiaddr - tcp", () => {
    return enr.getLocationMultiaddr("tcp");
  });
});
