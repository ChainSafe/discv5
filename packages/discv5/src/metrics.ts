export interface MetricsRegister {
  gauge<Labels extends LabelsGeneric = NoLabels>(config: GaugeConfig<Labels>): Gauge<Labels>;
}

type GaugeConfig<Labels extends LabelsGeneric> = {
  name: string;
  help: string;
} & (NoLabels extends Labels ? { labelNames?: never } : { labelNames: [LabelKeys<Labels>, ...LabelKeys<Labels>[]] });

type NoLabels = Record<string, never>;
type LabelsGeneric = Record<string, string | number>;
type LabelKeys<Labels extends LabelsGeneric> = Extract<keyof Labels, string>;
interface Gauge<Labels extends LabelsGeneric = NoLabels> {
  inc: NoLabels extends Labels ? (value?: number) => void : (labels: Labels, value?: number) => void;
  set: NoLabels extends Labels ? (value: number) => void : (labels: Labels, value: number) => void;
  collect?(): void;
}

export interface IDiscv5Metrics {
  kadTableSize: Gauge;
  activeSessionCount: Gauge;
  connectedPeerCount: Gauge;
  lookupCount: Gauge;

  sentMessageCount: Gauge<{ type: string }>;
  rcvdMessageCount: Gauge<{ type: string }>;

  rateLimitHitIP: Gauge;
  rateLimitHitTotal: Gauge;
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
    sentMessageCount: register.gauge<{ type: string }>({
      name: "discv5_sent_message_count",
      help: "Count of the discv5 messages sent by message type",
      labelNames: ["type"],
    }),
    /** Total number messages received by message type */
    rcvdMessageCount: register.gauge<{ type: string }>({
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
