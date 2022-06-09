import { expect } from "chai";
import { createFromPrivKey, createFromPubKey } from "@libp2p/peer-id-factory";
import { supportedKeys } from "@libp2p/crypto/keys";
import { createPeerIdFromKeypair, generateKeypair, KeypairType } from "../../../src/keypair/index.js";

describe("createPeerIdFromKeypair", function () {
  it("should properly create a PeerId from a secp256k1 keypair with private key", async function () {
    const keypair = generateKeypair(KeypairType.Secp256k1);
    const privKey = new supportedKeys.secp256k1.Secp256k1PrivateKey(keypair.privateKey, keypair.publicKey);

    const expectedPeerId = await createFromPrivKey(privKey);
    const actualPeerId = await createPeerIdFromKeypair(keypair);

    expect(actualPeerId).to.be.deep.equal(expectedPeerId);
  });
  it("should properly create a PeerId from a secp256k1 keypair without private key", async function () {
    const keypair = generateKeypair(KeypairType.Secp256k1);
    delete (keypair as any)._privateKey;
    const pubKey = new supportedKeys.secp256k1.Secp256k1PublicKey(keypair.publicKey);

    const expectedPeerId = await createFromPubKey(pubKey);
    const actualPeerId = await createPeerIdFromKeypair(keypair);

    expect(actualPeerId).to.be.deep.equal(expectedPeerId);
  });
});
