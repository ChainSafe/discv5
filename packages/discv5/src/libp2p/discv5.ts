import { PeerId } from "@libp2p/interface/peer-id";
import { PeerDiscovery, PeerDiscoveryEvents, peerDiscoverySymbol } from "@libp2p/interface/peer-discovery";
import { PeerInfo } from "@libp2p/interface/peer-info";
import { CustomEvent, TypedEventEmitter } from "@libp2p/interface/events";
import { Multiaddr, multiaddr } from "@multiformats/multiaddr";
import { ENR } from "@chainsafe/enr";

import { Discv5, ENRInput, SignableENRInput } from "../service/index.js";
import { IDiscv5Config } from "../config/index.js";
import { MetricsRegister } from "../metrics.js";
import { BindAddrs } from "../transport/types.js";

// Default to 0ms between automatic searches
// 0ms is 'backwards compatible' with the prior behavior (always be searching)
// Further analysis should be done to determine a good number
const DEFAULT_SEARCH_INTERVAL_MS = 0;

export interface IDiscv5DiscoveryInputOptions extends Partial<IDiscv5Config> {
  /**
   * Local ENR associated with the local libp2p peer id
   */
  enr: SignableENRInput;
  /**
   * The bind multiaddrs for the discv5 UDP server
   *
   * NOTE: These MUST be a udp multiaddrs
   */
  bindAddrs: {
    ip4?: string;
    ip6?: string;
  };
  /**
   * Remote ENRs used to bootstrap the network
   */
  bootEnrs: ENRInput[];
  /**
   * Amount of time in milliseconds to wait between lookups
   *
   * Set to Infinity to disable automatic lookups entirely
   *
   * Default value is 0 (no wait)
   */
  searchInterval?: number;
  /**
   * Optional metrics
   */
  metricsRegistry?: MetricsRegister;
  /**
   * Enable/disable discv5
   * Note: this option is handled within libp2p, not within discv5
   */
  enabled: boolean;
}

export interface IDiscv5DiscoveryOptions extends IDiscv5DiscoveryInputOptions {
  peerId: PeerId;
}

/**
 * Discv5Discovery is a libp2p peer-discovery compatible module
 */
export class Discv5Discovery extends TypedEventEmitter<PeerDiscoveryEvents> implements PeerDiscovery {
  [Symbol.toStringTag] = "discv5";
  [peerDiscoverySymbol] = this;

  public discv5: Discv5;
  public searchInterval: number;
  private started: NodeJS.Timer | boolean;
  private controller: AbortController;

  constructor(options: IDiscv5DiscoveryOptions) {
    super();
    this.discv5 = Discv5.create({
      enr: options.enr,
      peerId: options.peerId,
      bindAddrs: {
        ip4: options.bindAddrs.ip4 ? multiaddr(options.bindAddrs.ip4) : undefined,
        ip6: options.bindAddrs.ip6 ? multiaddr(options.bindAddrs.ip6) : undefined,
      } as BindAddrs,
      config: options,
      metricsRegistry: options.metricsRegistry,
    });
    this.searchInterval = options.searchInterval ?? DEFAULT_SEARCH_INTERVAL_MS;
    this.started = false;
    this.controller = new AbortController();
    options.bootEnrs.forEach((bootEnr) => this.discv5.addEnr(bootEnr));
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    this.controller = new AbortController();
    await this.discv5.start();
    this.discv5.on("discovered", this.handleEnr);
    setTimeout(() => this.findPeers(), 1);
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }
    this.started = false;
    this.discv5.off("discovered", this.handleEnr);
    await this.discv5.stop();
    this.controller.abort();
  }

  async findPeers(): Promise<void> {
    if (this.searchInterval === Infinity) return;
    while (this.started) {
      // Search for random nodes
      // emit discovered on all finds
      const enrs = await this.discv5.findRandomNode();
      if (!this.started) {
        return;
      }
      for (const enr of enrs) {
        await this.handleEnr(enr);
      }
      try {
        if (this.searchInterval === Infinity) return;
        await sleep(this.searchInterval, this.controller.signal);
      } catch (e) {
        return;
      }
    }
  }

  handleEnr = async (enr: ENR): Promise<void> => {
    const multiaddrTCP4 = enr.getLocationMultiaddr("tcp4");
    const multiaddrTCP6 = enr.getLocationMultiaddr("tcp6");
    const multiaddrs: Multiaddr[] = [];
    if (multiaddrTCP4) multiaddrs.push(multiaddrTCP4);
    if (multiaddrTCP6) multiaddrs.push(multiaddrTCP6);
    this.dispatchEvent(
      new CustomEvent<PeerInfo>("peer", {
        detail: {
          id: await enr.peerId(),
          multiaddrs,
        },
      })
    );
  };
}

/**
 * Abortable sleep function. Cleans everything on all cases preventing leaks
 * On abort throws Error
 */
async function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error());

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let onDone: () => void = () => {};

    const timeout = setTimeout(() => {
      onDone();
      resolve();
    }, ms);
    const onAbort = (): void => {
      onDone();
      reject(new Error());
    };
    signal.addEventListener("abort", onAbort);

    onDone = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
    };
  });
}
