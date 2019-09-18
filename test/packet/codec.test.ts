import {expect} from "chai";
import {randomBytes} from "crypto";
import {
  AUTH_TAG_LENGTH,
  ID_NONCE_LENGTH,
  MAGIC_LENGTH,
  TAG_LENGTH,
} from "../../src/constants";
import {
  decode,
  encode,
  IWhoAreYouPacket,
  PacketType,
} from "../../src/packet";

describe("packet encoding", () => {
  it ("should roundtrip encode/decode WHOAREYOU", () => {
    const magic = randomBytes(MAGIC_LENGTH);
    const p0: IWhoAreYouPacket = {
      tag: randomBytes(TAG_LENGTH),
      magic,
      token: randomBytes(AUTH_TAG_LENGTH),
      idNonce: randomBytes(ID_NONCE_LENGTH),
      enrSeq: BigInt(`0x${randomBytes(8).toString("hex")}`),
    };
    const b0 = encode(PacketType.WhoAreYou, p0);
    const p1 = decode(b0, magic);
    expect(p0).to.deep.equal(p1);
  });
});
