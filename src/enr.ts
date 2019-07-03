import { RLP } from "rlp";
import { Buffer } from "types/Buffer";

// Constants in bytes
const MAX_RECORD_SIZE: number = 300;
const SEQUENCE_SIZE: number = 8;

/*
 * Implementation of an Ethereum Node Record (ENR) as defined in EIP 778
 * */
export class EthereumNodeRecord {

  public signature: Buffer;
  public sequence: bigint;
  public keyPairs: Map<string, string>;

  private privKey: Buffer;

  /**
   * constructor
   * @param Buffer sign
   * @param number seq
   * @param Array<Array<string>> kp
   */
  constructor(
     privateKey,
     sign: Buffer = Buffer.from,
     seq: bigint = BigInt(0),
     kp: string[][] = [
       ["id", "v4"], ["secp256k1", ""], ["ip", ""], ["tcp", ""], ["udp", ""]     ],
   ) {
     this.signature = sign;
     this.sequence = seq;
     this.keyPairs = new Map(Object.assign([], kp));
     this.privKey = privateKey;
  }

  /**
   * Returns a RLP encoding of an ENR
   */
  public encode(): any[] {
    const content = [
      RLP.encode(this.sequence),
      "id", this.keyPairs.get("id"),
      "secp256k1", RLP.encode(this.keyPairs.get("secp256k1")),
      "ip", RLP.encode(this.keyPairs.get("ip")),
      "tcp", RLP.encode(this.keyPairs.get("tcp")),
      "udp", RLP.encode(this.keyPairs.get("udp")),
    ];
    this.signature = IdentityScheme.sign(content, this.privKey);
    const totalSize = content.length + this.signature.length;
    if (totalSize > MAX_RECORD_SIZE) {
      // reject record
      throw new RangeError("Size of the record is larger than 300 bytes. It's size is " + totalSize);
    }
    const record = [RLP.encode(this.signature)].concat(content);
    return record;
  }

  /**
   * Returns a text encoding of an RLP-encoded ENR
   */
  public encodeTxt(): string {
    const record = this.encode();
    return "enr:" + Buffer.from(record).toString("base64");
  }

  /**
   * Changes the sequence number of an ENR
   *
   * @param number newSeq
   */
  public changeSeqNum(newSeq): void {
    this.sequence = BigInt(newSeq);
  }

  /**
   * Sets key value pairs as specified in the ENR spec
   *
   * @param Array<Array<string>> keyValPairs
   */
  public setNewKeyValPairs(keyValPairs): void {
     keyValPairs.forEach((key, val) => {
       this.keyPairs.set(key, val);
     });
  }
}
