import { Multiaddr, multiaddr, protocols } from "@multiformats/multiaddr";
import * as RLP from "@ethereumjs/rlp";
import { KeyType, PeerId, PrivateKey } from "@libp2p/interface";
import { convertToString, convertToBytes } from "@multiformats/multiaddr/convert";
import { encode as varintEncode } from "uint8-varint";

import { ERR_INVALID_ID, MAX_RECORD_SIZE } from "./constants.js";
import { ENRKey, ENRValue, SequenceNumber, NodeId } from "./types.js";
import { createPeerIdFromPublicKey } from "./peerId.js";
import { bytesToBigint, fromBase64url, toBase64url, toNewUint8Array } from "./util.js";
import { getV4Crypto } from "./crypto.js";
import { bytesToUtf8, equalsBytes, utf8ToBytes } from "ethereum-cryptography/utils.js";

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
  const id = bytesToUtf8(idBuf) as IDScheme;
  if (IDScheme[id] == null) {
    throw new Error("Unknown enr id scheme: " + id);
  }
  return id;
}

export function nodeId(id: IDScheme, publicKey: Uint8Array): NodeId {
  switch (id) {
    case IDScheme.v4:
      return getV4Crypto().nodeId(publicKey);
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
export function keyType(id: IDScheme): KeyType {
  switch (id) {
    case "v4":
      return "secp256k1";
    default:
      throw new Error(ERR_INVALID_ID);
  }
}

export function verify(id: IDScheme, data: Uint8Array, publicKey: Uint8Array, signature: Uint8Array): boolean {
  switch (id) {
    case IDScheme.v4:
      return getV4Crypto().verify(publicKey, data, signature);
    default:
      throw new Error(ERR_INVALID_ID);
  }
}
export function sign(id: IDScheme, data: Uint8Array, privateKey: Uint8Array): Uint8Array {
  switch (id) {
    case IDScheme.v4:
      return getV4Crypto().sign(privateKey, data);
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
    kvs.set(bytesToUtf8(k), v);
    signed.push(k, v);
  }

  const _id = id(kvs);
  if (!verify(_id, RLP.encode(signed), publicKey(_id, kvs), signature)) {
    throw new Error("Unable to verify enr signature");
  }
  return {
    kvs,
    seq: bytesToBigint(seq),
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
  return fromBase64url(encoded.slice(4));
}
export function decodeTxt(encoded: string): ENRData {
  return decode(txtToBuf(encoded));
}

// IP / Protocol

/** Protocols automagically supported by this library */
export type Protocol = "udp" | "tcp" | "quic" | "udp4" | "udp6" | "tcp4" | "tcp6" | "quic4" | "quic6";

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
    if (raw.length < 2) {
      throw new Error("Encoded protocol length should be 2");
    }
    return (raw[0] << 8) + raw[1];
  } else {
    return undefined;
  }
}

export function portToBuf(port: number): Uint8Array {
  const buf = new Uint8Array(2);
  buf[0] = port >> 8;
  buf[1] = port;
  return buf;
}

export function parseLocationMultiaddr(ma: Multiaddr): {
  family: 4 | 6;
  ip: Uint8Array;
  protoName: "udp" | "tcp" | "quic";
  protoVal: Uint8Array;
} {
  const protoNames = ma.protoNames();
  const tuples = ma.tuples();
  let family: 4 | 6;
  let protoName: "udp" | "tcp" | "quic";

  if (protoNames[0] === "ip4") {
    family = 4;
  } else if (protoNames[0] === "ip6") {
    family = 6;
  } else {
    throw new Error("Invalid multiaddr: must start with ip4 or ip6");
  }
  if (tuples[0][1] == null) {
    throw new Error("Invalid multiaddr: ip address is missing");
  }
  const ip = tuples[0][1];

  if (protoNames[1] === "udp") {
    protoName = "udp";
  } else if (protoNames[1] === "tcp") {
    protoName = "tcp";
  } else {
    throw new Error("Invalid multiaddr: must have udp or tcp protocol");
  }
  if (tuples[1][1] == null) {
    throw new Error("Invalid multiaddr: udp or tcp port is missing");
  }
  const protoVal = tuples[1][1];

  if (protoNames.length === 3) {
    if (protoNames[2] === "quic-v1") {
      if (protoName !== "udp") {
        throw new Error("Invalid multiaddr: quic protocol must be used with udp");
      }
      protoName = "quic";
    } else {
      throw new Error("Invalid multiaddr: unknown protocol");
    }
  } else if (protoNames.length > 2) {
    throw new Error("Invalid multiaddr: unknown protocol");
  }

  return { family, ip, protoName, protoVal };
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

  /** enr identity scheme */
  get id(): IDScheme {
    return id(this.kvs);
  }
  get keypairType(): KeyType {
    return keyType(this.id);
  }
  get peerId(): PeerId {
    return createPeerIdFromPublicKey(this.keypairType, this.publicKey);
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
  get quic(): number | undefined {
    return getProtocolValue(this.kvs, "quic");
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
  get quic6(): number | undefined {
    return getProtocolValue(this.kvs, "quic6");
  }
  getLocationMultiaddr(protocol: Protocol): Multiaddr | undefined {
    if (protocol === "udp") {
      return this.getLocationMultiaddr("udp4") || this.getLocationMultiaddr("udp6");
    }
    if (protocol === "tcp") {
      return this.getLocationMultiaddr("tcp4") || this.getLocationMultiaddr("tcp6");
    }
    if (protocol === "quic") {
      return this.getLocationMultiaddr("quic4") || this.getLocationMultiaddr("quic6");
    }
    const isIpv6 = protocol.endsWith("6");
    const ipVal = this.kvs.get(isIpv6 ? "ip6" : "ip");
    if (!ipVal) {
      return undefined;
    }

    const isUdp = protocol.startsWith("udp");
    const isTcp = protocol.startsWith("tcp");
    const isQuic = protocol.startsWith("quic");
    let protoName, protoVal;
    if (isUdp) {
      protoName = "udp";
      protoVal = isIpv6 ? this.kvs.get("udp6") : this.kvs.get("udp");
    } else if (isTcp) {
      protoName = "tcp";
      protoVal = isIpv6 ? this.kvs.get("tcp6") : this.kvs.get("tcp");
    } else if (isQuic) {
      protoName = "udp";
      protoVal = isIpv6 ? this.kvs.get("quic6") : this.kvs.get("quic");
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

    const ma = multiaddr(maBuf);
    if (isQuic) {
      return ma.encapsulate("/quic-v1");
    }
    return ma;
  }
  async getFullMultiaddr(protocol: Protocol): Promise<Multiaddr | undefined> {
    const locationMultiaddr = this.getLocationMultiaddr(protocol);
    if (locationMultiaddr) {
      const peerId = this.peerId;
      return locationMultiaddr.encapsulate(`/p2p/${peerId.toString()}`);
    }
  }

  // Serialization methods

  abstract encodeToValues(): (ENRKey | ENRValue | number)[];
  abstract encode(): Uint8Array;
  encodeTxt(): string {
    return "enr:" + toBase64url(this.encode());
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
    this.nodeId = nodeId(this.id, this.publicKey);
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

  get publicKey(): Uint8Array {
    return publicKey(this.id, this.kvs);
  }

  toObject(): ENRData {
    return {
      kvs: this.kvs,
      seq: this.seq,
      signature: this.signature,
    };
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
  public nodeId: NodeId;
  public publicKey: Uint8Array;
  public privateKey: Uint8Array;
  private _signature?: Uint8Array;

  constructor(
    kvs: ReadonlyMap<ENRKey, ENRValue> | Record<ENRKey, ENRValue> = {},
    seq: SequenceNumber = 1n,
    privateKey: Uint8Array,
    signature?: Uint8Array
  ) {
    super();
    this.kvs = new Map(kvs instanceof Map ? kvs.entries() : Object.entries(kvs));
    this.seq = seq;
    this.privateKey = privateKey;
    this.publicKey = publicKey(this.id, this.kvs);
    this.nodeId = nodeId(this.id, this.publicKey);
    this._signature = signature;

    if (this.id === IDScheme.v4) {
      if (!equalsBytes(getV4Crypto().publicKey(this.privateKey), this.publicKey)) {
        throw new Error("Provided keypair doesn't match kv pubkey");
      }
    }
  }

  static fromObject(obj: SignableENRData): SignableENR {
    const _id = id(obj.kvs);
    return new SignableENR(obj.kvs, obj.seq, obj.privateKey);
  }
  static createV4(privateKey: Uint8Array, kvs: Record<ENRKey, ENRValue> = {}): SignableENR {
    return new SignableENR(
      {
        ...kvs,
        id: utf8ToBytes("v4"),
        secp256k1: getV4Crypto().publicKey(privateKey),
      },
      BigInt(1),
      privateKey
    );
  }
  static createFromPrivateKey(privateKey: PrivateKey, kvs: Record<ENRKey, ENRValue> = {}): SignableENR {
    switch (privateKey.type) {
      case "secp256k1":
        return SignableENR.createV4(privateKey.raw, kvs);
      default:
        throw new Error();
    }
  }
  static decodeFromValues(encoded: Uint8Array[], privateKey: Uint8Array): SignableENR {
    const { kvs, seq, signature } = decodeFromValues(encoded);
    return new SignableENR(kvs, seq, privateKey, signature);
  }
  static decode(encoded: Uint8Array, privateKey: Uint8Array): SignableENR {
    const { kvs, seq, signature } = decode(encoded);
    return new SignableENR(kvs, seq, privateKey, signature);
  }
  static decodeTxt(encoded: string, privateKey: Uint8Array): SignableENR {
    const { kvs, seq, signature } = decodeTxt(encoded);
    return new SignableENR(kvs, seq, privateKey, signature);
  }

  get signature(): Uint8Array {
    if (!this._signature) {
      this._signature = sign(this.id, RLP.encode(encodeToValues(this.kvs, this.seq)), this.privateKey);
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

  get peerId(): PeerId {
    return createPeerIdFromPublicKey(this.keypairType, this.publicKey);
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
  get quic(): number | undefined {
    return getProtocolValue(this.kvs, "quic");
  }
  set quic(port: number | undefined) {
    if (port === undefined) {
      this.delete("quic");
    } else {
      this.set("quic", portToBuf(port));
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
  get quic6(): number | undefined {
    return getProtocolValue(this.kvs, "quic6");
  }
  set quic6(port: number | undefined) {
    if (port === undefined) {
      this.delete("quic6");
    } else {
      this.set("quic6", portToBuf(port));
    }
  }
  setLocationMultiaddr(multiaddr: Multiaddr): void {
    const { family, ip, protoName, protoVal } = parseLocationMultiaddr(multiaddr);

    if (family === 4) {
      this.set("ip", ip);
      this.set(protoName, protoVal);
    } else {
      this.set("ip6", ip);
      this.set(protoName + "6", protoVal);
    }
  }

  toObject(): SignableENRData {
    return {
      kvs: this.kvs,
      seq: this.seq,
      privateKey: this.privateKey,
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
