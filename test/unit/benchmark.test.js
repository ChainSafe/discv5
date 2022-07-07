import { itBench } from "@dapplion/benchmark";
import { expect } from "chai";
import { randomBytes } from "crypto";
import { decryptMessage, encryptMessage, createKeypair, KeypairType, idSign, idVerify, v4 } from "../../lib/index.js";

itBench("benchmark aes cipher encryption/decryptions", () => {
  const key = Buffer.from(randomBytes(16));
  const nonce = Buffer.from(randomBytes(12));
  const msg = Buffer.from(randomBytes(16));
  const ad = Buffer.from(randomBytes(16));

  const cipher = encryptMessage(key, nonce, msg, ad);
  const decrypted = decryptMessage(key, nonce, cipher, ad);
  expect(decrypted).to.deep.equal(msg);
});

itBench("benchmark sign/verify", () => {
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
  const keypair = createKeypair(KeypairType.Secp256k1, localSK);
  const actual = idSign(keypair, challengeData, ephemPK, nodeIdB);
  expect(actual).to.deep.equal(expected);
  expect(
    idVerify(
      createKeypair(KeypairType.Secp256k1, undefined, v4.publicKey(localSK)),
      challengeData,
      ephemPK,
      nodeIdB,
      actual
    )
  ).to.be.true;
})