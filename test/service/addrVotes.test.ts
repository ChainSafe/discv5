import { expect } from "chai";
import { Multiaddr } from "multiaddr";
import * as sinon from "sinon";
import { createNodeId } from "../../src/enr";
import {AddrVotes} from "../../src/service/addrVotes";
import { IP_VOTE_TIMEOUT } from "../../src/service/constants";

describe("AddrVotes", () => {
  const sandbox = sinon.createSandbox();
  let addVotes: AddrVotes;

  beforeEach(() => {
    sandbox.useFakeTimers();
    addVotes = new AddrVotes();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should remove vote after IP_VOTE_TIMEOUT", () => {
    const multi0 = new Multiaddr("/ip4/127.0.0.1/udp/30303");
    const nodeId = createNodeId(Buffer.alloc(32));
    addVotes.addVote(nodeId, multi0);
    const best = addVotes.best();
    expect(best?.toString()).to.be.equal(multi0.toString(), "best addr should be multi0 before timing out");
    sandbox.clock.tick(IP_VOTE_TIMEOUT);
    expect(addVotes.best(), "should has no best address after timing out").to.be.undefined;
  });
});
