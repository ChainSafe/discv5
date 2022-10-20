import { IDiscv5Metrics } from "../service/index.js";
import { RateLimiterGRCA, RateLimiterQuota } from "./rateLimiterGRCA.js";

type IPAddress = string;

export interface PacketSrc {
  address: IPAddress;
  family: "IPv4" | "IPv6";
  port: number;
  size: number;
}

export interface RateLimiterOpts {
  globalQuota: RateLimiterQuota;
  byIPQuota: RateLimiterQuota;
}

export interface IRateLimiter {
  allowEncodedPacket(ip: IPAddress): boolean;
  addExpectedResponse(ip: IPAddress): void;
  removeExpectedResponse(ip: IPAddress): void;
}

export class RateLimiter implements IRateLimiter {
  private readonly rateLimiterGlobal: RateLimiterGRCA<null>;
  private readonly rateLimiterIP: RateLimiterGRCA<IPAddress>;

  private readonly bannedIPs = new Map<IPAddress, number>();
  private readonly expectedResponsesByIP = new Map<IPAddress, number>();

  constructor(opts: RateLimiterOpts, private readonly metrics: IDiscv5Metrics | null) {
    this.rateLimiterGlobal = RateLimiterGRCA.fromQuota(opts.globalQuota);
    this.rateLimiterIP = RateLimiterGRCA.fromQuota(opts.byIPQuota);
  }

  allowEncodedPacket(ip: IPAddress): boolean {
    if (this.bannedIPs.has(ip)) {
      return false;
    }

    if (this.expectsResponseFromIP(ip)) {
      return true;
    }

    if (!this.rateLimiterIP.allows(ip, 1)) {
      this.metrics?.rateLimitHitIP.inc();

      this.bannedIPs.set(ip, Date.now());

      return false;
    }

    if (!this.rateLimiterGlobal.allows(null, 1)) {
      this.metrics?.rateLimitHitTotal.inc();
      return false;
    }

    return true;
  }

  addExpectedResponse(ip: IPAddress): void {
    this.expectedResponsesByIP.set(ip, (this.expectedResponsesByIP.get(ip) ?? 0) + 1);
  }

  removeExpectedResponse(ip: IPAddress): void {
    const expectedResponses = this.expectedResponsesByIP.get(ip);
    if (expectedResponses !== undefined) {
      if (expectedResponses > 1) {
        this.expectedResponsesByIP.set(ip, expectedResponses - 1);
      } else {
        this.expectedResponsesByIP.delete(ip);
      }
    }
  }

  /** After a request initiated by us we expected a response from this IP */
  private expectsResponseFromIP(ip: IPAddress): boolean {
    return this.expectedResponsesByIP.has(ip);
  }
}
