import { Multiaddr, protocols } from "@multiformats/multiaddr";
import base64url from "base64url";
import { toBigIntBE } from "bigint-buffer";
import * as RLP from "rlp";
import { PeerId } from "@libp2p/interfaces/peer-id";
import { convertToString, convertToBytes } from "@multiformats/multiaddr/convert";
import { encode as varintEncode } from "varint";

import { ERR_INVALID_ID, ERR_NO_SIGNATURE, MAX_RECORD_SIZE } from "./constants.js";
import * as v4 from "./v4.js";
import { ENRKey, ENRValue, SequenceNumber, NodeId } from "./types.js";
import {
  createKeypair,
  KeypairType,
  IKeypair,
  createPeerIdFromKeypair,
  createKeypairFromPeerId,
} from "../keypair/index.js";
import { toNewUint8Array } from "../util/index.js";

export class ENR extends Map<ENRKey, ENRValue> {
  public seq: SequenceNumber;
  public signature: Buffer | null;
  private _nodeId?: NodeId;

  constructor(kvs: Record<ENRKey, ENRValue> = {}, seq: SequenceNumber = 1n, signature: Buffer | null = null) {
    super(Object.entries(kvs));
    this.seq = seq;
    this.signature = signature;
  }
  static createV4(publicKey: Buffer, kvs: Record<ENRKey, ENRValue> = {}): ENR {
    return new ENR({
      ...kvs,
      id: Buffer.from("v4"),
      secp256k1: publicKey,
    });
  }
  static createFromPeerId(peerId: PeerId, kvs: Record<ENRKey, ENRValue> = {}): ENR {
    const keypair = createKeypairFromPeerId(peerId);
    switch (keypair.type) {
      case KeypairType.Secp256k1:
        return ENR.createV4(keypair.publicKey, kvs);
      default:
        throw new Error();
    }
  }
  static decodeFromValues(decoded: Buffer[]): ENR {
    if (!Array.isArray(decoded)) {
      throw new Error("Decoded ENR must be an array");
    }
    if (decoded.length % 2 !== 0) {
      throw new Error("Decoded ENR must have an even number of elements");
    }

    const [signature, seq] = decoded;
    if (!signature || Array.isArray(signature)) {
      throw new Error("Decoded ENR invalid signature: must be a byte array");
    }
    if (!seq || Array.isArray(seq)) {
      throw new Error("Decoded ENR invalid sequence number: must be a byte array");
    }

    const obj: Record<ENRKey, ENRValue> = {};
    const signed: Buffer[] = [seq];
    for (let i = 2; i < decoded.length; i += 2) {
      const k = decoded[i];
      const v = decoded[i + 1];
      obj[k.toString()] = Buffer.from(v);
      signed.push(k, v);
    }
    const enr = new ENR(obj, toBigIntBE(seq), signature);
    if (!enr.verify(RLP.encode(signed), signature)) {
      throw new Error("Unable to verify enr signature");
    }
    return enr;
  }
  static decode(encoded: Buffer): ENR {
    const decoded = RLP.decode(encoded) as unknown as Buffer[];
    return ENR.decodeFromValues(decoded);
  }
  static decodeTxt(encoded: string): ENR {
    if (!encoded.startsWith("enr:")) {
      throw new Error("string encoded ENR must start with 'enr:'");
    }
    return ENR.decode(base64url.toBuffer(encoded.slice(4)));
  }
  set(k: ENRKey, v: ENRValue): this {
    this.signature = null;
    this.seq++;
    if (k === "secp256k1" && this.id === "v4") {
      delete this._nodeId;
    }
    return super.set(k, v);
  }
  get id(): string {
    const id = this.get("id") as Buffer;
    if (!id) throw new Error("id not found.");
    return id.toString("utf8");
  }
  get keypairType(): KeypairType {
    switch (this.id) {
      case "v4":
        return KeypairType.Secp256k1;
      default:
        throw new Error(ERR_INVALID_ID);
    }
  }
  get publicKey(): Buffer {
    switch (this.id) {
      case "v4":
        return this.get("secp256k1") as Buffer;
      default:
        throw new Error(ERR_INVALID_ID);
    }
  }
  get keypair(): IKeypair {
    return createKeypair(this.keypairType, undefined, this.publicKey);
  }
  async peerId(): Promise<PeerId> {
    return createPeerIdFromKeypair(this.keypair);
  }
  get nodeId(): NodeId {
    if (this._nodeId) {
      return this._nodeId;
    }
    switch (this.id) {
      case "v4":
        return (this._nodeId = v4.nodeId(this.publicKey));
      default:
        throw new Error(ERR_INVALID_ID);
    }
  }

