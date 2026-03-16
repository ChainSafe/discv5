import {SignableENR} from "@chainsafe/enr";
import {multiaddr} from "@multiformats/multiaddr";
import {describe, expect, it} from "vitest";
import {generateKeypair} from "../../../src/index.js";
import {
  type Ip,
  type SocketAddress,
  getSocketAddressOnENR,
  getSocketAddressOnENRByFamily,
  isEqualSocketAddress,
  isIpv4MappedIpv6,
  multiaddrFromSocketAddress,
  multiaddrToSocketAddress,
  normalizeIp,
  setSocketAddressOnENR,
} from "../../../src/util/ip.js";

describe("isEqualSocketAddress", () => {
  it("equal", () => {
    const testCases: {addr1: SocketAddress; addr2: SocketAddress}[] = [
      {
        addr1: {
          ip: {
            octets: new Uint8Array(4),
            type: 4,
          },
          port: 0,
        },
        addr2: {
          ip: {
            octets: new Uint8Array(4),
            type: 4,
          },
          port: 0,
        },
      },
      {
        addr1: {
          ip: {
            octets: new Uint8Array(16),
            type: 6,
          },
          port: 0,
        },
        addr2: {
          ip: {
            octets: new Uint8Array(16),
            type: 6,
          },
          port: 0,
        },
      },
      {
        addr1: {
          ip: {
            octets: new Uint8Array(4),
            type: 4,
          },
          port: 1,
        },
        addr2: {
          ip: {
            octets: new Uint8Array(4),
            type: 4,
          },
          port: 1,
        },
      },
    ];
    for (const {addr1: ip1, addr2: ip2} of testCases) {
      expect(isEqualSocketAddress(ip1, ip2), `isEqualSocketAddress(${ip1}, ${ip2}) should be true`).to.be.equal(true);
    }
  });

  it("not equal", () => {
    const testCases: {ip1: SocketAddress; ip2: SocketAddress}[] = [
      {
        ip1: {
          ip: {
            octets: new Uint8Array(4),
            type: 4,
          },
          port: 0,
        },
        ip2: {
          ip: {
            octets: new Uint8Array(4),
            type: 6,
          },
          port: 0,
        },
      },
      {
        ip1: {
          ip: {
            octets: Uint8Array.from([0, 0, 0, 0]),
            type: 4,
          },
          port: 0,
        },
        ip2: {
          ip: {
            octets: Uint8Array.from([0, 0, 0, 1]),
            type: 4,
          },
          port: 0,
        },
      },
      {
        ip1: {
          ip: {
            octets: new Uint8Array(4),
            type: 4,
          },
          port: 0,
        },
        ip2: {
          ip: {
            octets: new Uint8Array(4),
            type: 4,
          },
          port: 1,
        },
      },
    ];
    for (const {ip1, ip2} of testCases) {
      expect(isEqualSocketAddress(ip1, ip2), `isEqualSocketAddress(${ip1}, ${ip2}) should be false`).to.be.equal(false);
    }
  });
});

describe("get/set SocketAddress on ENR", () => {
  it("roundtrip", () => {
    const addr: SocketAddress = {
      ip: {
        octets: Uint8Array.from([127, 0, 0, 1]),
        type: 4,
      },
      port: 53,
    };
    const enr = SignableENR.createV4(generateKeypair("secp256k1").privateKey);
    expect(getSocketAddressOnENR(enr, {ip4: true, ip6: false})).to.equal(undefined);

    setSocketAddressOnENR(enr, addr);
    expect(getSocketAddressOnENR(enr, {ip4: true, ip6: false})).to.deep.equal(addr);
  });

  it("returns the requested family from the ENR", () => {
    const addr4: SocketAddress = {
      ip: {
        octets: Uint8Array.from([127, 0, 0, 1]),
        type: 4,
      },
      port: 53,
    };
    const addr6: SocketAddress = {
      ip: {
        octets: Uint8Array.from([0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8]),
        type: 6,
      },
      port: 54,
    };
    const enr = SignableENR.createV4(generateKeypair("secp256k1").privateKey);

    expect(getSocketAddressOnENRByFamily(enr, 4)).to.equal(undefined);
    expect(getSocketAddressOnENRByFamily(enr, 6)).to.equal(undefined);

    setSocketAddressOnENR(enr, addr4);
    setSocketAddressOnENR(enr, addr6);

    expect(getSocketAddressOnENRByFamily(enr, 4)).to.deep.equal(addr4);
    expect(getSocketAddressOnENRByFamily(enr, 6)).to.deep.equal(addr6);
  });

  it("keeps dual-stack ENR lookup preference for IPv6", () => {
    const addr4: SocketAddress = {
      ip: {
        octets: Uint8Array.from([127, 0, 0, 1]),
        type: 4,
      },
      port: 53,
    };
    const addr6: SocketAddress = {
      ip: {
        octets: Uint8Array.from([0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8]),
        type: 6,
      },
      port: 54,
    };
    const enr = SignableENR.createV4(generateKeypair("secp256k1").privateKey);

    setSocketAddressOnENR(enr, addr4);
    setSocketAddressOnENR(enr, addr6);

    expect(getSocketAddressOnENR(enr, {ip4: true, ip6: true})).to.deep.equal(addr6);
  });
});

