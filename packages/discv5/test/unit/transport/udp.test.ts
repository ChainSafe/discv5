/* eslint-env mocha */
import { expect } from "chai";
import { Multiaddr, multiaddr } from "@multiformats/multiaddr";

import { PacketType, IPacket, NONCE_SIZE, MASKING_IV_SIZE } from "../../../src/packet/index.js";
import { UDPTransportService } from "../../../src/transport/index.js";
import { bytesToHex } from "ethereum-cryptography/utils.js";

describe("UDP4 transport", () => {
  const address = "127.0.0.1";
  const nodeIdA = bytesToHex(new Uint8Array(32).fill(1));
  const portA = 49523;
  const multiaddrA = multiaddr(`/ip4/${address}/udp/${portA}`);
  const a = new UDPTransportService({ bindAddrs: { ip4: multiaddrA }, nodeId: nodeIdA });

  const nodeIdB = bytesToHex(new Uint8Array(32).fill(2));
  const portB = portA + 1;
  const multiaddrB = multiaddr(`/ip4/${address}/udp/${portB}`);
  const b = new UDPTransportService({ bindAddrs: { ip4: multiaddrB }, nodeId: nodeIdB });

  before(async () => {
    await a.start();
    await b.start();
  });

  after(async () => {
    await a.stop();
    await b.stop();
  });

  it("should send and receive messages", async () => {
    const messagePacket: IPacket = {
      maskingIv: new Uint8Array(MASKING_IV_SIZE),
      header: {
        protocolId: "discv5",
        version: 1,
        flag: PacketType.Message,
        nonce: new Uint8Array(NONCE_SIZE),
        authdataSize: 32,
        authdata: new Uint8Array(32).fill(2),
      },
      message: new Uint8Array(44).fill(1),
    };
    const received = new Promise<[Multiaddr, IPacket]>((resolve) =>
      a.once("packet", (sender, packet) => resolve([sender, packet]))
    );
    await b.send(multiaddrA, nodeIdA, messagePacket);
    const [rSender, rPacket] = await received;
    expect(rSender.toString()).to.deep.equal(multiaddrB.toString());
    expect(rPacket.maskingIv).to.deep.equal(messagePacket.maskingIv);
    expect(rPacket.header).to.deep.equal(messagePacket.header);
    expect(rPacket.message).to.deep.equal(messagePacket.message);
  });
});

describe("UDP6 transport", () => {
  const address = "::1";
  const nodeIdA = bytesToHex(new Uint8Array(32).fill(1));
  const portA = 49523;
  const multiaddrA = multiaddr(`/ip6/${address}/udp/${portA}`);
  const a = new UDPTransportService({ bindAddrs: { ip6: multiaddrA }, nodeId: nodeIdA });

  const nodeIdB = bytesToHex(new Uint8Array(32).fill(2));
  const portB = portA + 1;
  const multiaddrB = multiaddr(`/ip6/${address}/udp/${portB}`);
  const b = new UDPTransportService({ bindAddrs: { ip6: multiaddrB }, nodeId: nodeIdB });

  before(async () => {
    await a.start();
    await b.start();
  });

  after(async () => {
    await a.stop();
    await b.stop();
  });

  it("should send and receive messages", async () => {
    const messagePacket: IPacket = {
      maskingIv: new Uint8Array(MASKING_IV_SIZE),
      header: {
        protocolId: "discv5",
        version: 1,
        flag: PacketType.Message,
        nonce: new Uint8Array(NONCE_SIZE),
        authdataSize: 32,
        authdata: new Uint8Array(32).fill(2),
      },
      message: new Uint8Array(44).fill(1),
    };
    const received = new Promise<[Multiaddr, IPacket]>((resolve) =>
      a.once("packet", (sender, packet) => resolve([sender, packet]))
    );
    await b.send(multiaddrA, nodeIdA, messagePacket);
    const [rSender, rPacket] = await received;
    expect(rSender.toString()).to.deep.equal(multiaddrB.toString());
    expect(rPacket.maskingIv).to.deep.equal(messagePacket.maskingIv);
    expect(rPacket.header).to.deep.equal(messagePacket.header);
    expect(rPacket.message).to.deep.equal(messagePacket.message);
  });
});

describe("UDP4+6 transport", () => {
  const address4 = "127.0.0.1";
  const address6 = "::1";
  const nodeIdA = bytesToHex(new Uint8Array(32).fill(1));
  const portA = 49523;
  const multiaddr4A = multiaddr(`/ip4/${address4}/udp/${portA}`);
  const multiaddr6A = multiaddr(`/ip6/${address6}/udp/${portA}`);
  const a = new UDPTransportService({ bindAddrs: { ip4: multiaddr4A, ip6: multiaddr6A }, nodeId: nodeIdA });

  const nodeIdB = bytesToHex(new Uint8Array(32).fill(2));
  const portB = portA + 1;
  const multiaddr4B = multiaddr(`/ip4/${address4}/udp/${portB}`);
  const multiaddr6B = multiaddr(`/ip6/${address6}/udp/${portB}`);
  const b = new UDPTransportService({ bindAddrs: { ip4: multiaddr4B, ip6: multiaddr6B }, nodeId: nodeIdB });

  before(async () => {
    await a.start();
    await b.start();
  });

  after(async () => {
    await a.stop();
    await b.stop();
  });

  it("should send and receive messages", async () => {
    const messagePacket: IPacket = {
      maskingIv: new Uint8Array(MASKING_IV_SIZE),
      header: {
        protocolId: "discv5",
        version: 1,
        flag: PacketType.Message,
        nonce: new Uint8Array(NONCE_SIZE),
        authdataSize: 32,
        authdata: new Uint8Array(32).fill(2),
      },
      message: new Uint8Array(44).fill(1),
    };
    async function send(multiaddr: Multiaddr, nodeId: string, packet: IPacket): Promise<[Multiaddr, IPacket]> {
      const received = new Promise<[Multiaddr, IPacket]>((resolve) =>
        a.once("packet", (sender, packet) => resolve([sender, packet]))
      );
      await b.send(multiaddr, nodeId, packet);
      return await received;
    }
    {
      const [rSender, rPacket] = await send(multiaddr6A, nodeIdA, messagePacket);
      expect(rSender.toString()).to.deep.equal(multiaddr6B.toString());
      expect(rPacket.maskingIv).to.deep.equal(messagePacket.maskingIv);
      expect(rPacket.header).to.deep.equal(messagePacket.header);
      expect(rPacket.message).to.deep.equal(messagePacket.message);
    }
    {
      const [rSender, rPacket] = await send(multiaddr4A, nodeIdA, messagePacket);
      expect(rSender.toString()).to.deep.equal(multiaddr4B.toString());
      expect(rPacket.maskingIv).to.deep.equal(messagePacket.maskingIv);
      expect(rPacket.header).to.deep.equal(messagePacket.header);
      expect(rPacket.message).to.deep.equal(messagePacket.message);
    }
  });
});