  get ip(): string | undefined {
    const raw = this.get("ip");
    if (raw) {
      return convertToString("ip4", toNewUint8Array(raw)) as string;
    } else {
      return undefined;
    }
  }

  set ip(ip: string | undefined) {
    if (ip) {
      this.set("ip", convertToBytes("ip4", ip));
    } else {
      this.delete("ip");
    }
  }

  get tcp(): number | undefined {
    const raw = this.get("tcp");
    if (raw) {
      return Number(convertToString("tcp", toNewUint8Array(raw)));
    } else {
      return undefined;
    }
  }

  set tcp(port: number | undefined) {
    if (port === undefined) {
      this.delete("tcp");
    } else {
      this.set("tcp", convertToBytes("tcp", String(port)));
    }
  }

  get udp(): number | undefined {
    const raw = this.get("udp");
    if (raw) {
      return Number(convertToString("udp", toNewUint8Array(raw)));
    } else {
      return undefined;
    }
  }

  set udp(port: number | undefined) {
    if (port === undefined) {
      this.delete("udp");
    } else {
      this.set("udp", convertToBytes("udp", String(port)));
    }
  }

  get ip6(): string | undefined {
    const raw = this.get("ip6");
    if (raw) {
      return convertToString("ip6", toNewUint8Array(raw)) as string;
    } else {
      return undefined;
    }
  }

  set ip6(ip: string | undefined) {
    if (ip) {
      this.set("ip6", convertToBytes("ip6", ip));
    } else {
      this.delete("ip6");
    }
  }

  get tcp6(): number | undefined {
    const raw = this.get("tcp6");
    if (raw) {
      return Number(convertToString("tcp", toNewUint8Array(raw)));
    } else {
      return undefined;
    }
  }

  set tcp6(port: number | undefined) {
    if (port === undefined) {
      this.delete("tcp6");
    } else {
      this.set("tcp6", convertToBytes("tcp", String(port)));
    }
  }

  get udp6(): number | undefined {
    const raw = this.get("udp6");
    if (raw) {
      return Number(convertToString("udp", toNewUint8Array(raw)));
    } else {
      return undefined;
    }
  }

  set udp6(port: number | undefined) {
    if (port === undefined) {
      this.delete("udp6");
    } else {
      this.set("udp6", convertToBytes("udp", String(port)));
    }
  }

