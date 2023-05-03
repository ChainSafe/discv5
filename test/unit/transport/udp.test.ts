/* eslint-env mocha */
import { expect } from "chai";
import { Multiaddr, multiaddr } from "@multiformats/multiaddr";

import { PacketType, IPacket, NONCE_SIZE, MASKING_IV_SIZE } from "../../../src/packet/index.js";
import { UDPTransportService } from "../../../src/transport/index.js";
import { toHex } from "../../../src/util/index.js";

describe("UDP transport", () => {
  const address = "127.0.0.1";
  const nodeIdA = toHex(Buffer.alloc(32, 1));
  const portA = 49523;
  const multiaddrA = multiaddr(`/ip4/${address}/udp/${portA}`);
  const a = new UDPTransportService({ bindAddrs: { ip4: multiaddrA }, nodeId: nodeIdA });

  const nodeIdB = toHex(Buffer.alloc(32, 2));
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
      maskingIv: Buffer.alloc(MASKING_IV_SIZE),
      header: {
        protocolId: "discv5",
        version: 1,
        flag: PacketType.Message,
        nonce: Buffer.alloc(NONCE_SIZE),
        authdataSize: 32,
        authdata: Buffer.alloc(32, 2),
      },
      message: Buffer.alloc(44, 1),
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
