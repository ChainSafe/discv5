/* eslint-env mocha */
import { expect } from "chai";
import { multiaddr } from "@multiformats/multiaddr";

import { Discv5 } from "../../../src/service/service.js";
import { SignableENR } from "../../../src/enr/index.js";
import { generateKeypair, KeypairType, createPeerIdFromKeypair } from "../../../src/keypair/index.js";

describe("Discv5", async () => {
  const kp0 = generateKeypair(KeypairType.Secp256k1);
  const peerId0 = await createPeerIdFromKeypair(kp0);
  const enr0 = SignableENR.createV4(kp0);
  const mu0 = multiaddr("/ip4/127.0.0.1/udp/40000");

  const service0 = Discv5.create({ enr: enr0, peerId: peerId0, bindAddrs: { ip4: mu0 } });

  beforeEach(async () => {
    await service0.start();
  });

  afterEach(async () => {
    await service0.stop();
  });

  it("should start and stop", async () => {
    // failure would happen in the beforeEach or afterEach
  });

  it("should allow to pick a port and network interface as a multiaddr", async () => {
    expect(service0.bindAddrs[0].toString()).eq(mu0.toString());
  });

  it("should add new enrs", async () => {
    const kp1 = generateKeypair(KeypairType.Secp256k1);
    const enr1 = SignableENR.createV4(kp1);
    enr1.encode();
    service0.addEnr(enr1.toENR());
    expect(service0.kadValues().length).eq(1);
  });

  it("should complete a lookup to another node", async function () {
    this.timeout(10000);
    const kp1 = generateKeypair(KeypairType.Secp256k1);
    const peerId1 = await createPeerIdFromKeypair(kp1);
    const enr1 = SignableENR.createV4(kp1);
    const mu1 = multiaddr("/ip4/127.0.0.1/udp/10360");
    const addr1 = mu1.tuples();

    if (!addr1[0][1] || !addr1[1][1]) {
      throw new Error("invalid multiaddr");
    }

    enr1.set("ip", addr1[0][1]);
    enr1.set("udp", addr1[1][1]);
    enr1.encode();
    const service1 = Discv5.create({ enr: enr1, peerId: peerId1, bindAddrs: { ip4: mu1 } });
    await service1.start();
    for (let i = 0; i < 100; i++) {
      const kp = generateKeypair(KeypairType.Secp256k1);
      const enr = SignableENR.createV4(kp);
      enr.encode();
      service1.addEnr(enr.toENR());
    }
    service0.addEnr(enr1.toENR());
    await service0.findNode(Buffer.alloc(32).toString("hex"));
    await service1.stop();
  });
});
