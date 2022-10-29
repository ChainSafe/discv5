import { Multiaddr } from "@multiformats/multiaddr";

export type IP = { type: 4 | 6; octets: Uint8Array };

export function ipFromBytes(bytes: Uint8Array): IP {
  // https://github.com/sigp/discv5/blob/517eb3f0c5e5b347d8fe6c2973e1698f89e83524/src/rpc.rs#L429
  switch (bytes.length) {
    case 4:
      return { type: 4, octets: bytes };
    case 16:
      return { type: 6, octets: bytes };
    default:
      throw Error("IP octets must have length 4 or 16");
  }
}

export function ipToBytes(ip: IP): Uint8Array {
  return ip.octets;
}

// Protocols https://github.com/multiformats/multiaddr/blob/master/protocols.csv
// code  size  name
// 4     32    ip4
// 41    128   ip6
// 273   16    udp
enum Protocol {
  ip4 = 4,
  ip6 = 41,
  udp = 273,
}

export function multiaddrToIP(multiaddr: Multiaddr): IP {
  for (const tuple of multiaddr.tuples()) {
    switch (tuple[0]) {
      case Protocol.ip4:
        return { type: 4, octets: tuple[1]! };
      case Protocol.ip6:
        return { type: 6, octets: tuple[1]! };
    }
  }

  throw Error("multiaddr does not have ip4 or ip6 protocols");
}

export function multiaddrToUDP(multiaddr: Multiaddr): number {
  for (const tuple of multiaddr.tuples()) {
    switch (tuple[0]) {
      case Protocol.udp:
        return new DataView(tuple[1]!).getUint16(0);
    }
  }

  throw Error("multiaddr does not have udp protocol");
}
