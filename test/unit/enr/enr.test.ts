/* eslint-env mocha */
import { expect } from "chai";
import { multiaddr } from "@multiformats/multiaddr";
import { createSecp256k1PeerId } from "@libp2p/peer-id-factory";
import { BaseENR, ENR, SignableENR, v4 } from "../../../src/enr/index.js";
import { createKeypair, KeypairType, toHex } from "../../../src/index.js";

describe("ENR spec test vector", () => {
  // spec enr https://eips.ethereum.org/EIPS/eip-778
  const privateKey = Buffer.from("b71c71a67e1177ad4e901695e1b4b9ee17ae16c6668d313eac2f96dbcda3f291", "hex");
  const publicKey = v4.publicKey(privateKey);
  const keypair = createKeypair(KeypairType.Secp256k1, privateKey, publicKey);
  const text =
    "enr:-IS4QHCYrYZbAKWCBRlAy5zzaDZXJBGkcnh4MHcBFZntXNFrdvJjX04jRzjzCBOonrkTfj499SZuOh8R33Ls8RRcy5wBgmlkgnY0gmlwhH8AAAGJc2VjcDI1NmsxoQPKY0yuDUmstAHYpMa2_oxVtw0RW_QAdpzBQA8yWM0xOIN1ZHCCdl8";
  const seq = BigInt(1);
  const signature = Buffer.from(
    "7098ad865b00a582051940cb9cf36836572411a47278783077011599ed5cd16b76f2635f4e234738f30813a89eb9137e3e3df5266e3a1f11df72ecf1145ccb9c",
    "hex"
  );
  const kvs = new Map(
    Object.entries({
      id: Buffer.from("v4"),
      secp256k1: publicKey,
      ip: Buffer.from("7f000001", "hex"),
      udp: Buffer.from((30303).toString(16), "hex"),
    })
  );
  const nodeId = "a448f24c6d18e575453db13171562b71999873db5b286df957af199ec94617f7";

  it("should properly round trip decode and encode", () => {
    expect(ENR.decodeTxt(text).encodeTxt()).to.equal(text);
    expect(SignableENR.decodeTxt(text, keypair).encodeTxt()).to.equal(text);
  });

  it("should properly create and encode", () => {
    expect(new SignableENR(kvs, seq, keypair).encodeTxt()).to.equal(text);
  });

  it("should properly compute the node id", () => {
    expect(ENR.decodeTxt(text).nodeId).to.equal(nodeId);
    expect(SignableENR.decodeTxt(text, keypair).nodeId).to.equal(nodeId);
  });

  it("should properly decode values", () => {
    function expectENRValuesMatch(enr: BaseENR): void {
      expect(enr.udp).to.equal(30303);
      expect(enr.ip).to.equal("127.0.0.1");
      expect(enr.seq).to.equal(seq);
      expect(enr.signature).to.deep.equal(signature);
      expect(enr.kvs.get("secp256k1")).to.deep.equal(publicKey);
      expect(enr.publicKey).to.deep.equal(publicKey);
    }
    const enr = ENR.decodeTxt(text);
    const signableEnr = SignableENR.decodeTxt(text, keypair);
    expectENRValuesMatch(enr);
    expectENRValuesMatch(signableEnr);
  });
});

