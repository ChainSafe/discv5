import { EventEmitter } from "events";

import { ENR, NodeId } from "../enr";
import { BucketEventEmitter, EntryStatus, IEntry, IEntryFull } from "./types";

export class Bucket extends (EventEmitter as { new (): BucketEventEmitter }) {
  private k: number;
  /**
   * Entries ordered from least-recently connected to most-recently connected
   */
  private bucket: IEntry<ENR>[];
  private pending: IEntry<ENR> | undefined;
  private pendingTimeout: number;
  private pendingTimeoutId: NodeJS.Timeout | undefined;

  constructor(k: number, pendingTimeout: number) {
    super();
    this.k = k;
    this.bucket = [];
    this.pendingTimeout = pendingTimeout;
  }

  /**
   * Remove all entries, including any pending entry
   */
  clear(): void {
    this.bucket = [];
    this.pending = undefined;
    clearTimeout((this.pendingTimeoutId as unknown) as NodeJS.Timeout);
  }

  /**
   * The number of entries in the bucket
   */
  size(): number {
    return this.bucket.length;
  }

  /**
   * Returns true when there are no entries in the bucket
   */
  isEmpty(): boolean {
    return this.bucket.length === 0;
  }

  /**
   * Return the first index in the bucket with a `Connected` status (or -1 if none exist)
   */
  firstConnectedIndex(): number {
    return this.bucket.findIndex((entry) => entry.status === EntryStatus.Connected);
  }

  /**
   * Attempt to add an ENR with a status to the bucket
   *
   * If this entry's status is connected, the bucket is full, and there are disconnected entries in the bucket,
   * set this new entry as a pending entry
   *
   * Returns true if the entry is successfully inserted into the bucket. (excludes pending)
   */
  add(value: ENR, status: EntryStatus): boolean {
    if (status === EntryStatus.Connected) {
      return this.addConnected(value);
    }
    return this.addDisconnected(value);
  }

  addConnected(value: ENR): boolean {
    if (this.bucket.length < this.k) {
      this.bucket.push({ value, status: EntryStatus.Connected });
      return true;
    }
    // attempt to add a pending node
    this.addPending(value, EntryStatus.Connected);
    return false;
  }

  addDisconnected(value: ENR): boolean {
    const firstConnected = this.firstConnectedIndex();
    if (this.bucket.length < this.k) {
      if (firstConnected === -1) {
        // No connected nodes, add to the end
        this.bucket.push({ value, status: EntryStatus.Disconnected });
      } else {
        // add before the first connected node
        this.bucket.splice(firstConnected, 0, { value, status: EntryStatus.Disconnected });
      }
      return true;
    }
    return false;
  }

  /**
   * Update an existing entry (ENR)
   */
  updateValue(value: ENR): boolean {
    const index = this.bucket.findIndex((entry) => entry.value.nodeId === value.nodeId);
    if (index === -1) {
      if (this.pending && this.pending.value.nodeId === value.nodeId) {
        this.pending.value = value;
        return true;
      }
      return false;
    }
    this.bucket[index].value = value;
    return true;
  }

  /**
   * Update the status of an existing entry
   */
  updateStatus(id: NodeId, status: EntryStatus): boolean {
    const index = this.bucket.findIndex((entry) => entry.value.nodeId === id);
    if (index === -1) {
      if (this.pending && this.pending.value.nodeId === id) {
        this.pending.status = status;
        return true;
      }
      return false;
    }
    if (this.bucket[index].status === status) {
      return true;
    }
    const value = this.removeByIndex(index);
    return this.add(value, status);
  }

  /**
   * Update both the value and status of an existing entry
   */
  update(value: ENR, status: EntryStatus): boolean {
    const index = this.bucket.findIndex((entry) => entry.value.nodeId === value.nodeId);
    if (index === -1) {
      if (this.pending && this.pending.value.nodeId === value.nodeId) {
        this.pending = { value, status };
        return true;
      }
      return false;
    }
    if (this.bucket[index].status === status) {
      return true;
    }
    this.removeByIndex(index);
    return this.add(value, status);
  }

  /**
   * Attempt to add an entry as a "pending" entry
   *
   * This will trigger a "pendingEviction" event with the entry which should be updated
   * and a callback to `applyPending` to evict the first disconnected entry, should one exist at the time.
   */
  addPending(value: ENR, status: EntryStatus): boolean {
    if (!this.pending && this.firstConnectedIndex() !== 0) {
      this.pending = { value, status };
      const first = this.bucket[0];
      this.emit("pendingEviction", first.value);
      this.pendingTimeoutId = setTimeout(this.applyPending, this.pendingTimeout);
      return true;
    }
    return false;
  }
  applyPending = (): void => {
    if (this.pending) {
      // If the bucket is full with connected nodes, drop the pending node
      if (this.firstConnectedIndex() === 0) {
        this.pending = undefined;
        return;
      }
      // else the first entry can be removed and the pending can be added
      const evicted = this.removeByIndex(0);
      const inserted = this.pending.value;
      this.add(this.pending.value, this.pending.status);
      this.pending = undefined;
      this.emit("appliedEviction", inserted, evicted);
    }
  };

  /**
   * Get an entry from the bucket, if it exists
   */
  get(id: NodeId): IEntry<ENR> | undefined {
    const entry = this.bucket.find((entry) => entry.value.nodeId === id);
    if (entry) {
      return entry;
    }
    return undefined;
  }

  /**
   * Get an entry from the bucket if it exists
   * Also check the pending entry
   *
   * Return an entry with an additional property marking if the entry was the pending entry
   */
  getWithPending(id: NodeId): IEntryFull<ENR> | undefined {
    const bucketEntry = this.get(id);
    if (bucketEntry) {
      return { pending: false, ...bucketEntry };
    }
    if (this.pending && this.pending.value.nodeId === id) {
      return { pending: true, ...this.pending };
    }
    return undefined;
  }

  /**
   * Return the value of an entry if it exists in the bucket
   */
  getValue(id: NodeId): ENR | undefined {
    const entry = this.get(id);
    if (entry) {
      return entry.value;
    }
    return undefined;
  }

  /**
   * Get a value from the bucket by index
   */
  getValueByIndex(index: number): ENR {
    if (index >= this.bucket.length) {
      throw new Error(`Invalid index in bucket: ${index}`);
    }
    return this.bucket[index].value;
  }

  /**
   * Remove a value from the bucket by index
   */
  removeByIndex(index: number): ENR {
    if (index >= this.bucket.length) {
      throw new Error(`Invalid index in bucket: ${index}`);
    }
    return this.bucket.splice(index, 1)[0].value;
  }

  /**
   * Remove a value from the bucket by NodeId
   */
  removeById(id: NodeId): ENR | undefined {
    const index = this.bucket.findIndex((entry) => entry.value.nodeId === id);
    if (index === -1) {
      return undefined;
    }
    return this.removeByIndex(index);
  }

  /**
   * Remove an ENR from the bucket
   */
  remove(value: ENR): ENR | undefined {
    return this.removeById(value.nodeId);
  }

  /**
   * Return the bucket values as an array
   */
  values(): ENR[] {
    return this.bucket.map((entry) => entry.value);
  }
}