describe("multiaddr to/from SocketAddress", () => {
  it("roundtrip", () => {
    const addr: SocketAddress = {
      ip: {
        octets: Uint8Array.from([127, 0, 0, 1]),
        type: 4,
      },
      port: 53,
    };
    expect(multiaddrToSocketAddress(multiaddrFromSocketAddress(addr))).to.deep.equal(addr);
  });

  it("different implementations yield same results", () => {
    const numTries = 50;
    const randPort = (): number => Math.floor(Math.random() * 65535);
    const randIp4 = (): Uint8Array => Uint8Array.from({length: 4}, () => Math.floor(Math.random() * 255));
    const randIp6 = (): Uint8Array => Uint8Array.from({length: 16}, () => Math.floor(Math.random() * 255));
    const ip4ToStr = (bytes: Uint8Array): string => bytes.join(".");
    const ip6ToStr = (bytes: Uint8Array): string =>
      Array.from(bytes)
        .map((chunk) => chunk.toString(16).padStart(2, "0"))
        .reduce((prev, curr, ix) => {
          if (ix % 2 === 0) {
            prev.push(curr);
          } else {
            prev[prev.length - 1] += curr;
          }
          return prev;
        }, [] as string[])
        .join(":");

    for (let i = 0; i < numTries; i++) {
      let addr: SocketAddress;
      let multiaddrStr: string;
      if (i % 2 === 0) {
        addr = {
          ip: {
            octets: randIp4(),
            type: 4,
          },
          port: randPort(),
        };
        multiaddrStr = `/ip4/${ip4ToStr(addr.ip.octets)}/udp/${addr.port}`;
      } else {
        addr = {
          ip: {
            octets: randIp6(),
            type: 6,
          },
          port: randPort(),
        };
        multiaddrStr = `/ip6/${ip6ToStr(addr.ip.octets)}/udp/${addr.port}`;
      }
      // test against upstream (generic but slow) implementation
      expect(multiaddrFromSocketAddress(addr)).to.deep.equal(multiaddr(multiaddrStr));
      // also test roundtrip
      expect(multiaddrToSocketAddress(multiaddrFromSocketAddress(addr))).to.deep.equal(addr);
    }
  });
});

describe("isIpv4MappedIpv6", () => {
  it("should detect IPv4-mapped IPv6 addresses", () => {
    // ::ffff:85.246.147.78
    const mapped: Ip = {
      octets: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 85, 246, 147, 78]),
      type: 6,
    };
    expect(isIpv4MappedIpv6(mapped)).to.equal(true);
  });

  it("should NOT detect real IPv6 as mapped", () => {
    // 2001:8a0:4a71:8b00:8aae:ddff:fe0e:527e
    const real: Ip = {
      octets: new Uint8Array([
        0x20, 0x01, 0x08, 0xa0, 0x4a, 0x71, 0x8b, 0x00, 0x8a, 0xae, 0xdd, 0xff, 0xfe, 0x0e, 0x52, 0x7e,
      ]),
      type: 6,
    };
    expect(isIpv4MappedIpv6(real)).to.equal(false);
  });

  it("should NOT detect IPv4 as mapped", () => {
    const ipv4: Ip = {octets: new Uint8Array([85, 246, 147, 78]), type: 4};
    expect(isIpv4MappedIpv6(ipv4)).to.equal(false);
  });
});

describe("normalizeIp", () => {
  it("should convert IPv4-mapped IPv6 to IPv4", () => {
    const mapped: Ip = {
      octets: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 85, 246, 147, 78]),
      type: 6,
    };
    const normalized = normalizeIp(mapped);
    expect(normalized.type).to.equal(4);
    expect(normalized.octets.length).to.equal(4);
    expect(Array.from(normalized.octets)).to.deep.equal([85, 246, 147, 78]);
  });

  it("should leave real IPv6 addresses unchanged", () => {
    const real: Ip = {
      octets: new Uint8Array([
        0x20, 0x01, 0x08, 0xa0, 0x4a, 0x71, 0x8b, 0x00, 0x8a, 0xae, 0xdd, 0xff, 0xfe, 0x0e, 0x52, 0x7e,
      ]),
      type: 6,
    };
    const normalized = normalizeIp(real);
    expect(normalized.type).to.equal(6);
    expect(normalized.octets.length).to.equal(16);
  });

  it("should leave IPv4 addresses unchanged", () => {
    const ipv4: Ip = {octets: new Uint8Array([85, 246, 147, 78]), type: 4};
    const normalized = normalizeIp(ipv4);
    expect(normalized.type).to.equal(4);
    expect(Array.from(normalized.octets)).to.deep.equal([85, 246, 147, 78]);
  });
});