  getLocationMultiaddr(protocol: "udp" | "udp4" | "udp6" | "tcp" | "tcp4" | "tcp6"): Multiaddr | undefined {
    if (protocol === "udp") {
      return this.getLocationMultiaddr("udp4") || this.getLocationMultiaddr("udp6");
    }
    if (protocol === "tcp") {
      return this.getLocationMultiaddr("tcp4") || this.getLocationMultiaddr("tcp6");
    }
    const isIpv6 = protocol.endsWith("6");
    const ipVal = this.get(isIpv6 ? "ip6" : "ip");
    if (!ipVal) {
      return undefined;
    }

    const isUdp = protocol.startsWith("udp");
    const isTcp = protocol.startsWith("tcp");
    let protoName, protoVal;
    if (isUdp) {
      protoName = "udp";
      protoVal = isIpv6 ? this.get("udp6") : this.get("udp");
    } else if (isTcp) {
      protoName = "tcp";
      protoVal = isIpv6 ? this.get("tcp6") : this.get("tcp");
    } else {
      return undefined;
    }
    if (!protoVal) {
      return undefined;
    }

    // Create raw multiaddr buffer
    // multiaddr length is:
    //  1 byte for the ip protocol (ip4 or ip6)
    //  N bytes for the ip address
    //  1 or 2 bytes for the protocol as buffer (tcp or udp)
    //  2 bytes for the port
    const ipMa = protocols(isIpv6 ? "ip6" : "ip4");
    const ipByteLen = ipMa.size / 8;
    const protoMa = protocols(protoName);
    const protoBuf = varintEncode(protoMa.code);
    const maBuf = new Uint8Array(3 + ipByteLen + protoBuf.length);
    maBuf[0] = ipMa.code;
    maBuf.set(ipVal, 1);
    maBuf.set(protoBuf, 1 + ipByteLen);
    maBuf.set(protoVal, 1 + ipByteLen + protoBuf.length);

    return new Multiaddr(maBuf);
  }
  setLocationMultiaddr(multiaddr: Multiaddr): void {
    const protoNames = multiaddr.protoNames();
    if (protoNames.length !== 2 && protoNames[1] !== "udp" && protoNames[1] !== "tcp") {
      throw new Error("Invalid multiaddr");
    }
    const tuples = multiaddr.tuples();
    if (!tuples[0][1] || !tuples[1][1]) {
      throw new Error("Invalid multiaddr");
    }

    // IPv4
    if (tuples[0][0] === 4) {
      this.set("ip", tuples[0][1]);
      this.set(protoNames[1], tuples[1][1]);
    } else {
      this.set("ip6", tuples[0][1]);
      this.set(protoNames[1] + "6", tuples[1][1]);
    }
  }
  async getFullMultiaddr(protocol: "udp" | "udp4" | "udp6" | "tcp" | "tcp4" | "tcp6"): Promise<Multiaddr | undefined> {
    const locationMultiaddr = this.getLocationMultiaddr(protocol);
    if (locationMultiaddr) {
      const peerId = await this.peerId();
      return locationMultiaddr.encapsulate(`/p2p/${peerId.toString()}`);
    }
  }
  verify(data: Buffer, signature: Buffer): boolean {
    if (!this.get("id") || this.id !== "v4") {
      throw new Error(ERR_INVALID_ID);
    }
    if (!this.publicKey) {
      throw new Error("Failed to verify enr: No public key");
    }
    return v4.verify(this.publicKey, data, signature);
  }
  sign(data: Buffer, privateKey: Buffer): Buffer {
    switch (this.id) {
      case "v4":
        this.signature = v4.sign(privateKey, data);
        break;
      default:
        throw new Error(ERR_INVALID_ID);
    }
    return this.signature;
  }
  encodeToValues(privateKey?: Buffer): (ENRKey | ENRValue | number)[] {
    // sort keys and flatten into [k, v, k, v, ...]
    const content: Array<ENRKey | ENRValue | number> = Array.from(this.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((k) => [k, this.get(k)] as [ENRKey, ENRValue])
      .flat();
    content.unshift(Number(this.seq));
    if (privateKey) {
      content.unshift(this.sign(RLP.encode(content), privateKey));
    } else {
      if (!this.signature) {
        throw new Error(ERR_NO_SIGNATURE);
      }
      content.unshift(this.signature);
    }
    return content;
  }
  encode(privateKey?: Buffer): Buffer {
    const encoded = RLP.encode(this.encodeToValues(privateKey));
    if (encoded.length >= MAX_RECORD_SIZE) {
      throw new Error("ENR must be less than 300 bytes");
    }
    return encoded;
  }
  encodeTxt(privateKey?: Buffer): string {
    return "enr:" + base64url.encode(Buffer.from(this.encode(privateKey)));
  }
}
