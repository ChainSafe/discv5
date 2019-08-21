const RLP = require("rlp");
import { sha256 } from "js-sha256";
import { IdentityScheme} from "./identity_scheme";
import { DISCV5Constants } from "../constants"
import { PeerInfo } from "peer-info";
import { PeerId }from "peer-id";
import { multihash } from "multihashes";
import { ENRKeyPair } from "./enr_keypair";
import { NodeId } from "./enr_types";

/*
 * Implementation of an Ethereum Node Record (ENR) as defined in EIP 778
 * */
export class EthereumNodeRecord {

  public signature: Buffer;
  public sequence: bigint;
  public keyPairs: Map<string, any>;
  public nodeId: NodeId;
  public libp2pPeerInfo: PeerInfo;

  private enrKeyPair: ENRKeyPair;

  /**
   * constructor
   * @param ArrayLike<number> privateKey
   * @param Signature sign
   * @param number seq
   * @param Array<Array<string>> kp
   */
  constructor(enrKeyPair?: ENRKeyPair) {
     this.enrKeyPair = ENRKeyPair;
     this.keyPairs.set("secp256k1", this.enrKeyPair.compressedPublicKey());
     this.nodeId = IdentityScheme.derive(this.enrKeyPair.uncompressedPublicKey());

     let peerIdBuf = Buffer.from(sha256(this.keyPairs.get("secp256k1")), "hex");
     peerIdBuf = multihash.encode(peerIdBuf, "sha2-256")
     let peerId = new PeerId(peerIdBuf);
     this.libp2pPeerInfo = new PeerInfo(peerId);
  }

  /**
   * Returns a RLP encoding of an ENR
   */
  public encode(): Buffer {
    this.content = [
      RLP.encode(this.sequence),
      "id", this.keyPairs.get("id"),
    ];
    if (this.keyPairs.get("secp256k1")) {
       content.push("secp256k1", RLP.encode(this.keyPairs.get("secp256k1")));
    }
    
    if (this.keyPairs.get("ip")) {
      content.push("ip", RLP.encode(this.keyPairs.get("ip"))); 
    }

    if (this.keyPairs.get("tcp")) {
      content.push("tcp", RLP.encode(this.keyPairs.get("tcp")));
    }

    if (this.keyPairs.get("udp")) {
      content.push("udp", RLP.encode(this.keyPairs.get("udp")));
    }

    if (this.keyPairs.get("ip6")) {
      content.push("ip6", RLP.encode(this.keyPairs.get("ip6")));
    }

    if (this.keyPairs.get("tcp6")) {
      content.push("tcp6", RLP.encode(this.keyPairs.get("tcp6")));
    }

    if (this.keyPairs.get("udp6")) {
      content.push("udp6", RLP.encode(this.keyPairs.get("udp6")));
    }

    this.signature = IdentityScheme.sign(content, this.privKey);
    const totalSize = content.length + this.signature.length;
    if (totalSize > DISCV5Constants.MAX_RECORD_SIZE) {
      // reject record
      throw new RangeError("Size of the record is larger than 300 bytes. It's size is " + totalSize);
    }

    const record = RLP.encode([RLP.encode(this.signature)].concat(this.content));
    return record;
  }

  /**
   * Returns a text encoding of an RLP-encoded ENR
   */
  public encodeTxt(): string {
    const record = this.encode();
    return "enr:" + Buffer.from(record).toString("base64");
  }

  public static decode(record: Buffer): EthereumNodeRecord {
    let decodedRecord = RLP.decode(record);
    let enr = new EthereumNodeRecord();
    enr.signature(RLP.decode(decodedRecord[0]);
    enr.sequenceNumber(RLP.decode(decodedRecord[1]));
    enr.id(decodedRecord[2]);

    let indexOfCompPubKey = decodedRecord.indexOf("secp256k1");    
    if (indexOfCompPubKey !== -1) {
      let enrKeyPair: ENRKeyPair = new ENRKeyPair();
      enrKeyPair.compressedPublicKey(RLP.decode(decodedRecord[indexOfCompPubKey + 1]));
      enr.enrKeyPair = enrKeyPair;
    }

    let indexOfIp = decodedRecord.indexOf("ip");
    if (indexOfIp !== -1) {
       enr.ipV4(RLP.decode(decodedRecord[indexOfIp + 1]));
    }

    let indexOfTCP = decodedRecord.indexOf("tcp");
    if (indexOfTCP !== -1) {
       enr.tcp(RLP.decode(decodedRecord[indexOfTCP + 1]));
    }

    let indexOfUDP = decodedRecord.indexOf("udp");
    if (indexOfUDP !== -1) {
       enr.udp(RLP.decode(decodedRecord[indexOfUDP + 1]));
    }

    let indexOfIPv6 = decodedRecord.indexOf("ip6");
    if (indexOfIPv6 !== -1) {
      enr.ipV6(RLP.decode(decodedRecord[indexOfIpv6 + 1]));
    }

    let indexOfTCP6 = decodedRecord.indexOf("tcp6");
    if (indexOfTCP6 !== -1) {
      enr.tcp6(RLP.decode(decodedRecord[indexOfTCP6 + 1]));
    } 

    let indexOfUDP6 = decodedRecord.indexOf("udp6");
    if (indexOfUDP6 !== -1) {
      enr.udp6(RLP.decode(decodedRecord[indexOfUDP6 + 1]));
    }

    return enr;
  }

  // Getters 

  public get sequenceNumber(): bigint {
    return this.sequence;
  }

  public get signature(): Signature {
    return this.signature;  
  }

  public get keyPairs(): Map<string, any> {
    return this.keyPairs;
  }

  public get id(): string {
    return this.keyPairs.get("id");
  } 

  public get compressedPubKey(): string {
    return this.enrKeyPair.getCompressedPublicKey();  
  }

  public get uncompressedPubKey(): string {
    return this.enrKeyPair.getUncompressedPublicKey();
  }

  public get ipV4(): string {
    return this.keyPairs.get("ip");
  }

  public get tcp(): number {
    return this.keyPairs.get("tcp");
  }

  public get udp(): number {
    return this.keyPairs.get("udp");
  }

  public get ipV6(): string {
    return this.keyPairs.get("ip6");
  }

  public get tcp6(): number {
    return this.keyPairs.get("tcp6");
  }

  public get udp6(): number {
    return this.keyPairs.get("udp6");
  }

  public get nodeId(): NodeId {
    return this.nodeId;
  }

  public get libp2pPeerInfo(): PeerInfo {
    return this.libp2pPeerInfo;
  }

  // Setters

  public set id(i: string): void {
    this.keyPairs.set("id", i);
  }

  public set sequenceNumber(seq: bigint): void {
    this.sequence = seq;
  }

  public set signature(sig: Signature): void {
    this.signature = sig;
  } 

  public set ENRKeyPair(newEnrKeyPair: ENRKeyPair): void {
     this.enrKeyPair = newEnrKeyPair;
      // this.nodeId = IdentityScheme.derive(this.enrKeyPair.uncompressedPublicKey());
  }

  public set ipV4(ipAddr: string): void {
     this.keyPairs.set("ip", ipAddr);
  }

  public set ipV6(ipAddr: string): void {
     this.keyPairs.set("ip6", ipAddr);
  }

  public set tcp(port: number): void {
     this.keyPairs.set("tcp", port);
  }

  public set udp(port: number): void {
     this.keyPairs.set("udp", port);
  }

  public set tcp6(port: number): void {
     this.keyPairs.set("tcp6", port);
  }

  public set udp6(port: number): void {
     this.keyPairs.set("udp6", port);
  }
}
