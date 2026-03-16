import type {NodeId} from "@chainsafe/enr";
import type {SocketAddress} from "../util/ip.js";

/** Serialized representation of the IP:port vote from the Pong message */
type VoteID = string;

const MAX_VOTES = 200;

export class AddrVotes {
  /** Bounded by `MAX_VOTES`, on new votes evicts the oldest votes */
  private readonly votes = new Map<NodeId, {socketAddrStr: VoteID; unixTsMs: number}>();
  /** Bounded by votes, if the vote count reaches 0, its key is deleted */
  private readonly tallies = new Map<VoteID, number>();

  constructor(private readonly addrVotesToUpdateEnr: number) {}

  /**
   * Adds vote to a given IP:port tuple from a Pong message. If the votes for this addr are greater than `votesToWin`,
   * @returns true if the added vote is the winning vote. In that case clears all existing votes.
   */
  addVote(voter: NodeId, ip: SocketAddress): boolean {
    const socketAddrStr = serializeSocketAddr(ip);

    const prevVote = this.votes.get(voter);
    if (prevVote?.socketAddrStr === socketAddrStr) {
      // Same vote, ignore
      return false;
    }
    if (prevVote !== undefined) {
      // If there was a previous vote, remove from tally
      this.decrementTally(prevVote.socketAddrStr);
    }

    const currentTally = (this.tallies.get(socketAddrStr) ?? 0) + 1;

    // Conclude vote period if there are enough votes for an option
    if (currentTally >= this.addrVotesToUpdateEnr) {
      // If enough peers vote the same conclude the vote
      this.clear();
      return true;
    }

    // Persist vote
    this.tallies.set(socketAddrStr, currentTally);
    this.votes.set(voter, {socketAddrStr: socketAddrStr, unixTsMs: Date.now()});

    // If there are too many votes, remove the oldest
    if (this.votes.size > MAX_VOTES) {
      for (const vote of this.votes.keys()) {
        const evictedVote = this.votes.get(vote);
        this.votes.delete(vote);
        if (evictedVote) {
          this.decrementTally(evictedVote.socketAddrStr);
        }
        if (this.votes.size <= MAX_VOTES) {
          break;
        }
      }
    }

    return false;
  }

  /**
   * Returns the number of unique voters that have cast a vote.
   * Used by `requireMoreIpVotes` to check if we have enough votes for this family.
   */
  currentVoteCount(): number {
    return this.votes.size;
  }

  clear(): void {
    this.votes.clear();
    this.tallies.clear();
  }

  private decrementTally(socketAddrStr: VoteID): void {
    const nextTally = (this.tallies.get(socketAddrStr) ?? 0) - 1;
    if (nextTally <= 0) {
      this.tallies.delete(socketAddrStr);
    } else {
      this.tallies.set(socketAddrStr, nextTally);
    }
  }
}

/** Arbitrary serialization of SocketAddr, used only to tally votes */
function serializeSocketAddr(addr: SocketAddress): string {
  return `${addr.ip.type}-${Buffer.from(addr.ip.octets).toString("hex")}:${addr.port}`;
}
