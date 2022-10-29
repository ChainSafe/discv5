import { expect } from "chai";
import { createNodeId } from "../../../src/enr/index.js";
import { AddrVotes } from "../../../src/service/addrVotes.js";
import { IP } from "../../../src/util/ip.js";

describe("AddrVotes", () => {
  let addVotes: AddrVotes;

  beforeEach(() => {
    addVotes = new AddrVotes(3);
  });

  it("should return winning vote after 3 same votes", () => {
    const ip: IP = { type: 4, octets: new Uint8Array([127, 0, 0, 1]) };
    const port = 30303;
    const nodeId = createNodeId(Buffer.alloc(32));
    expect(addVotes.addVote(nodeId, ip, port)).equals(false);
    // same vote, no effect
    for (let i = 0; i < 100; i++) {
      expect(addVotes.addVote(nodeId, ip, port)).equals(false);
    }
    // 1 more vote, return undefined
    expect(addVotes.addVote(createNodeId(Buffer.alloc(32, 2)), ip, port)).equals(false);
    // winning vote
    expect(addVotes.addVote(createNodeId(Buffer.alloc(32, 3)), ip, port)).equals(true);
  });

  it("1 node adds 2 different vote", () => {
    const ip: IP = { type: 4, octets: new Uint8Array([127, 0, 0, 1]) };
    const port = 30303;
    const nodeId = createNodeId(Buffer.alloc(32));
    expect(addVotes.addVote(nodeId, ip, port)).equals(false);
    // new vote, strange one => 1st vote is deleted
    expect(addVotes.addVote(nodeId, ip, 30304)).equals(false);

    // need 3 more votes to win
    expect(addVotes.addVote(createNodeId(Buffer.alloc(32, 1)), ip, port)).equals(false);
    expect(addVotes.addVote(createNodeId(Buffer.alloc(32, 2)), ip, port)).equals(false);
    // winning vote
    expect(addVotes.addVote(createNodeId(Buffer.alloc(32, 3)), ip, port)).equals(true);
  });
});
