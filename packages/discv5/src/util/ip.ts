import type {BaseENR, SignableENR} from "@chainsafe/enr";
import {type Multiaddr, multiaddr} from "@multiformats/multiaddr";
import type {IPMode} from "../transport/types.js";

export type Ip = {type: 4 | 6; octets: Uint8Array};
export type SocketAddress = {
  ip: Ip;
  port: number;
};

export function ipFromBytes(bytes: Uint8Array): Ip | undefined {
  // https://github.com/sigp/discv5/blob/517eb3f0c5e5b347d8fe6c2973e1698f89e83524/src/rpc.rs#L429
  switch (bytes.length) {
    case 4:
      return {octets: bytes, type: 4};
    case 16:
      return {octets: bytes, type: 6};
    default:
      return undefined;
  }
}

export function ipToBytes(ip: Ip): Uint8Array {
  return ip.octets;
}

export function isEqualSocketAddress(s1: SocketAddress, s2: SocketAddress): boolean {
  if (s1.ip.type !== s2.ip.type) {
    return false;
  }
  for (let i = 0; i < s1.ip.octets.length; i++) {
    if (s1.ip.octets[i] !== s2.ip.octets[i]) {
      return false;
    }
  }
  return s1.port === s2.port;
}

export function getSocketAddressMultiaddrOnENR(enr: BaseENR, ipMode: IPMode): Multiaddr | undefined {
  if (ipMode.ip6) {
    const multiaddr = enr.getLocationMultiaddr("udp6");
    if (multiaddr) return multiaddr;
  }
  if (ipMode.ip4) {
    const multiaddr = enr.getLocationMultiaddr("udp4");
    if (multiaddr) return multiaddr;
  }
}

export function getSocketAddressOnENRByFamily(enr: BaseENR, family: 4 | 6): SocketAddress | undefined {
  const ipOctets = enr.kvs.get(family === 4 ? "ip" : "ip6");
  const port = family === 4 ? enr.udp : enr.udp6;
  if (ipOctets === undefined || port === undefined) {
    return undefined;
  }

  const ip = ipFromBytes(ipOctets);
  if (ip === undefined || ip.type !== family) {
    return undefined;
  }

  return {ip, port};
}

export function getSocketAddressOnENR(enr: BaseENR, ipMode: IPMode): SocketAddress | undefined {
  if (ipMode.ip6) {
    const socketAddr = getSocketAddressOnENRByFamily(enr, 6);
    if (socketAddr) return socketAddr;
  }
  if (ipMode.ip4) {
    const socketAddr = getSocketAddressOnENRByFamily(enr, 4);
    if (socketAddr) return socketAddr;
  }
  return undefined;
}

export function setSocketAddressOnENR(enr: SignableENR, s: SocketAddress): void {
  switch (s.ip.type) {
    case 4:
      enr.set("ip", s.ip.octets);
      enr.udp = s.port;
      break;
    case 6:
      enr.set("ip6", s.ip.octets);
      enr.udp6 = s.port;
      break;
  }
}

// Protocols https://github.com/multiformats/multiaddr/blob/master/protocols.csv
// code  size  name
// 4     32    ip4
// 41    128   ip6
// 273   16    udp
const PROTOCOL = {
  4: 4,
  6: 41,
  udp: 273,
} as const;

// varint.encode(Protocol.udp) === [ 145, 2 ]
const udpProto0 = 145;
const udpProto1 = 2;

export function multiaddrFromSocketAddress(s: SocketAddress): Multiaddr {
  // ipProto(1) + octets(4 or 16) + udpProto(2) + udpPort(2)
  const multiaddrBuf = new Uint8Array(s.ip.octets.length + 5);
  multiaddrBuf[0] = PROTOCOL[s.ip.type];
  multiaddrBuf.set(s.ip.octets, 1);
  multiaddrBuf[multiaddrBuf.length - 4] = udpProto0;
  multiaddrBuf[multiaddrBuf.length - 3] = udpProto1;
  multiaddrBuf[multiaddrBuf.length - 2] = s.port >> 8;
  multiaddrBuf[multiaddrBuf.length - 1] = s.port & 255;
  return multiaddr(multiaddrBuf);
}

export function multiaddrToSocketAddress(multiaddr: Multiaddr): SocketAddress {
  let ip: Ip | undefined;
  let port: number | undefined;
  // Force cache population of bytes property to ensure getComponents() works correctly
  void multiaddr.bytes;
  for (const component of multiaddr.getComponents()) {
    switch (component.code) {
      case PROTOCOL["4"]:
        ip = {
          // biome-ignore lint/style/noNonNullAssertion: guaranteed with multiaddr.bytes access above
          octets: component.bytes!.slice(1), // remove varint prefix
          type: 4,
        };
        break;
      case PROTOCOL["6"]:
        ip = {
          // biome-ignore lint/style/noNonNullAssertion: guaranteed with multiaddr.bytes access above
          octets: component.bytes!.slice(1), // remove varint prefix
          type: 6,
        };
        break;
      case PROTOCOL.udp: {
        port = Number(component.value);
        break;
      }
    }
  }
  if (ip === undefined) {
    throw Error("multiaddr does not have ip4 or ip6 protocols");
  }
  if (port === undefined) {
    throw Error("multiaddr does not have udp protocol");
  }
  return {
    ip,
    port,
  };
}

export type MultiaddrObject = {
  family: number;
  host: string;
  port: number;
};

export function multiaddrToObject(addr: Multiaddr): MultiaddrObject {
  const components = addr.getComponents();
  const ipComponent = components.at(0);
  const transportComponent = components.at(1);
  if (!ipComponent || !transportComponent) {
    throw new Error("Invalid multiaddr format for transport bind address");
  }
  if (ipComponent.name !== "ip4" && ipComponent.name !== "ip6") {
    throw new Error("Local multiaddr must use IPv4 or IPv6");
  }
  if (ipComponent.value === undefined) {
    throw new Error("IP component of multiaddr must have a value");
  }
  if (transportComponent.name !== "udp") {
    throw new Error("Local multiaddr must use UDP");
  }
  if (transportComponent.value === undefined) {
    throw new Error("Transport component of multiaddr must have a value");
  }
  return {
    family: ipComponent.name === "ip4" ? 4 : 6,
    host: ipComponent.value,
    port: Number(transportComponent.value),
  };
}