describe("ENR multiaddr support", () => {
  const privateKey = Buffer.from("b71c71a67e1177ad4e901695e1b4b9ee17ae16c6668d313eac2f96dbcda3f291", "hex");
  const publicKey = v4.publicKey(privateKey);
  const keypair = createKeypair(KeypairType.Secp256k1, privateKey, publicKey);
  let record: SignableENR;

  beforeEach(() => {
    record = SignableENR.createV4(keypair);
  });

  it("should get / set UDP multiaddr", () => {
    const multi0 = multiaddr("/ip4/127.0.0.1/udp/30303");
    const tuples0 = multi0.tuples();

    if (!tuples0[0][1] || !tuples0[1][1]) {
      throw new Error("invalid multiaddr");
    }
    // set underlying records
    record.set("ip", tuples0[0][1]);
    record.set("udp", tuples0[1][1]);
    // and get the multiaddr
    expect(record.getLocationMultiaddr("udp")!.toString()).to.equal(multi0.toString());
    // set the multiaddr
    const multi1 = multiaddr("/ip4/0.0.0.0/udp/30300");
    record.setLocationMultiaddr(multi1);
    // and get the multiaddr
    expect(record.getLocationMultiaddr("udp")!.toString()).to.equal(multi1.toString());
    // and get the underlying records
    const tuples1 = multi1.tuples();
    expect(record.kvs.get("ip")).to.deep.equal(tuples1[0][1]);
    expect(record.kvs.get("udp")).to.deep.equal(tuples1[1][1]);
  });
  it("should get / set TCP multiaddr", () => {
    const multi0 = multiaddr("/ip4/127.0.0.1/tcp/30303");
    const tuples0 = multi0.tuples();

    if (!tuples0[0][1] || !tuples0[1][1]) {
      throw new Error("invalid multiaddr");
    }

    // set underlying records
    record.set("ip", tuples0[0][1]);
    record.set("tcp", tuples0[1][1]);
    // and get the multiaddr
    expect(record.getLocationMultiaddr("tcp")!.toString()).to.equal(multi0.toString());
    // set the multiaddr
    const multi1 = multiaddr("/ip4/0.0.0.0/tcp/30300");
    record.setLocationMultiaddr(multi1);
    // and get the multiaddr
    expect(record.getLocationMultiaddr("tcp")!.toString()).to.equal(multi1.toString());
    // and get the underlying records
    const tuples1 = multi1.tuples();
    expect(record.kvs.get("ip")).to.deep.equal(tuples1[0][1]);
    expect(record.kvs.get("tcp")).to.deep.equal(tuples1[1][1]);
  });

  describe("location multiaddr", async () => {
    const ip4 = "127.0.0.1";
    const ip6 = "::1";
    const tcp = 8080;
    const udp = 8080;

    const peerId = await createSecp256k1PeerId();
    const enr = SignableENR.createFromPeerId(peerId);
    enr.ip = ip4;
    enr.ip6 = ip6;
    enr.tcp = tcp;
    enr.udp = udp;
    enr.tcp6 = tcp;
    enr.udp6 = udp;

    it("should properly create location multiaddrs - udp4", () => {
      expect(enr.getLocationMultiaddr("udp4")).to.deep.equal(multiaddr(`/ip4/${ip4}/udp/${udp}`));
    });

    it("should properly create location multiaddrs - tcp4", () => {
      expect(enr.getLocationMultiaddr("tcp4")).to.deep.equal(multiaddr(`/ip4/${ip4}/tcp/${tcp}`));
    });

    it("should properly create location multiaddrs - udp6", () => {
      expect(enr.getLocationMultiaddr("udp6")).to.deep.equal(multiaddr(`/ip6/${ip6}/udp/${udp}`));
    });

    it("should properly create location multiaddrs - tcp6", () => {
      expect(enr.getLocationMultiaddr("tcp6")).to.deep.equal(multiaddr(`/ip6/${ip6}/tcp/${tcp}`));
    });

    it("should properly create location multiaddrs - udp", () => {
      // default to ip4
      expect(enr.getLocationMultiaddr("udp")).to.deep.equal(multiaddr(`/ip4/${ip4}/udp/${udp}`));
      // if ip6 is set, use it
      enr.ip = undefined;
      expect(enr.getLocationMultiaddr("udp")).to.deep.equal(multiaddr(`/ip6/${ip6}/udp/${udp}`));
      // if ip6 does not exist, use ip4
      enr.ip6 = undefined;
      enr.ip = ip4;
      expect(enr.getLocationMultiaddr("udp")).to.deep.equal(multiaddr(`/ip4/${ip4}/udp/${udp}`));
      enr.ip6 = ip6;
    });

    it("should properly create location multiaddrs - tcp", () => {
      // default to ip4
      expect(enr.getLocationMultiaddr("tcp")).to.deep.equal(multiaddr(`/ip4/${ip4}/tcp/${tcp}`));
      // if ip6 is set, use it
      enr.ip = undefined;
      expect(enr.getLocationMultiaddr("tcp")).to.deep.equal(multiaddr(`/ip6/${ip6}/tcp/${tcp}`));
      // if ip6 does not exist, use ip4
      enr.ip6 = undefined;
      enr.ip = ip4;
      expect(enr.getLocationMultiaddr("tcp")).to.deep.equal(multiaddr(`/ip4/${ip4}/tcp/${tcp}`));
      enr.ip6 = ip6;
    });
  });
});

