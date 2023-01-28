import { Multiaddr, multiaddr, protocols } from "@multiformats/multiaddr";
import base64url from "base64url";
import { toBigIntBE } from "bigint-buffer";
import * as RLP from "rlp";
import { PeerId } from "@libp2p/interface-peer-id";
import { convertToString, convertToBytes } from "@multiformats/multiaddr/convert";
import { encode as varintEncode } from "varint";

import { ERR_INVALID_ID, MAX_RECORD_SIZE } from "./constants.js";
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

/** ENR identity scheme */
export enum IDScheme {
  v4 = "v4",
}

/** Raw data included in an ENR */
export type ENRData = {
  kvs: ReadonlyMap<ENRKey, ENRValue>;
  seq: SequenceNumber;
  signature: Uint8Array;
};

/** Raw data included in a read+write ENR */
export type SignableENRData = {
  kvs: ReadonlyMap<ENRKey, ENRValue>;
  seq: SequenceNumber;
  privateKey: Uint8Array;
};

export function id(kvs: ReadonlyMap<ENRKey, ENRValue>): IDScheme {
  const idBuf = kvs.get("id");
  if (!idBuf) throw new Error("id not found");
  const id = Buffer.from(idBuf).toString("utf8") as IDScheme;
  if (IDScheme[id] == null) {
    throw new Error("Unknown enr id scheme: " + id);
  }
  return id;
}

export function nodeId(id: IDScheme, publicKey: Buffer): NodeId {
  switch (id) {
    case IDScheme.v4:
      return v4.nodeId(publicKey);
    default:
      throw new Error(ERR_INVALID_ID);
  }
}
export function publicKey(id: IDScheme, kvs: ReadonlyMap<ENRKey, ENRValue>): Uint8Array {
  switch (id) {
    case IDScheme.v4: {
      const pubkey = kvs.get("secp256k1");
      if (!pubkey) {
        throw new Error("Pubkey doesn't exist");
      }
      return pubkey;
    }
    default:
      throw new Error(ERR_INVALID_ID);
  }
}
export function keypairType(id: IDScheme): KeypairType {
  switch (id) {
    case "v4":
      return KeypairType.Secp256k1;
    default:
      throw new Error(ERR_INVALID_ID);
  }
}

export function verify(id: IDScheme, data: Uint8Array, publicKey: Buffer, signature: Uint8Array): boolean {
  switch (id) {
    case IDScheme.v4:
      return v4.verify(publicKey, Buffer.from(data), Buffer.from(signature));
    default:
      throw new Error(ERR_INVALID_ID);
  }
}
export function sign(id: IDScheme, data: Uint8Array, privateKey: Buffer): Buffer {
  switch (id) {
    case IDScheme.v4:
      return v4.sign(privateKey, Buffer.from(data));
    default:
      throw new Error(ERR_INVALID_ID);
  }
}

