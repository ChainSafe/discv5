import {SignableENR} from "@chainsafe/enr";
import {generateKeyPair} from "@libp2p/crypto/keys";
import {multiaddr} from "@multiformats/multiaddr";
import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {Discv5} from "../../../src/service/service.js";

describe("Discv5", async () => {
  const kp0 = await generateKeyPair("secp256k1");
  const enr0 = SignableENR.createV4(kp0.raw);
  const mu0 = multiaddr("/ip4/127.0.0.1/udp/40000");

  const service0 = Discv5.create({bindAddrs: {ip4: mu0}, enr: enr0, privateKey: kp0});

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
    const kp1 = await generateKeyPair("secp256k1");
    const enr1 = SignableENR.createV4(kp1.raw);
    enr1.encode();
    service0.addEnr(enr1.toENR());
    expect(service0.kadValues().length).eq(1);
  });

  it("should complete a lookup to another node", async () => {
    const kp1 = await generateKeyPair("secp256k1");
    const enr1 = SignableENR.createV4(kp1.raw);
    const mu1 = multiaddr("/ip4/127.0.0.1/udp/10360");
    const components1 = mu1.getComponents();

    if (!components1[0].value || !components1[1].value) {
      throw new Error("invalid multiaddr");
    }

    enr1.ip = components1[0].value;
    enr1.udp = Number(components1[1].value);
    enr1.encode();
    const service1 = Discv5.create({bindAddrs: {ip4: mu1}, enr: enr1, privateKey: kp1});
    await service1.start();
    for (let i = 0; i < 100; i++) {
      const kp = await generateKeyPair("secp256k1");
      const enr = SignableENR.createV4(kp.raw);
      enr.encode();
      service1.addEnr(enr.toENR());
    }
    service0.addEnr(enr1.toENR());
    await service0.findNode(Buffer.alloc(32).toString("hex"));
    await service1.stop();
  });
}, 10_000);