describe("ENR", function () {
  describe("decodeTxt", () => {
    it("should encodeTxt and decodeTxt", async () => {
      const peerId = await createSecp256k1PeerId();
      const enr = SignableENR.createFromPeerId(peerId);
      enr.setLocationMultiaddr(multiaddr("/ip4/18.223.219.100/udp/9000"));
      const txt = enr.encodeTxt();
      expect(txt.slice(0, 4)).to.be.equal("enr:");
      const enr2 = ENR.decodeTxt(txt);
      expect(toHex(enr2.signature as Buffer)).to.be.equal(toHex(enr.signature as Buffer));
      const mu = enr2.getLocationMultiaddr("udp")!;
      expect(mu.toString()).to.be.equal("/ip4/18.223.219.100/udp/9000");
    });

    it("should decode valid enr successfully", () => {
      const txt =
        "enr:-Ku4QMh15cIjmnq-co5S3tYaNXxDzKTgj0ufusA-QfZ66EWHNsULt2kb0eTHoo1Dkjvvf6CAHDS1Di-htjiPFZzaIPcLh2F0dG5ldHOIAAAAAAAAAACEZXRoMpD2d10HAAABE________x8AgmlkgnY0gmlwhHZFkMSJc2VjcDI1NmsxoQIWSDEWdHwdEA3Lw2B_byeFQOINTZ0GdtF9DBjes6JqtIN1ZHCCIyg";
      const enr = ENR.decodeTxt(txt);
      const eth2 = enr.kvs.get("eth2") as Buffer;
      expect(eth2).to.not.be.undefined;
      expect(toHex(eth2)).to.be.equal("f6775d0700000113ffffffffffff1f00");
    });

    it("should encodeTxt and decodeTxt ipv6 enr successfully", async () => {
      const peerId = await createSecp256k1PeerId();
      const enr = SignableENR.createFromPeerId(peerId);
      enr.setLocationMultiaddr(multiaddr("/ip6/aaaa:aaaa:aaaa:aaaa:aaaa:aaaa:aaaa:aaaa/udp/9000"));
      const enr2 = ENR.decodeTxt(enr.encodeTxt());
      expect(enr2.udp6).to.equal(9000);
      expect(enr2.ip6).to.equal("aaaa:aaaa:aaaa:aaaa:aaaa:aaaa:aaaa:aaaa");
    });

    it("should throw decoding error - no id", () => {
      try {
        const txt = Buffer.from(
          "656e723a2d435972595a62404b574342526c4179357a7a61445a584a42476b636e68344d486342465a6e75584e467264764a6a5830346a527a6a7a",
          "hex"
        ).toString();
        ENR.decodeTxt(txt);
        expect.fail("Expect error here");
      } catch (err: any) {
        expect(err.message).to.be.equal("id not found");
      }
    });

    it("should throw decoding error - no public key", () => {
      try {
        const txt =
          "enr:-IS4QJ2d11eu6dC7E7LoXeLMgMP3kom1u3SE8esFSWvaHoo0dP1jg8O3-nx9ht-EO3CmG7L6OkHcMmoIh00IYWB92QABgmlkgnY0gmlwhH8AAAGJc2d11eu6dCsxoQIB_c-jQMOXsbjWkbN-kj99H57gfId5pfb4wa1qxwV4CIN1ZHCCIyk";
        ENR.decodeTxt(txt);
        expect.fail("Expect error here");
      } catch (err: any) {
        expect(err.message).to.be.equal("Pubkey doesn't exist");
      }
    });
  });
});

describe("ENR fuzzing testcases", () => {
  it("should throw error in invalid signature", () => {
    const buf = Buffer.from(
      "656e723a2d4b7634514147774f54385374716d7749354c486149796d494f346f6f464b664e6b456a576130663150384f73456c67426832496a622d4772445f2d623957346b6350466377796e354845516d526371584e716470566f3168656f42683246306447356c64484f494141414141414141414143455a58526f4d704141414141414141414141505f5f5f5f5f5f5f5f5f5f676d6c6b676e5930676d6c7768424c663232534a6332566a634449314e6d73786f514a78436e4536765f7832656b67595f756f45317274777a76477934306d7139654436365866485042576749494e315a48437f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f434436410d0a",
      "hex"
    ).toString();
    try {
      ENR.decodeTxt(buf);
    } catch (e: any) {
      expect(e.message).to.equal("Decoded ENR invalid signature: must be a byte array");
    }
  });
  it("should throw error in invalid sequence number", () => {
    const buf = Buffer.from(
      "656e723a2d495334514b6b33ff583945717841337838334162436979416e537550444d764b353264433530486d31584744643574457951684d3356634a4c2d5062446b44673541507a5f706f76763022d48dcf992d5379716b306e616e636f4e572d656e7263713042676d6c6b676e5930676d6c77684838414141474a6332566a634449314e6d73786f514d31453579557370397638516a397476335a575843766146427672504e647a384b5049314e68576651577a494e315a4843434239410a",
      "hex"
    ).toString();
    try {
      ENR.decodeTxt(buf);
    } catch (e: any) {
      expect(e.message).to.equal("Decoded ENR invalid sequence number: must be a byte array");
    }
  });
});
