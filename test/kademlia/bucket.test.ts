/* eslint-env mocha */
import { expect } from "chai";
import { ENR, v4 } from "../../src/enr";
import {Bucket} from "../../src/kademlia/bucket";
import { EntryStatus } from "../../src/kademlia/types";

describe.only("Bucket", () => {
  const timeoutMs = 100;
  let bucket: Bucket;
  const enr0 = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
  const enr1 = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
  const enr2 = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
  const [nodeId0, nodeId1, nodeId2] = [enr0.nodeId, enr1.nodeId, enr2.nodeId];

  beforeEach(() => {
    bucket = new Bucket(4, timeoutMs);
    bucket.add(enr0, EntryStatus.Disconnected);
    bucket.add(enr1, EntryStatus.Connected);
    bucket.add(enr2, EntryStatus.Connected);
  });

  it("addConnected", () => {
    // not full
    const newEnr = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    bucket.addConnected(newEnr);
    expect(bucket.getValue(newEnr.nodeId)).to.be.equal(newEnr);
    expectCorrectNodeIdMap();

    // full
    const newEnr2 = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    bucket.addConnected(newEnr);
    expect(bucket.getValue(newEnr2.nodeId)).to.be.undefined;
    expectCorrectNodeIdMap();
  });

  it("addDisconnected", () => {
    // not full
    const newEnr = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    bucket.addDisconnected(newEnr);
    expect(bucket.getValue(newEnr.nodeId)).to.be.equal(newEnr);
    expectCorrectNodeIdMap();

    // full
    const newEnr2 = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    bucket.addDisconnected(newEnr);
    expect(bucket.getValue(newEnr2.nodeId)).to.be.undefined;
    expectCorrectNodeIdMap();
  });

  it("updateValue", () => {
    enr1.ip = "127.0.0.1";
    expectCorrectNodeIdMap();
  });

  it("updateStatus", () => {
    // strange node id
    bucket.updateStatus("wrong node id", EntryStatus.Connected);
    expectCorrectNodeIdMap();

    // pending
    const newEnr = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    bucket.addPending(newEnr, EntryStatus.Connected);
    bucket.updateStatus(newEnr.nodeId, EntryStatus.Disconnected);
    expect(bucket.getWithPending(newEnr.nodeId)?.value).to.be.equal(newEnr);
    expectCorrectNodeIdMap();

    // existing enr, unchanged status
    bucket.updateStatus(nodeId1, EntryStatus.Connected);
    expectCorrectNodeIdMap();

    // existing enr, changed status
    bucket.updateStatus(nodeId1, EntryStatus.Disconnected);
    expectCorrectNodeIdMap();
  });

  it("update", () => {
    // strange node id
    const newEnr = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    bucket.update(newEnr, EntryStatus.Connected);
    expectCorrectNodeIdMap();

    // pending
    bucket.addPending(newEnr, EntryStatus.Connected);
    bucket.update(newEnr, EntryStatus.Disconnected);
    expect(bucket.getWithPending(newEnr.nodeId)?.value).to.be.equal(newEnr);
    expectCorrectNodeIdMap();

    // existing enr, unchanged status
    bucket.update(enr1, EntryStatus.Connected);
    expectCorrectNodeIdMap();

    // existing enr, changed status
    bucket.update(enr1, EntryStatus.Disconnected);
    expectCorrectNodeIdMap();
  });

  it("addPending", () => {
    // not full
    const newEnr = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    expect(bucket.addPending(newEnr, EntryStatus.Connected)).to.be.true;
    expect(bucket.getWithPending(newEnr.nodeId)?.value).to.be.equal(newEnr);

    // full
    const newEnr2 = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    expect(bucket.addPending(newEnr2, EntryStatus.Connected)).to.be.false;
    expect(bucket.getWithPending(newEnr2.nodeId)?.value).to.be.undefined;
  });

  it("applyPending", () => {
    const newEnr = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    expect(bucket.addPending(newEnr, EntryStatus.Connected)).to.be.true;

    // there is 1 disconnected enr, applyPending should work
    expect(bucket.getValue(nodeId0)).to.be.equal(enr0);
    bucket.applyPending();
    expect(bucket.getValue(newEnr.nodeId)).to.be.equal(newEnr);
    expect(bucket.getValue(nodeId0)).to.be.undefined;
  });

  it("removeByIndex", () => {
    bucket.removeByIndex(1);
    expect(bucket.getValue(nodeId0)).to.be.equal(enr0);
    expect(bucket.getValue(nodeId1)).to.be.undefined;
    expect(bucket.getValue(nodeId2)).to.be.equal(enr2);
  });

  it("removeById", () => {
    bucket.removeById(nodeId1);
    expect(bucket.getValue(nodeId0)).to.be.equal(enr0);
    expect(bucket.getValue(nodeId1)).to.be.undefined;
    expect(bucket.getValue(nodeId2)).to.be.equal(enr2);
  });

  it("remove", () => {
    bucket.remove(enr1);
    expect(bucket.getValue(nodeId0)).to.be.equal(enr0);
    expect(bucket.getValue(nodeId1)).to.be.undefined;
    expect(bucket.getValue(nodeId2)).to.be.equal(enr2);
  });

  it("values", () => {
    expect(bucket.values()).to.be.deep.equal([enr0, enr1, enr2]);
  });

  function expectCorrectNodeIdMap(): void {
    expect(bucket.getValue(nodeId0)).to.be.equal(enr0, "incorrect enr 0");
    expect(bucket.getValue(nodeId1)).to.be.equal(enr1, "incorrect enr 1");
    expect(bucket.getValue(nodeId2)).to.be.equal(enr2, "incorrect enr 2");
  }
});
