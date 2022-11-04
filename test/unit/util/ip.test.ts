import { multiaddr } from "@multiformats/multiaddr";
import { expect } from "chai";
import { ENR } from "../../../src/index.js";
import {
  getIPUDPOnENR,
  IPUDP,
  isEqualIPUDP,
  multiaddrFromIPUDP,
  multiaddrToIPUDP,
  setIPUDPOnENR,
} from "../../../src/util/ip.js";

describe("isEqualIPUDP", () => {
  it("equal", () => {
    const testCases: { ip1: IPUDP; ip2: IPUDP }[] = [
      {
        ip1: {
          type: 4,
          octets: new Uint8Array(4),
          udp: 0,
        },
        ip2: {
          type: 4,
          octets: new Uint8Array(4),
          udp: 0,
        },
      },
      {
        ip1: {
          type: 6,
          octets: new Uint8Array(16),
          udp: 0,
        },
        ip2: {
          type: 6,
          octets: new Uint8Array(16),
          udp: 0,
        },
      },
      {
        ip1: {
          type: 4,
          octets: new Uint8Array(4),
          udp: 1,
        },
        ip2: {
          type: 4,
          octets: new Uint8Array(4),
          udp: 1,
        },
      },
    ];
    for (const { ip1, ip2 } of testCases) {
      expect(isEqualIPUDP(ip1, ip2), `isEqualIPUDP(${ip1}, ${ip2}) should be true`).to.be.equal(true);
    }
  });

  it("not equal", () => {
    const testCases: { ip1: IPUDP; ip2: IPUDP }[] = [
      {
        ip1: {
          type: 4,
          octets: new Uint8Array(4),
          udp: 0,
        },
        ip2: {
          type: 6,
          octets: new Uint8Array(4),
          udp: 0,
        },
      },
      {
        ip1: {
          type: 4,
          octets: Uint8Array.from([0, 0, 0, 0]),
          udp: 0,
        },
        ip2: {
          type: 4,
          octets: Uint8Array.from([0, 0, 0, 1]),
          udp: 0,
        },
      },
      {
        ip1: {
          type: 4,
          octets: new Uint8Array(4),
          udp: 0,
        },
        ip2: {
          type: 4,
          octets: new Uint8Array(4),
          udp: 1,
        },
      },
    ];
    for (const { ip1, ip2 } of testCases) {
      expect(isEqualIPUDP(ip1, ip2), `isEqualIPUDP(${ip1}, ${ip2}) should be false`).to.be.equal(false);
    }
  });
});

describe("get/set IPUDP on ENR", () => {
  it("roundtrip", () => {
    const ip: IPUDP = {
      type: 4,
      octets: Uint8Array.from([127, 0, 0, 1]),
      udp: 53,
    };
    const enr = new ENR();
    expect(getIPUDPOnENR(enr)).to.equal(undefined);

    setIPUDPOnENR(enr, ip);
    expect(getIPUDPOnENR(enr)).to.deep.equal(ip);
  });
});

describe("multiaddr to/from IPUDP", () => {
  it("roundtrip", () => {
    const ip: IPUDP = {
      type: 4,
      octets: Uint8Array.from([127, 0, 0, 1]),
      udp: 53,
    };
    expect(multiaddrToIPUDP(multiaddrFromIPUDP(ip))).to.deep.equal(ip);
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
      let ip: IPUDP;
      let multiaddrStr: string;
      if (i % 2 === 0) {
        ip = {
          type: 4,
          octets: randIp4(),
          udp: randPort(),
        };
        multiaddrStr = `/ip4/${ip4ToStr(ip.octets)}/udp/${ip.udp}`;
      } else {
        ip = {
          type: 6,
          octets: randIp6(),
          udp: randPort(),
        };
        multiaddrStr = `/ip6/${ip6ToStr(ip.octets)}/udp/${ip.udp}`;
      }
      // test against upstream (generic but slow) implementation
      expect(multiaddrFromIPUDP(ip)).to.deep.equal(multiaddr(multiaddrStr));
      // also test roundtrip
      expect(multiaddrToIPUDP(multiaddrFromIPUDP(ip))).to.deep.equal(ip);
    }
  });
});
