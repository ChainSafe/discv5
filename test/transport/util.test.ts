/* eslint-env mocha */
import { expect } from "chai";
import Multiaddr from "multiaddr";
import { isCorrectNetworkMultiAddr } from "../../src/transport/util";

describe("Test isCorrectNetworkMultiAddr", () => {
  it("should return true for 127.0.0.1", async () => {
    const multi0 = Multiaddr("/ip4/127.0.0.1/udp/30303");
    expect(await isCorrectNetworkMultiAddr(multi0)).to.be.true;
  });

  it("should return false for 0.0.0.0", async () => {
    const multi0 = Multiaddr("/ip4/0.0.0.0/udp/30303");
    expect(await isCorrectNetworkMultiAddr(multi0)).to.be.false;
  });
});