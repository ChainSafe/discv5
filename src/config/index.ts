import { ISessionConfig } from "../session";
import { ILookupConfig } from "../kademlia";

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
     * instance name for log
     */
    logPrefix?: string;
    /**
     * The minimum number of peer's who agree on an external IP port before updating the local ENR.
     */
    addrVotesToUpdateEnr: number;
  };

export const defaultConfig: IDiscv5Config = {
  requestTimeout: 1 * 1000,
  requestRetries: 1,
  sessionTimeout: 86400 * 1000, // 1 day
  sessionCacheCapacity: 1000,
  sessionEstablishTimeout: 15 * 1000,
  addrVotesToUpdateEnr: 10,
  lookupParallelism: 3,
  lookupNumResults: 16,
  lookupTimeout: 60 * 1000,
  pingInterval: 300 * 1000,
  enrUpdate: true,
};
