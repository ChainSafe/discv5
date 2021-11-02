/* eslint-env mocha */
import {itBench} from "@dapplion/benchmark";
import { v4 } from "../../src/enr";
import { ENR } from "../../src/enr/enr";
import { Bucket } from "../../src/kademlia/bucket";
import {PENDING_TIMEOUT} from "../../src/kademlia/constants";
import { EntryStatus } from "../../src/kademlia/types";

describe("bucket", function () {
  this.timeout(0);
  for (const updateStatusCount of [1, 10, 100]) {
    itBench<Bucket, Bucket>({
      id: `find enr - ${updateStatusCount} updates`,
      beforeEach: () => generateBucket(),
      fn: (bucket) => {
        for (let i = 0; i < updateStatusCount; i++) {
          for (let j = 0; j < 16; j++) {
            const entry = bucket.getByIndex(j);
            bucket.update(entry.value, entry.status === EntryStatus.Connected ? EntryStatus.Disconnected : EntryStatus.Connected);
          }
        }
        bucket.getValue(bucket.getByIndex(15).value.nodeId);
      },
    });
  }
});

function generateBucket(): Bucket {
  // same kademlia config
  const bucket = new Bucket(16, PENDING_TIMEOUT);
  for (let i = 0; i < 8; i++) {
    const enr = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    bucket.addDisconnected(enr);
  }
  for (let i = 8; i < 16; i++) {
    const enr = ENR.createV4(v4.publicKey(v4.createPrivateKey()));
    bucket.addConnected(enr);
  }
  return bucket;
}
