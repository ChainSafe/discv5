import {createNodeId} from "@chainsafe/enr";
import {beforeEach, describe, expect, it} from "vitest";
import {AddrVotes} from "../../../src/service/addrVotes.js";
import type {SocketAddress} from "../../../src/util/ip.js";

function createIpv4Addr(port: number): SocketAddress {
  return {ip: {octets: new Uint8Array([127, 0, 0, 1]), type: 4}, port};
}

function createIpv6Addr(port: number): SocketAddress {
  return {
    ip: {
      octets: new Uint8Array([0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8]),
      type: 6,
    },
    port,
  };
}

function createTestNodeId(byte: number): string {
  return createNodeId(Buffer.alloc(32, byte));
}

describe("AddrVotes", () => {
  let addVotes: AddrVotes;

  beforeEach(() => {
    addVotes = new AddrVotes(3);
  });

  it("should return winning vote after 3 same votes", () => {
    const addr = createIpv4Addr(30303);
    const nodeId = createTestNodeId(0);
    expect(addVotes.addVote(nodeId, addr)).equals(false);
    // same vote, no effect
    for (let i = 0; i < 100; i++) {
      expect(addVotes.addVote(nodeId, addr)).equals(false);
    }
    // 1 more vote, return undefined
    expect(addVotes.addVote(createTestNodeId(2), addr)).equals(false);
    // winning vote
    expect(addVotes.addVote(createTestNodeId(3), addr)).equals(true);
  });

  it("1 node adds 2 different vote", () => {
    const addr = createIpv4Addr(30303);
    const ipStrange: SocketAddress = {ip: addr.ip, port: 30304};
    const nodeId = createTestNodeId(0);
    expect(addVotes.addVote(nodeId, addr)).equals(false);
    // new vote, strange one => 1st vote is deleted
    expect(addVotes.addVote(nodeId, ipStrange)).equals(false);

    // need 3 more votes to win
    expect(addVotes.addVote(createTestNodeId(1), addr)).equals(false);
    expect(addVotes.addVote(createTestNodeId(2), addr)).equals(false);
    // winning vote
    expect(addVotes.addVote(createTestNodeId(3), addr)).equals(true);
  });

  it("decrements tallies when evicting old votes beyond MAX_VOTES", () => {
    const addr = createIpv4Addr(30303);

    expect(addVotes.addVote(createTestNodeId(1), addr)).to.equal(false);
    expect(addVotes.addVote(createTestNodeId(2), addr)).to.equal(false);

    for (let i = 0; i < 200; i++) {
      expect(addVotes.addVote(createTestNodeId(i + 3), createIpv4Addr(31000 + i))).to.equal(false);
    }

    expect(addVotes.addVote(createTestNodeId(250), addr)).to.equal(false);
  });

  it("currentVoteCount tracks unique voters", () => {
    const addr = createIpv4Addr(30303);

    expect(addVotes.currentVoteCount()).to.equal(0);
    addVotes.addVote(createTestNodeId(1), addr);
    expect(addVotes.currentVoteCount()).to.equal(1);
    addVotes.addVote(createTestNodeId(2), addr);
    expect(addVotes.currentVoteCount()).to.equal(2);

    // Re-vote from same voter doesn't increase count
    addVotes.addVote(createTestNodeId(1), addr);
    expect(addVotes.currentVoteCount()).to.equal(2);

    // Clear resets count
    addVotes.clear();
    expect(addVotes.currentVoteCount()).to.equal(0);
  });

  it("separate vote pools do not interfere with each other", () => {
    const ip4Votes = new AddrVotes(2);
    const ip6Votes = new AddrVotes(2);
    const ip4Addr = createIpv4Addr(30303);
    const ip6Addr = createIpv6Addr(40404);

    expect(ip4Votes.addVote(createTestNodeId(1), ip4Addr)).to.equal(false);
    expect(ip6Votes.addVote(createTestNodeId(1), ip6Addr)).to.equal(false);

    expect(ip4Votes.addVote(createTestNodeId(2), ip4Addr)).to.equal(true);
    expect(ip6Votes.addVote(createTestNodeId(2), ip6Addr)).to.equal(true);
  });
});
