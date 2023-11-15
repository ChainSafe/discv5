export interface MetricsRegister {
  gauge<T extends string>(config: GaugeConfig<T>): IGauge<T>;
}

type GaugeConfig<T extends string> = {
  name: string;
  help: string;
  labelNames?: T[] | readonly T[];
};

type Labels<T extends string> = Partial<Record<T, string | number>>;
interface IGauge<T extends string = string> {
  inc(value?: number): void;
  inc(labels: Labels<T>, value?: number): void;
  set(value: number): void;
  set(labels: Labels<T>, value: number): void;
  collect(): void;
}

export interface IDiscv5Metrics {
  kadTableSize: IGauge;
  activeSessionCount: IGauge;
  connectedPeerCount: IGauge;
  lookupCount: IGauge;

  sentMessageCount: IGauge<"type">;
  rcvdMessageCount: IGauge<"type">;

  rateLimitHitIP: IGauge;
  rateLimitHitTotal: IGauge;
}

export type Metrics = ReturnType<typeof createDiscv5Metrics>;

/**
 * Discv5 metrics
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export function createDiscv5Metrics(register: MetricsRegister) {
  return {
    /** Total size of the kad table */
    kadTableSize: register.gauge({
      name: "discv5_kad_table_size",
      help: "Total size of the discv5 kad table",
    }),
    /** Total number of attempted lookups */
    lookupCount: register.gauge({
      name: "discv5_lookup_count",
      help: "Total count of discv5 lookups",
    }),
    /** Total number of active sessions */
    activeSessionCount: register.gauge({
      name: "discv5_active_session_count",
      help: "Count of the discv5 active sessions",
    }),
    /** Total number of connected peers */
    connectedPeerCount: register.gauge({
      name: "discv5_connected_peer_count",
      help: "Count of the discv5 connected peers",
    }),
    /** Total number messages sent by message type */
    sentMessageCount: register.gauge<"type">({
      name: "discv5_sent_message_count",
      help: "Count of the discv5 messages sent by message type",
      labelNames: ["type"],
    }),
    /** Total number messages received by message type */
    rcvdMessageCount: register.gauge<"type">({
      name: "discv5_rcvd_message_count",
      help: "Count of the discv5 messages received by message type",
      labelNames: ["type"],
    }),
    /** Total count of rate limit hits by IP */
    rateLimitHitIP: register.gauge({
      name: "discv5_rate_limit_hit_ip",
      help: "Total count of rate limit hits by IP",
    }),
    /** Total count of rate limit hits by total requests */
    rateLimitHitTotal: register.gauge({
      name: "discv5_rate_limit_hit_total",
      help: "Total count of rate limit hits by total requests",
    }),
  };
}