export function encodeToValues(
  kvs: ReadonlyMap<ENRKey, ENRValue>,
  seq: SequenceNumber,
  signature?: Uint8Array
): (ENRKey | ENRValue | number)[] {
  // sort keys and flatten into [k, v, k, v, ...]
  const content: Array<ENRKey | ENRValue | number> = Array.from(kvs.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((k) => [k, kvs.get(k)] as [ENRKey, ENRValue])
    .flat();
  content.unshift(Number(seq));
  if (signature) {
    content.unshift(signature);
  }
  return content;
}

export function encode(kvs: ReadonlyMap<ENRKey, ENRValue>, seq: SequenceNumber, signature: Uint8Array): Uint8Array {
  const encoded = RLP.encode(encodeToValues(kvs, seq, signature));
  if (encoded.length >= MAX_RECORD_SIZE) {
    throw new Error("ENR must be less than 300 bytes");
  }
  return encoded;
}

export function decodeFromValues(decoded: Uint8Array[]): ENRData {
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

  const kvs = new Map<ENRKey, ENRValue>();
  const signed: Uint8Array[] = [seq];
  for (let i = 2; i < decoded.length; i += 2) {
    const k = decoded[i];
    const v = decoded[i + 1];
    kvs.set(k.toString(), v);
    signed.push(k, v);
  }
  const _id = id(kvs);
  if (!verify(_id, RLP.encode(signed), Buffer.from(publicKey(_id, kvs)), signature)) {
    throw new Error("Unable to verify enr signature");
  }
  return {
    kvs,
    seq: toBigIntBE(Buffer.from(seq)),
    signature,
  };
}
export function decode(encoded: Uint8Array): ENRData {
  return decodeFromValues(RLP.decode(encoded) as Uint8Array[]);
}
export function txtToBuf(encoded: string): Uint8Array {
  if (!encoded.startsWith("enr:")) {
    throw new Error("string encoded ENR must start with 'enr:'");
  }
  return base64url.toBuffer(encoded.slice(4));
}
export function decodeTxt(encoded: string): ENRData {
  return decode(txtToBuf(encoded));
}

// IP / Protocol

export type Protocol = "udp" | "tcp" | "udp4" | "udp6" | "tcp4" | "tcp6";

export function getIPValue(kvs: ReadonlyMap<ENRKey, ENRValue>, key: string, multifmtStr: string): string | undefined {
  const raw = kvs.get(key);
  if (raw) {
    return convertToString(multifmtStr, toNewUint8Array(raw)) as string;
  } else {
    return undefined;
  }
}

export function getProtocolValue(kvs: ReadonlyMap<ENRKey, ENRValue>, key: string): number | undefined {
  const raw = kvs.get(key);
  if (raw) {
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    return view.getUint16(0);
  } else {
    return undefined;
  }
}

export function portToBuf(port: number): Uint8Array {
  const buf = new Uint8Array(2);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  view.setUint16(0, port);
  return buf;
}

// Classes

export abstract class BaseENR {
  /** Raw enr key-values */
  public abstract kvs: ReadonlyMap<ENRKey, ENRValue>;
  /** Sequence number */
  public abstract seq: SequenceNumber;
  public abstract signature: Uint8Array;

  // Identity methods

  /** Node identifier */
  public abstract nodeId: NodeId;
  public abstract publicKey: Uint8Array;
  public abstract keypair: IKeypair;

  /** enr identity scheme */
  get id(): IDScheme {
    return id(this.kvs);
  }
  get keypairType(): KeypairType {
    return keypairType(this.id);
  }
  async peerId(): Promise<PeerId> {
    return createPeerIdFromKeypair(this.keypair);
  }

  // Network methods

  get ip(): string | undefined {
    return getIPValue(this.kvs, "ip", "ip4");
  }
  get tcp(): number | undefined {
    return getProtocolValue(this.kvs, "tcp");
  }
  get udp(): number | undefined {
    return getProtocolValue(this.kvs, "udp");
  }
  get ip6(): string | undefined {
    return getIPValue(this.kvs, "ip6", "ip6");
  }
  get tcp6(): number | undefined {
    return getProtocolValue(this.kvs, "tcp6");
  }
  get udp6(): number | undefined {
    return getProtocolValue(this.kvs, "udp6");
  }
  getLocationMultiaddr(protocol: Protocol): Multiaddr | undefined {
    if (protocol === "udp") {
      return this.getLocationMultiaddr("udp4") || this.getLocationMultiaddr("udp6");
    }
    if (protocol === "tcp") {
      return this.getLocationMultiaddr("tcp4") || this.getLocationMultiaddr("tcp6");
    }
    const isIpv6 = protocol.endsWith("6");
    const ipVal = this.kvs.get(isIpv6 ? "ip6" : "ip");
    if (!ipVal) {
      return undefined;
    }

    const isUdp = protocol.startsWith("udp");
    const isTcp = protocol.startsWith("tcp");
    let protoName, protoVal;
    if (isUdp) {
      protoName = "udp";
      protoVal = isIpv6 ? this.kvs.get("udp6") : this.kvs.get("udp");
    } else if (isTcp) {
      protoName = "tcp";
      protoVal = isIpv6 ? this.kvs.get("tcp6") : this.kvs.get("tcp");
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

    return multiaddr(maBuf);
  }
  async getFullMultiaddr(protocol: Protocol): Promise<Multiaddr | undefined> {
    const locationMultiaddr = this.getLocationMultiaddr(protocol);
    if (locationMultiaddr) {
      const peerId = await this.peerId();
      return locationMultiaddr.encapsulate(`/p2p/${peerId.toString()}`);
    }
  }

  // Serialization methods

  abstract encodeToValues(): (ENRKey | ENRValue | number)[];
  abstract encode(): Uint8Array;
  encodeTxt(): string {
    return "enr:" + base64url.encode(Buffer.from(this.encode()));
  }
}
/**
 * Ethereum Name Record
 *
 * https://eips.ethereum.org/EIPS/eip-778
 *
 * `ENR` is used to read serialized ENRs and may not be modified once created.
 */
export class ENR extends BaseENR {
  public kvs: ReadonlyMap<ENRKey, ENRValue>;
  public seq: SequenceNumber;
  public signature: Uint8Array;
  public nodeId: string;
  private encoded?: Uint8Array;

  constructor(
    kvs: ReadonlyMap<ENRKey, ENRValue> | Record<ENRKey, ENRValue>,
    seq: SequenceNumber,
    signature: Uint8Array,
    encoded?: Uint8Array
  ) {
    super();
    this.kvs = new Map(kvs instanceof Map ? kvs.entries() : Object.entries(kvs));
    this.seq = seq;
    this.signature = signature;
    this.nodeId = nodeId(this.id, Buffer.from(this.publicKey));
    this.encoded = encoded;
  }

  static fromObject(obj: ENRData): ENR {
    return new ENR(obj.kvs, obj.seq, obj.signature);
  }
  static decodeFromValues(encoded: Uint8Array[]): ENR {
    const { kvs, seq, signature } = decodeFromValues(encoded);
    return new ENR(kvs, seq, signature);
  }
  static decode(encoded: Uint8Array): ENR {
    const { kvs, seq, signature } = decode(encoded);
    return new ENR(kvs, seq, signature, encoded);
  }
  static decodeTxt(encoded: string): ENR {
    const encodedBuf = txtToBuf(encoded);
    const { kvs, seq, signature } = decode(encodedBuf);
    return new ENR(kvs, seq, signature, encodedBuf);
  }

  get keypair(): IKeypair {
    return createKeypair(this.keypairType, undefined, Buffer.from(this.publicKey));
  }
  get publicKey(): Uint8Array {
    return publicKey(this.id, this.kvs);
  }

  toObject(): ENRData {
    return {
      kvs: this.kvs,
      seq: this.seq,
      signature: this.signature,
    }
  }

  encodeToValues(): Uint8Array[] {
    return RLP.decode(this.encode()) as Uint8Array[];
  }
  encode(): Uint8Array {
    if (!this.encoded) {
      this.encoded = encode(this.kvs, this.seq, this.signature);
    }
    return this.encoded;
  }
}

/**
 * Ethereum Name Record
 *
 * https://eips.ethereum.org/EIPS/eip-778
 *
 * `SignableENR` is used to create and update ENRs.
 */
export class SignableENR extends BaseENR {
  public kvs: ReadonlyMap<ENRKey, ENRValue>;
  public seq: SequenceNumber;
  public keypair: IKeypair;
  public nodeId: NodeId;
  private _signature?: Uint8Array;

  constructor(
    kvs: ReadonlyMap<ENRKey, ENRValue> | Record<ENRKey, ENRValue> = {},
    seq: SequenceNumber = 1n,
    keypair: IKeypair,
    signature?: Uint8Array
  ) {
    super();
    this.kvs = new Map(kvs instanceof Map ? kvs.entries() : Object.entries(kvs));
    this.seq = seq;
    this.keypair = keypair;
    this.nodeId = nodeId(this.id, Buffer.from(this.publicKey));
    this._signature = signature;

    if (!this.keypair.publicKey.equals(publicKey(this.id, this.kvs))) {
      throw new Error("Provided keypair doesn't match kv pubkey");
    }
  }

  static fromObject(obj: SignableENRData): SignableENR {
    const _id = id(obj.kvs);
    return new SignableENR(obj.kvs, obj.seq, createKeypair(keypairType(_id), Buffer.from(obj.privateKey), Buffer.from(publicKey(_id, obj.kvs))));
  }
  static createV4(keypair: IKeypair, kvs: Record<ENRKey, ENRValue> = {}): SignableENR {
    return new SignableENR(
      {
        ...kvs,
        id: Buffer.from("v4"),
        secp256k1: keypair.publicKey,
      },
      BigInt(1),
      keypair
    );
  }
  static createFromPeerId(peerId: PeerId, kvs: Record<ENRKey, ENRValue> = {}): SignableENR {
    const keypair = createKeypairFromPeerId(peerId);
    switch (keypair.type) {
      case KeypairType.Secp256k1:
        return SignableENR.createV4(keypair, kvs);
      default:
        throw new Error();
    }
  }
  static decodeFromValues(encoded: Uint8Array[], keypair: IKeypair): SignableENR {
    const { kvs, seq, signature } = decodeFromValues(encoded);
    return new SignableENR(kvs, seq, keypair, signature);
  }
  static decode(encoded: Uint8Array, keypair: IKeypair): SignableENR {
    const { kvs, seq, signature } = decode(encoded);
    return new SignableENR(kvs, seq, keypair, signature);
  }
  static decodeTxt(encoded: string, keypair: IKeypair): SignableENR {
    const { kvs, seq, signature } = decodeTxt(encoded);
    return new SignableENR(kvs, seq, keypair, signature);
  }

  get signature(): Uint8Array {
    if (!this._signature) {
      this._signature = sign(this.id, RLP.encode(encodeToValues(this.kvs, this.seq)), this.keypair.privateKey);
    }
    return this._signature;
  }
  set(k: ENRKey, v: ENRValue): void {
    if (k === "secp256k1" && this.id === "v4") {
      throw new Error("Unable to update `secp256k1` value");
    }
    // cache invalidation on any mutation
    this._signature = undefined;
    this.seq++;
    (this.kvs as Map<ENRKey, ENRValue>).set(k, v);
  }
  delete(k: ENRKey): boolean {
    if (k === "secp256k1" && this.id === "v4") {
      throw new Error("Unable to update `secp256k1` value");
    }
    // cache invalidation on any mutation
    this._signature = undefined;
    this.seq++;
    return (this.kvs as Map<ENRKey, ENRValue>).delete(k);
  }

  // Identity methods

  get publicKey(): Buffer {
    return this.keypair.publicKey;
  }
  async peerId(): Promise<PeerId> {
    return createPeerIdFromKeypair(this.keypair);
  }

  // Network methods

  get ip(): string | undefined {
    return getIPValue(this.kvs, "ip", "ip4");
  }
  set ip(ip: string | undefined) {
    if (ip) {
      this.set("ip", convertToBytes("ip4", ip));
    } else {
      this.delete("ip");
    }
  }
  get tcp(): number | undefined {
    return getProtocolValue(this.kvs, "tcp");
  }
  set tcp(port: number | undefined) {
    if (port === undefined) {
      this.delete("tcp");
    } else {
      this.set("tcp", portToBuf(port));
    }
  }
  get udp(): number | undefined {
    return getProtocolValue(this.kvs, "udp");
  }
  set udp(port: number | undefined) {
    if (port === undefined) {
      this.delete("udp");
    } else {
      this.set("udp", portToBuf(port));
    }
  }
  get ip6(): string | undefined {
    return getIPValue(this.kvs, "ip6", "ip6");
  }
  set ip6(ip: string | undefined) {
    if (ip) {
      this.set("ip6", convertToBytes("ip6", ip));
    } else {
      this.delete("ip6");
    }
  }
  get tcp6(): number | undefined {
    return getProtocolValue(this.kvs, "tcp6");
  }
  set tcp6(port: number | undefined) {
    if (port === undefined) {
      this.delete("tcp6");
    } else {
      this.set("tcp6", portToBuf(port));
    }
  }
  get udp6(): number | undefined {
    return getProtocolValue(this.kvs, "udp6");
  }
  set udp6(port: number | undefined) {
    if (port === undefined) {
      this.delete("udp6");
    } else {
      this.set("udp6", portToBuf(port));
    }
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

  toObject(): SignableENRData {
    return {
      kvs: this.kvs,
      seq: this.seq,
      privateKey: new Uint8Array(this.keypair.privateKey),
    };
  }
  encodeToValues(): (string | number | Uint8Array)[] {
    return encodeToValues(this.kvs, this.seq, this.signature);
  }
  encode(): Uint8Array {
    return encode(this.kvs, this.seq, this.signature);
  }

  toENR(): ENR {
    return new ENR(this.kvs, this.seq, this.signature, this.encode());
  }
}
