import { multiaddr, Multiaddr } from "@multiformats/multiaddr";
import { ENR } from "../enr/index.js";

export type IP = { type: 4 | 6; octets: Uint8Array };
export type SocketAddress = {
  ip: IP;
  port: number;
};

export function ipFromBytes(bytes: Uint8Array): IP | undefined {
  // https://github.com/sigp/discv5/blob/517eb3f0c5e5b347d8fe6c2973e1698f89e83524/src/rpc.rs#L429
  switch (bytes.length) {
    case 4:
      return { type: 4, octets: bytes };
    case 16:
      return { type: 6, octets: bytes };
    default:
      return undefined;
  }
}

export function ipToBytes(ip: IP): Uint8Array {
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

export function getSocketAddressOnENR(enr: ENR): SocketAddress | undefined {
  const ip4Octets = enr.get("ip");
  const udp4 = enr.udp;
  if (ip4Octets !== undefined && udp4 !== undefined) {
    const ip = ipFromBytes(ip4Octets);
    if (ip !== undefined) {
      return {
        ip,
        port: udp4,
      };
    }
  }

  const ip6Octets = enr.get("ip6");
  const udp6 = enr.udp6;
  if (ip6Octets !== undefined && udp6 !== undefined) {
    const ip = ipFromBytes(ip6Octets);
    if (ip !== undefined) {
      return {
        ip,
        port: udp6,
      };
    }
  }
}

export function setSocketAddressOnENR(enr: ENR, s: SocketAddress): void {
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
const Protocol = {
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
  multiaddrBuf[0] = Protocol[s.ip.type];
  multiaddrBuf.set(s.ip.octets, 1);
  multiaddrBuf[multiaddrBuf.length - 4] = udpProto0;
  multiaddrBuf[multiaddrBuf.length - 3] = udpProto1;
  multiaddrBuf[multiaddrBuf.length - 2] = s.port >> 8;
  multiaddrBuf[multiaddrBuf.length - 1] = s.port & 255;
  return multiaddr(multiaddrBuf);
}

export function multiaddrToSocketAddress(multiaddr: Multiaddr): SocketAddress {
  let ip: IP | undefined;
  let port: number | undefined;
  for (const tuple of multiaddr.tuples()) {
    switch (tuple[0]) {
      case Protocol["4"]:
        ip = { type: 4, octets: tuple[1]! };
        break;
      case Protocol["6"]:
        ip = { type: 6, octets: tuple[1]! };
        break;
      case Protocol.udp: {
        port = (tuple[1]![0] << 8) + tuple[1]![1];
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
