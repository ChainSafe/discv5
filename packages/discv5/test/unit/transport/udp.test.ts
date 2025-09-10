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
  context("with loopback addresses", () => {
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

  context("with wildcard addresses", () => {
    it("should bind to the same port on both IPv4 and IPv6", async () => {
      const nodeId = bytesToHex(new Uint8Array(32).fill(3));
      const port = 49525;
      const multiaddr4 = multiaddr(`/ip4/0.0.0.0/udp/${port}`);
      const multiaddr6 = multiaddr(`/ip6/::/udp/${port}`);

      const transport = new UDPTransportService({
        bindAddrs: { ip4: multiaddr4, ip6: multiaddr6 },
        nodeId,
      });

      await transport.start();
      expect(transport.bindAddrs).to.have.lengthOf(2);
      expect(transport.bindAddrs[0].toString()).to.equal(multiaddr4.toString());
      expect(transport.bindAddrs[1].toString()).to.equal(multiaddr6.toString());
      await transport.stop();
    });

    it("should successfully communicate between dual-stack nodes on same port", async () => {
      const nodeIdA = bytesToHex(new Uint8Array(32).fill(4));
      const nodeIdB = bytesToHex(new Uint8Array(32).fill(5));
      const portA = 49526;
      const portB = 49527;

      const multiaddr4A = multiaddr(`/ip4/127.0.0.1/udp/${portA}`);
      const multiaddr6A = multiaddr(`/ip6/::1/udp/${portA}`);
      const a = new UDPTransportService({
        bindAddrs: { ip4: multiaddr4A, ip6: multiaddr6A },
        nodeId: nodeIdA,
      });

      const multiaddr4B = multiaddr(`/ip4/127.0.0.1/udp/${portB}`);
      const multiaddr6B = multiaddr(`/ip6/::1/udp/${portB}`);
      const b = new UDPTransportService({
        bindAddrs: { ip4: multiaddr4B, ip6: multiaddr6B },
        nodeId: nodeIdB,
      });

      await a.start();
      await b.start();

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

      const receivedIPv4 = new Promise<[Multiaddr, IPacket]>((resolve) =>
        a.once("packet", (sender, packet) => resolve([sender, packet]))
      );
      await b.send(multiaddr4A, nodeIdA, messagePacket);
      const [senderIPv4] = await receivedIPv4;
      expect(senderIPv4.toString()).to.equal(multiaddr4B.toString());

      const receivedIPv6 = new Promise<[Multiaddr, IPacket]>((resolve) =>
        a.once("packet", (sender, packet) => resolve([sender, packet]))
      );
      await b.send(multiaddr6A, nodeIdA, messagePacket);
      const [senderIPv6] = await receivedIPv6;
      expect(senderIPv6.toString()).to.equal(multiaddr6B.toString());

      await a.stop();
      await b.stop();
    });

    it("should handle multiple dual-stack nodes on different ports", async () => {
      const ports = [49528, 49529, 49530];
      const transports: UDPTransportService[] = [];

      for (let i = 0; i < ports.length; i++) {
        const nodeId = bytesToHex(new Uint8Array(32).fill(10 + i));
        const multiaddr4 = multiaddr(`/ip4/127.0.0.1/udp/${ports[i]}`);
        const multiaddr6 = multiaddr(`/ip6/::1/udp/${ports[i]}`);
        const transport = new UDPTransportService({
          bindAddrs: { ip4: multiaddr4, ip6: multiaddr6 },
          nodeId,
        });
        transports.push(transport);
      }

      await Promise.all(transports.map((t) => t.start()));

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

      const received = new Promise<boolean>((resolve) => {
        transports[1].once("packet", () => resolve(true));
      });

      const targetMultiaddr = multiaddr(`/ip4/127.0.0.1/udp/${ports[1]}`);
      const targetNodeId = bytesToHex(new Uint8Array(32).fill(11));
      await transports[0].send(targetMultiaddr, targetNodeId, messagePacket);

      expect(await received).to.be.true;

      await Promise.all(transports.map((t) => t.stop()));
    });
  });
});
