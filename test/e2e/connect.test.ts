/* eslint-env mocha */
import { expect } from "chai";
import { Multiaddr } from "multiaddr";
import PeerId from "peer-id";
import { Discv5, ENR } from "../../src";
import { getNodeIdToIdx, getPeerId, NodeIdToIdx } from "./util";

let nodeIdx = 0;
const portBase = 9000;
/** Short times to disconnect peers fast after a PING */
const requestTimeout = 100;

describe("discv5 integration test", function () {
  this.timeout("5min");

  let nodeIdToIdx: NodeIdToIdx;
  before(async () => {
    nodeIdToIdx = await getNodeIdToIdx();
  });

  const afterEachCallbacks: (() => Promise<void> | void)[] = [];
  afterEach(async () => {
    while (afterEachCallbacks.length > 0) {
      const callback = afterEachCallbacks.pop();
      if (callback) await callback();
    }
  });

  async function getENR(i: number) {
    const peerId = await getPeerId(i);
    return ENR.createFromPeerId(peerId);
  }

  async function getDiscv5Node(i: number): Promise<Node> {
    const port = portBase + i;
    const peerId = await getPeerId(i);
    const enr = ENR.createFromPeerId(peerId);

    const bindAddrUdp = `/ip4/127.0.0.1/udp/${port}`;
    const multiAddrUdp = new Multiaddr(bindAddrUdp);
    enr.setLocationMultiaddr(multiAddrUdp);

    const discv5 = Discv5.create({
      enr,
      peerId,
      multiaddr: multiAddrUdp,
      config: {
        logPrefix: String(i),
        requestTimeout,
      },
    });

    afterEachCallbacks.push(() => discv5.stop());
    await discv5.start();

    return { i, peerId, enr, discv5 };
  }

  // 2862ae92fa59042fd4d4a3e3bddb92b33a53b72be15deafce07dfbd7c3b12812

  it.only("Connect node0 to node1 then disconnect them", async () => {
    const node0 = await getDiscv5Node(0);
    const node1 = await getDiscv5Node(1);
    const enr2 = await getENR(2);

    // With the find node request expected node0 to start a handshake with node1
    node0.discv5.addEnr(node1.enr);
    await node0.discv5.findNode(enr2.nodeId);
    // Assert the connection is stablished both ways
    expectConnectedTo(node0, node1);
    expectConnectedTo(node1, node0);

    // Stop node1 and assert its connections are closed
    await node1.discv5.stop();
    expectNotConnectedTo(node1, node0);

    // Force node0 to ping node1 and expect node0 to disconnect node1 after requestTimeout
    node0.discv5["sendPing"](node1.enr.nodeId);
    await sleep(requestTimeout + 50);
    expectNotConnectedTo(node0, node1);
  });

  it("From node0 find node2 through node1", async () => {
    const node0 = await getDiscv5Node(0);
    const node1 = await getDiscv5Node(1);
    const node2 = await getDiscv5Node(2);

    node0.discv5.addEnr(node1.enr);
    node1.discv5.addEnr(node2.enr);
    const nodes = await node0.discv5.findNode(node2.enr.nodeId);
    expect(nodes.map((n) => n.nodeId)).to.deep.equal([node2.enr.nodeId], "Should find ENR of node2");
  });

  type Node = { peerId: PeerId; enr: ENR; discv5: Discv5; i: number };

  function expectConnectedTo(node: Node, toNode: Node) {
    const connectedNodes = Array.from(node.discv5["connectedPeers"].keys()).map(nodeIdToIdx);
    expect(connectedNodes).to.include(toNode.i, `Expected node${node.i} to be connected to nodes`);
  }

  function expectNotConnectedTo(node: Node, toNode: Node) {
    const connectedNodes = Array.from(node.discv5["connectedPeers"].keys()).map(nodeIdToIdx);
    expect(connectedNodes).to.not.include(toNode.i, `Expected node${node.i} to not be connected to nodes`);
  }
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
