"use strict";

import { nextTick } from "async/nextTick";
import { debug } from "debug";
import { dgram } from "dgram";
import { EventEmitter } from "events";
import { KadDHT } from "libp2p-kad-dht";
import { multiaddr } from "multiaddr";
import { PeerId } from "peer-id";
import { PeerInfo } from "peer-info";
const log = debug("discv5");

public interface IDiscv5Opts {
  peerInfo: PeerInfo;
  broadcast?: boolean;
  interval?: number;
  port?: number;
  bootstrap?: PeerInfo[];
}

private interface IRemoteAddressInfo {
  address: string;
  family: string;
  port: number;
  size: number;
}

export class Discv5 extends EventEmitter {
  private options: Discv5Opts;
  private privKey: Buffer;
  private interval: number;
  private port: number;
  private bootstrap: PeerInfo[];
  private socket: dgram.Socket;
  private dht: KadDHT;
  private dhtOptions: DHTOpts;
  private lruOptions: LRUCacheOpts;
  private requests: Map;

  constructor(privKey: Buffer, options: Discv5Opts) {
    super();

    this.privKey = privKey;
    this.options = options;

    // in milliseconds
    this.interval = options.interval || 1000;

    // port to bind to
    this.port = options.port || 9000; // Arbitrary port for now, until more standardization

    // bootstrap nodes if they are given
    this.bootrap = options.bootstrap || [];

    // Create UDP socket and listen on this.port
    this.socket = dgram.createSocket("udp4");
    this.socket.bind(this.port);

    this.dhtOptions = {};
    this.dht = new KadDHT(options.switch, this.dhtOptions);

    this.requests = new Map();
  }

  public start(callback): void {
    // listen for peers connecting using UDP
    this.socket.on("listening", () => {
       // Get server's current address  and create ENR
       const address = this.socket.address();

       if (!this.dht.isStarted) {
           this.dht.start((err) => {
               this.dht.stop();
               this.emit("error", err);
           });
       }

       this.emit("listening");
    });

    this.socket.on("close", () => {
      this.stop();
    });

    this.socket.on("error", (err) => {
      this._handleError(err);
    });

    this.socket.on("message", (msg, rinfo) => {
      try {
        this._handler(msg, rinfo);
      } 
      catch {
        this.emit("error", err);
      }
    })

  }

  public async BootstrapPeer(peer: PeerInfo) {

  }

  public async stop (callback) : Promise < void > {
    // Stop bucket maintenance
    // Stop topic advertisement
    this.dht.stop();
    this.socket.close();
    this.emit("close");

  }

  private _handler(msg: Buffer, rinfo: RemoteAddressInfo) : void {
    log("msg received: " + msg.toString());
    log("msg size: " + msg.length);

  }

  private _handleError(err: Error): void {

  }

  private _send(peer: PeerInfo): void {

  }

  private _onPeer(peerInfo: PeerInfo) : void {
      // emit peer
  }
}
