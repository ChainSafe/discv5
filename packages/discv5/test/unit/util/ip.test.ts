import { multiaddr } from "@multiformats/multiaddr";
import { expect } from "chai";
import { SignableENR } from "@chainsafe/enr";
import { generateKeypair } from "../../../src/index.js";
import {
  getSocketAddressOnENR,
  SocketAddress,
  isEqualSocketAddress,
  multiaddrFromSocketAddress,
  multiaddrToSocketAddress,
  setSocketAddressOnENR,
} from "../../../src/util/ip.js";

describe("isEqualSocketAddress", () => {
  it("equal", () => {
    const testCases: { addr1: SocketAddress; addr2: SocketAddress }[] = [
      {
        addr1: {
          ip: {
            type: 4,
            octets: new Uint8Array(4),
          },
          port: 0,
        },
        addr2: {
          ip: {
            type: 4,
            octets: new Uint8Array(4),
          },
          port: 0,
        },
      },
      {
        addr1: {
          ip: {
            type: 6,
            octets: new Uint8Array(16),
          },
          port: 0,
        },
        addr2: {
          ip: {
            type: 6,
            octets: new Uint8Array(16),
          },
          port: 0,
        },
      },
      {
        addr1: {
          ip: {
            type: 4,
            octets: new Uint8Array(4),
          },
          port: 1,
        },
        addr2: {
          ip: {
            type: 4,
            octets: new Uint8Array(4),
          },
          port: 1,
        },
      },
    ];
    for (const { addr1: ip1, addr2: ip2 } of testCases) {
      expect(isEqualSocketAddress(ip1, ip2), `isEqualSocketAddress(${ip1}, ${ip2}) should be true`).to.be.equal(true);
    }
  });

  it("not equal", () => {
    const testCases: { ip1: SocketAddress; ip2: SocketAddress }[] = [
      {
        ip1: {
          ip: {
            type: 4,
            octets: new Uint8Array(4),
          },
          port: 0,
        },
        ip2: {
          ip: {
            type: 6,
            octets: new Uint8Array(4),
          },
          port: 0,
        },
      },
      {
        ip1: {
          ip: {
            type: 4,
            octets: Uint8Array.from([0, 0, 0, 0]),
          },
          port: 0,
        },
        ip2: {
          ip: {
            type: 4,
            octets: Uint8Array.from([0, 0, 0, 1]),
          },
          port: 0,
        },
      },
      {
        ip1: {
          ip: {
            type: 4,
            octets: new Uint8Array(4),
          },
          port: 0,
        },
        ip2: {
          ip: {
            type: 4,
            octets: new Uint8Array(4),
          },
          port: 1,
        },
      },
    ];
    for (const { ip1, ip2 } of testCases) {
      expect(isEqualSocketAddress(ip1, ip2), `isEqualSocketAddress(${ip1}, ${ip2}) should be false`).to.be.equal(false);
    }
  });
});

describe("get/set SocketAddress on ENR", () => {
  it("roundtrip", () => {
    const addr: SocketAddress = {
      ip: {
        type: 4,
        octets: Uint8Array.from([127, 0, 0, 1]),
      },
      port: 53,
    };
    const enr = SignableENR.createV4(generateKeypair("secp256k1").privateKey);
    expect(getSocketAddressOnENR(enr, { ip4: true, ip6: false })).to.equal(undefined);

    setSocketAddressOnENR(enr, addr);
    expect(getSocketAddressOnENR(enr, { ip4: true, ip6: false })).to.deep.equal(addr);
  });
});

describe("multiaddr to/from SocketAddress", () => {
  it("roundtrip", () => {
    const addr: SocketAddress = {
      ip: {
        type: 4,
        octets: Uint8Array.from([127, 0, 0, 1]),
      },
      port: 53,
    };
    expect(multiaddrToSocketAddress(multiaddrFromSocketAddress(addr))).to.deep.equal(addr);
  });

  it("different implementations yield same results", () => {
    const numTries = 50;
    const randPort = (): number => Math.floor(Math.random() * 65535);
    const randIp4 = (): Uint8Array => Uint8Array.from({ length: 4 }, () => Math.floor(Math.random() * 255));
    const randIp6 = (): Uint8Array => Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 255));
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
            type: 4,
            octets: randIp4(),
          },
          port: randPort(),
        };
        multiaddrStr = `/ip4/${ip4ToStr(addr.ip.octets)}/udp/${addr.port}`;
      } else {
        addr = {
          ip: {
            type: 6,
            octets: randIp6(),
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
