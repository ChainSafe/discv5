/* eslint-env mocha */
import { expect } from "chai";
import { multiaddr } from "@multiformats/multiaddr";

import { chunkify, Discv5 } from "../../../src/service/service.js";
import { ENR } from "../../../src/enr/index.js";
import { generateKeypair, KeypairType, createPeerIdFromKeypair } from "../../../src/keypair/index.js";

describe("Discv5", async () => {
  const kp0 = generateKeypair(KeypairType.Secp256k1);
  const peerId0 = await createPeerIdFromKeypair(kp0);
  const enr0 = ENR.createV4(kp0.publicKey);
  const mu0 = multiaddr("/ip4/127.0.0.1/udp/40000");

  const service0 = Discv5.create({ enr: enr0, peerId: peerId0, multiaddr: mu0 });

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
    expect(service0.bindAddress.toString()).eq(mu0.toString());
  });

  it("should add new enrs", async () => {
    const kp1 = generateKeypair(KeypairType.Secp256k1);
    const enr1 = ENR.createV4(kp1.publicKey);
    enr1.encode(kp1.privateKey);
    service0.addEnr(enr1);
    expect(service0.kadValues().length).eq(1);
  });

  it("should complete a lookup to another node", async function () {
    this.timeout(10000);
    const kp1 = generateKeypair(KeypairType.Secp256k1);
    const peerId1 = await createPeerIdFromKeypair(kp1);
    const enr1 = ENR.createV4(kp1.publicKey);
    const mu1 = multiaddr("/ip4/127.0.0.1/udp/10360");
    const addr1 = mu1.tuples();

    if (!addr1[0][1] || !addr1[1][1]) {
      throw new Error("invalid multiaddr");
    }

    enr1.set("ip", addr1[0][1]);
    enr1.set("udp", addr1[1][1]);
    enr1.encode(kp1.privateKey);
    const service1 = Discv5.create({ enr: enr1, peerId: peerId1, multiaddr: mu1 });
    await service1.start();
    for (let i = 0; i < 100; i++) {
      const kp = generateKeypair(KeypairType.Secp256k1);
      const enr = ENR.createV4(kp.publicKey);
      enr.encode(kp.privateKey);
      service1.addEnr(enr);
    }
    service0.addEnr(enr1);
    await service0.findNode(Buffer.alloc(32).toString("hex"));
    await service1.stop();
  });
});

describe("chunkify", function () {
  const itemsPerChunk = 3;
  const testCases: { arrLength: number; expected: number[][] }[] = [
    { arrLength: 0, expected: [[]] },
    { arrLength: 1, expected: [[0]] },
    { arrLength: 2, expected: [[0, 1]] },
    { arrLength: 3, expected: [[0, 1, 2]] },
    { arrLength: 4, expected: [[0, 1, 2], [3]] },
    {
      arrLength: 5,
      expected: [
        [0, 1, 2],
        [3, 4],
      ],
    },
    {
      arrLength: 6,
      expected: [
        [0, 1, 2],
        [3, 4, 5],
      ],
    },
    {
      arrLength: 7,
      expected: [[0, 1, 2], [3, 4, 5], [6]],
    },
    {
      arrLength: 8,
      expected: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7],
      ],
    },
    {
      arrLength: 9,
      expected: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
      ],
    },
    {
      arrLength: 10,
      expected: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]],
    },
    {
      arrLength: 11,
      expected: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [9, 10],
      ],
    },
    {
      arrLength: 12,
      expected: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [9, 10, 11],
      ],
    },
    {
      arrLength: 13,
      expected: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12]],
    },
    {
      arrLength: 14,
      expected: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [9, 10, 11],
        [12, 13],
      ],
    },
    {
      arrLength: 15,
      expected: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [9, 10, 11],
        [12, 13, 14],
      ],
    },
    {
      arrLength: 16,
      expected: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15]],
    },
  ];
  for (const { arrLength, expected } of testCases) {
    it(`array ${arrLength} length`, () => {
      expect(
        chunkify(
          Array.from({ length: arrLength }, (_, i) => i),
          itemsPerChunk
        )
      ).to.be.deep.equal(expected);
    });
  }
});
