/* eslint-env mocha */
import { expect } from "chai";
import { privateKeyFromProtobuf } from "@libp2p/crypto/keys";
import { PrivateKey } from "@libp2p/interface";
import { multiaddr } from "@multiformats/multiaddr";
import { SignableENR } from "@chainsafe/enr";
import { Discv5 } from "../../src/index.js";

let nodeIdx = 0;
const portBase = 10000;

describe("discv5 integration test", function () {
  const nodes: Discv5[] = [];

  type Node = {
    privateKey: PrivateKey;
    enr: SignableENR;
    discv5: Discv5;
  };
  async function getDiscv5Node(): Promise<Node> {
    const idx = nodeIdx++;
    const port = portBase + idx;
    const privateKey = getPrivateKey(idx);
    const enr = SignableENR.createFromPrivateKey(privateKey);

    const bindAddrUdp = `/ip4/127.0.0.1/udp/${port}`;
    const multiAddrUdp = multiaddr(bindAddrUdp);
    enr.setLocationMultiaddr(multiAddrUdp);

    const discv5 = Discv5.create({
      enr,
      privateKey,
      bindAddrs: { ip4: multiAddrUdp },
      config: {
        lookupTimeout: 2000,
      },
    });

    nodes.push(discv5);

    await discv5.start();

    return { privateKey, enr, discv5 };
  }

  // 2862ae92fa59042fd4d4a3e3bddb92b33a53b72be15deafce07dfbd7c3b12812

  this.afterEach(async () => {
    for (const node of nodes) {
      await node.stop();
    }
  });

  it("Connect two nodes", async () => {
    const node0 = await getDiscv5Node();
    const node1 = await getDiscv5Node();
    const node2 = await getDiscv5Node();

    node0.discv5.addEnr(node1.enr.toENR());
    node1.discv5.addEnr(node2.enr.toENR());
    const nodes = await node0.discv5.findNode(node2.enr.nodeId);
    expect(nodes.map((n) => n.nodeId)).to.deep.equal([node2.enr.nodeId, node1.enr.nodeId], "Should find ENR of node2");
  });

  it("Send TALKREQ/TALKRESP", async function () {
    const node0 = await getDiscv5Node();
    const node1 = await getDiscv5Node();

    node0.discv5.addEnr(node1.enr.toENR());

    // test a TALKRESP with no response
    try {
      await node0.discv5.sendTalkReq(node1.enr.toENR(), Buffer.from([0, 1, 2, 3]), "foo");
      expect.fail("TALKREQ response should throw when no response is given");
    } catch (e) {
      // expected
    }

    // test a TALKRESP with a response
    const expectedResp = Buffer.from([4, 5, 6, 7]);
    node1.discv5.on("talkReqReceived", (nodeAddr, enr, request) => {
      void node1.discv5.sendTalkResp(nodeAddr, request.id, expectedResp);
    });
    const resp = await node0.discv5.sendTalkReq(node1.enr.toENR(), Buffer.from([0, 1, 2, 3]), "foo");
    expect(resp).to.deep.equal(expectedResp);
  });
});

function getPrivateKey(i: number): PrivateKey {
  const privKeysBase64 = [
    "CAISIF9nhmNn+vOoMPdR+adfKwjSdgqrVGmAX0AWe6Tgjj/p",
    "CAISIMSR1N4+3m62NGJ8pdgiUPzFR4vv8pZKG6q+iys+B2DL",
    "CAISICt4F0d4SSXzWUfH8t6ubKqvFF5yJ35lxXnmrovJvwGL",
    "CAISIEQcrGuNoRcrUBR4nM/p1Pjhk22WWGMQ0+7wtGqnG2Mj",
    "CAISIPeChcLlW+8EoyQwcM6hBxBH3ozY/zq9C9j20Zzpsi5U",
    "CAISICVr/9VGoyDkzkvlIa7OMNKXMPhhfMsG19WLilEbqOZy",
    "CAISIBawDQDzDpH4WQiDo0g8qhkMmqYpXIeYt+wF1l9t1Zyh",
    "CAISII1BySgfilbW8Q831rIm/IvAxqu65BtSFt0+cw7lt1yu",
    "CAISIHRKcVKLTpKhQOEIPwQjH2xx/nvJWWLUCr90/NOuuZ+l",
    "CAISIP3n7vFWZKye7duop0nhfttFJUXTVvQfd4q0dPpURLke",
  ];
  return privateKeyFromProtobuf(Buffer.from(privKeysBase64[i], "base64"));
}
