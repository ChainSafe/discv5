import { sha256 } from "js-sha256";
import { multihash } from "multihashes";
import { PeerId } from "peer-id";
import { PeerInfo } from "peer-info";
import RLP from "rlp";
import * as constants from "../constants";
import { ENRKeyPair } from "./enr_keypair";
import { NodeId } from "./enr_types";

/*
 * Implementation of an Ethereum Node Record (ENR) as defined in EIP 778
 * */
export class EthereumNodeRecord {

  public signature: Buffer;
  public sequence: bigint;
  public content: Map<string, any>;
  public nodeId: NodeId;
  public libp2pPeerInfo: PeerInfo;

  private enrKeyPair: ENRKeyPair;

  /**
   * constructor
   */
  constructor(enrKeyPair?: ENRKeyPair) {
     this.enrKeyPair = new ENRKeyPair();
     this.content.set("secp256k1", this.enrKeyPair.compressedPublicKey.toString());
     this.nodeId = this.enrKeyPair.derive();

     let peerIdBuf = Buffer.from(sha256(this.content.get("secp256k1")), "hex");
     peerIdBuf = multihash.encode(peerIdBuf, "sha2-256");
     const peerId = new PeerId(peerIdBuf);
     this.libp2pPeerInfo = new PeerInfo(peerId);
  }

  /**
   * Returns a RLP encoding of an ENR
   */
  public encode(): Buffer {
    const rlpArray = [
      RLP.encode(this.sequence),
      "id", this.content.get("id"),
    ];

    ["secp256k1", "ip", "tcp", "udp", "tcp6", "udp6"].forEach((key) => {
      if (this.content.get(key)) {
        rlpArray.push(key, RLP.encode(this.content.get(key)));
      }
    });

    this.signature = this.enrKeyPair.sign(Buffer.from(rlpArray));
    const totalSize = rlpArray.length + this.signature.length;
    if (totalSize > constants.MAX_RECORD_SIZE) {
      // reject record
      throw new RangeError("Size of the record is larger than 300 bytes. It's size is " + totalSize);
    }

    const record = RLP.encode([RLP.encode(this.signature)].concat(rlpArray));
    return record;
  }

  /**
   * Returns a text encoding of an RLP-encoded ENR
   */
  public encodeTxt(): string {
    const record = this.encode();
    return "enr:" + Buffer.from(record).toString("base64");
  }

  public decode(record: Buffer): EthereumNodeRecord {
    const decodedRecord = RLP.decode(record);
    const enr = new EthereumNodeRecord();
    enr.signature = RLP.decode(decodedRecord[0]);
    enr.sequence = RLP.decode(decodedRecord[1]);
    enr.id = decodedRecord[2];

    ["secp256k1", "ip", "tcp", "udp", "tcp6", "udp6"].forEach((key) => {
      const indexOfKey = decodedRecord.indexOf(key);
      if (indexOfKey !== -1) {
        enr.content.set(key, RLP.decode(decodedRecord[indexOfKey + 1]));
      }
    });

    return enr;
  }

  // Getters and Setters

  public set sequence(seq: bigint): void {
    this.sequence = seq;
  }

  public get sequence(): bigint {
    return this.sequence;
  }

  public set signature(sig: Buffer): void {
    this.signature = sig;
  }

  public get signature(): Buffer {
    return this.signature;
  }

  public get content(): Map<string, any> {
    return this.content;
  }

  public set id(i: string): void {
    this.content.set("id", i);
  }

  public get id(): string {
    return this.content.get("id");
  }

  public get compressedPubKey(): Buffer {
    return this.enrKeyPair.compressedPublicKey;
  }

  public get uncompressedPubKey(): Buffer {
    return this.enrKeyPair.uncompressedPublicKey;
  }

  public set ipV4(ipAddr: string): void {
     this.content.set("ip", ipAddr);
  }

  public get ipV4(): string {
    return this.content.get("ip");
  }

  public set tcp(port: number): void {
     this.content.set("tcp", port);
  }

  public get tcp(): number {
    return this.content.get("tcp");
  }

  public set udp(port: number): void {
     this.content.set("udp", port);
  }

  public get udp(): number {
    return this.content.get("udp");
  }

  public set ipV6(ipAddr: string): void {
     this.content.set("ip6", ipAddr);
  }

  public get ipV6(): string {
    return this.content.get("ip6");
  }

  public set tcp6(port: number): void {
     this.content.set("tcp6", port);
  }

  public get tcp6(): number {
    return this.content.get("tcp6");
  }

  public set udp6(port: number): void {
     this.content.set("udp6", port);
  }

  public get udp6(): number {
    return this.content.get("udp6");
  }

  public get nodeId(): NodeId {
    return this.nodeId;
  }

  public get libp2pPeerInfo(): PeerInfo {
    return this.libp2pPeerInfo;
  }

  public set enrKeyPair(newEnrKeyPair: ENRKeyPair): void {
     this.enrKeyPair = newEnrKeyPair;
  }
}
