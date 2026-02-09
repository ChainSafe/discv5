import type {ILookupConfig} from "../kademlia/index.js";
import type {ISessionConfig} from "../session/index.js";

export type IDiscv5Config = ISessionConfig &
  ILookupConfig & {
    /**
     * The time between pings to ensure connectivity amongst connected nodes
     * defined in milliseconds
     */
    pingInterval: number;
    /**
     * Whether to enable enr auto-updating
     */
    enrUpdate: boolean;
    /**
     * The minimum number of peer's who agree on an external IP port before updating the local ENR.
     */
    addrVotesToUpdateEnr: number;
  };

export const defaultConfig: IDiscv5Config = {
  addrVotesToUpdateEnr: 10,
  allowUnverifiedSessions: false,
  enrUpdate: true,
  lookupNumResults: 16,
  lookupParallelism: 3,
  lookupRequestLimit: 3,
  lookupTimeout: 60 * 1000,
  pingInterval: 300 * 1000,
  requestRetries: 1,
  requestTimeout: 1 * 1000,
  sessionCacheCapacity: 2000,
  sessionEstablishTimeout: 15 * 1000,
  sessionTimeout: 86400 * 1000, // 1 day
};
