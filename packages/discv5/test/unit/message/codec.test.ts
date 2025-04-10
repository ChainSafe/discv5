import { expect } from "chai";
import { bigintToBytes, ENR } from "@chainsafe/enr";
import { Message, MessageType, decode, encode } from "../../../src/message/index.js";
import { hexToBytes } from "ethereum-cryptography/utils.js";

describe("message", () => {
  const testCases: {
    message: Message;
    expected: Uint8Array;
  }[] = [
    {
      message: {
        type: MessageType.PING,
        id: bigintToBytes(1n),
        enrSeq: 1n,
      },
      expected: hexToBytes("01c20101"),
    },
    {
      message: {
        type: MessageType.PING,
        id: bigintToBytes(1n),
        enrSeq: 0n, // < test 0 enrSeq
      },
      expected: hexToBytes("01c20100"),
    },
    {
      message: {
        type: MessageType.PONG,
        id: bigintToBytes(1n),
        enrSeq: 1n,
        addr: { ip: { type: 4, octets: new Uint8Array([127, 0, 0, 1]) }, port: 255 }, // 1 byte
      },
      expected: hexToBytes("02c90101847f00000181ff"),
    },
    {
      message: {
        type: MessageType.PONG,
        id: bigintToBytes(1n),
        enrSeq: 1n,
        addr: { ip: { type: 4, octets: new Uint8Array([127, 0, 0, 1]) }, port: 5000 },
      },
      expected: hexToBytes("02ca0101847f000001821388"),
    },
    {
      message: {
        type: MessageType.PONG,
        id: bigintToBytes(1n),
        enrSeq: 1n,
        addr: { ip: { type: 6, octets: new Uint8Array(16).fill(0xaa) }, port: 5000 }, // 2 bytes
      },
      expected: hexToBytes("02d6010190aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa821388"),
    },
    {
      message: {
        type: MessageType.FINDNODE,
        id: bigintToBytes(1n),
        distances: [250],
      },
      expected: hexToBytes("03c401c281fa"),
    },
    {
      message: {
        type: MessageType.NODES,
        id: bigintToBytes(1n),
        total: 1,
        enrs: [],
      },
      expected: hexToBytes("04c30101c0"),
    },
    {
      message: {
        type: MessageType.NODES,
        id: bigintToBytes(1n),
        total: 1,
        enrs: [
          ENR.decodeTxt(
            "enr:-HW4QBzimRxkmT18hMKaAL3IcZF1UcfTMPyi3Q1pxwZZbcZVRI8DC5infUAB_UauARLOJtYTxaagKoGmIjzQxO2qUygBgmlkgnY0iXNlY3AyNTZrMaEDymNMrg1JrLQB2KTGtv6MVbcNEVv0AHacwUAPMljNMTg"
          ),
          ENR.decodeTxt(
            "enr:-HW4QNfxw543Ypf4HXKXdYxkyzfcxcO-6p9X986WldfVpnVTQX1xlTnWrktEWUbeTZnmgOuAY_KUhbVV1Ft98WoYUBMBgmlkgnY0iXNlY3AyNTZrMaEDDiy3QkHAxPyOgWbxp5oF1bDdlYE6dLCUUp8xfVw50jU"
          ),
        ],
      },
      expected: hexToBytes(
        "04f8f20101f8eef875b8401ce2991c64993d7c84c29a00bdc871917551c7d330fca2dd0d69c706596dc655448f030b98a77d4001fd46ae0112ce26d613c5a6a02a81a6223cd0c4edaa53280182696482763489736563703235366b31a103ca634cae0d49acb401d8a4c6b6fe8c55b70d115bf400769cc1400f3258cd3138f875b840d7f1c39e376297f81d7297758c64cb37dcc5c3beea9f57f7ce9695d7d5a67553417d719539d6ae4b445946de4d99e680eb8063f29485b555d45b7df16a1850130182696482763489736563703235366b31a1030e2cb74241c0c4fc8e8166f1a79a05d5b0dd95813a74b094529f317d5c39d235"
      ),
    },
  ];
  for (const { message, expected } of testCases) {
    it(`should encode/decode message type ${MessageType[message.type]}`, () => {
      const actual = encode(message);
      expect(actual).to.deep.equal(expected);
      const decoded = decode(actual);
      // to allow for any cached inner objects to be populated
      encode(decoded);
      expect(decoded).to.deep.equal(message);
    });
  }
});

describe("invalid messages", () => {
  const testCases: {
    message: Message;
    expected: Error;
  }[] = [
    {
      message: {
        type: MessageType.PONG,
        id: bigintToBytes(1n),
        enrSeq: 1n,
        // Negative port is invalid.
        addr: { ip: { type: 4, octets: new Uint8Array([127, 0, 0, 1]) }, port: -1 },
      },
      expected: new Error("invalid port for encoding"),
    },
    {
      message: {
        type: MessageType.PONG,
        id: bigintToBytes(1n),
        enrSeq: 1n,
        // This port is greater than 16 bits.
        addr: { ip: { type: 4, octets: new Uint8Array([127, 0, 0, 1]) }, port: 65536 },
      },
      expected: new Error("invalid port for encoding"),
    },
  ];
  for (const { message, expected } of testCases) {
    it(`should fail to encode/decode message type ${MessageType[message.type]}`, () => {
      expect(() => {
        encode(message);
      }).throws(expected.message);
    });
  }
});
