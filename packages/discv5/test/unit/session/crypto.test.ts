/* eslint-env mocha */
import { expect } from "chai";
import { randomBytes } from "@noble/hashes/utils";
import { getV4Crypto, SignableENR } from "@chainsafe/enr";

import {
  deriveKey,
  generateSessionKeys,
  deriveKeysFromPubkey,
  idSign,
  idVerify,
  encryptMessage,
  decryptMessage,
} from "../../../src/session/index.js";
import { createKeypair, generateKeypair } from "../../../src/keypair/index.js";
import { toBuffer } from "../../../src/index.js";
import { getDiscv5Crypto } from "../../../src/util/crypto.js";

describe("session crypto", () => {
  it("ecdh should produce expected secret", () => {
    const expected = Buffer.from("033b11a2a1f214567e1537ce5e509ffd9b21373247f2a3ff6841f4976f53165e7e", "hex");

    const remotePK = Buffer.from("039961e4c2356d61bedb83052c115d311acb3a96f5777296dcf297351130266231", "hex").slice(
      0,
      65
    );
    const localSK = Buffer.from("fb757dc581730490a1d7a00deea65e9b1936924caaea8f44d476014856b68736", "hex");

    expect(getDiscv5Crypto().secp256k1.deriveSecret(localSK, remotePK)).to.deep.equal(expected);
  });

  it("key derivation should produce expected keys", () => {
    const expected = [
      Buffer.from("dccc82d81bd610f4f76d3ebe97a40571", "hex"),
      Buffer.from("ac74bb8773749920b0d3a8881c173ec5", "hex"),
    ];

    const ephemKey = Buffer.from("fb757dc581730490a1d7a00deea65e9b1936924caaea8f44d476014856b68736", "hex");
    const destPubkey = Buffer.from("0317931e6e0840220642f230037d285d122bc59063221ef3226b1f403ddc69ca91", "hex");

    const secret = getDiscv5Crypto().secp256k1.deriveSecret(ephemKey, destPubkey);
    const firstNodeId = "aaaa8419e9f49d0083561b48287df592939a8d19947d8c0ef88f2a4856a69fbb";
    const secondNodeId = "bbbb9d047f0488c0b5a93c1c3f2d8bafc7c8ff337024a55434a0d0555de64db9";
    const challengeData = Buffer.from(
      "000000000000000000000000000000006469736376350001010102030405060708090a0b0c00180102030405060708090a0b0c0d0e0f100000000000000000",
      "hex"
    );

    expect(deriveKey(toBuffer(secret), firstNodeId, secondNodeId, challengeData)).to.deep.equal(expected);
  });

  it("symmetric keys should be derived correctly", () => {
    const kp1 = generateKeypair("secp256k1");
    const kp2 = generateKeypair("secp256k1");
    const enr1 = SignableENR.createV4(kp1.privateKey);
    const enr2 = SignableENR.createV4(kp2.privateKey);
    const nonce = toBuffer(randomBytes(32));
    const [a1, b1, pk] = generateSessionKeys(
      enr1.nodeId,
      enr2.nodeId,
      createKeypair({ type: enr2.keypairType, publicKey: enr2.publicKey }),
      nonce
    );
    const [a2, b2] = deriveKeysFromPubkey(kp2, enr2.nodeId, enr1.nodeId, pk, nonce);

    expect(a1).to.deep.equal(a2);
    expect(b1).to.deep.equal(b2);
  });

  it("id signature should match expected value", () => {
    const expected = Buffer.from(
      "94852a1e2318c4e5e9d422c98eaf19d1d90d876b29cd06ca7cb7546d0fff7b484fe86c09a064fe72bdbef73ba8e9c34df0cd2b53e9d65528c2c7f336d5dfc6e6",
      "hex"
    );

    const localSK = Buffer.from("fb757dc581730490a1d7a00deea65e9b1936924caaea8f44d476014856b68736", "hex");
    const challengeData = Buffer.from(
      "000000000000000000000000000000006469736376350001010102030405060708090a0b0c00180102030405060708090a0b0c0d0e0f100000000000000000",
      "hex"
    );
    const ephemPK = Buffer.from("039961e4c2356d61bedb83052c115d311acb3a96f5777296dcf297351130266231", "hex");
    const nodeIdB = "bbbb9d047f0488c0b5a93c1c3f2d8bafc7c8ff337024a55434a0d0555de64db9";

    const actual = idSign(createKeypair({ type: "secp256k1", privateKey: localSK }), challengeData, ephemPK, nodeIdB);
    expect(actual).to.deep.equal(expected);
    expect(
      idVerify(
        createKeypair({ type: "secp256k1", publicKey: getV4Crypto().publicKey(localSK) }),
        challengeData,
        ephemPK,
        nodeIdB,
        actual
      )
    ).to.be.true;
  });

  it("encrypted data should match expected", () => {
    const expected = Buffer.from("a5d12a2d94b8ccb3ba55558229867dc13bfa3648", "hex");

    const key = Buffer.from("9f2d77db7004bf8a1a85107ac686990b", "hex");
    const nonce = Buffer.from("27b5af763c446acd2749fe8e", "hex");
    const pt = Buffer.from("01c20101", "hex");
    const ad = Buffer.from("93a7400fa0d6a694ebc24d5cf570f65d04215b6ac00757875e3f3a5f42107903", "hex");

    expect(encryptMessage(key, nonce, pt, ad)).to.deep.equal(expected);
  });

  it("encrypted data should successfully be decrypted", () => {
    const key = toBuffer(randomBytes(16));
    const nonce = toBuffer(randomBytes(12));
    const msg = toBuffer(randomBytes(16));
    const ad = toBuffer(randomBytes(16));

    const cipher = encryptMessage(key, nonce, msg, ad);
    const decrypted = decryptMessage(key, nonce, cipher, ad);
    expect(decrypted).to.deep.equal(msg);
  });
});
