import { expect } from "chai";
import { createFromPrivKey, createFromPubKey } from "@libp2p/peer-id-factory";
import { supportedKeys } from "@libp2p/crypto/keys";
import { createPeerIdFromPrivateKey, createPeerIdFromPublicKey } from "@chainsafe/enr";
import { generateKeypair } from "../../../src/keypair/index.js";

describe("createPeerIdFromPrivateKey", function () {
  it("should properly create a PeerId from a secp256k1 private key", async function () {
    const keypair = generateKeypair("secp256k1");
    const privKey = new supportedKeys.secp256k1.Secp256k1PrivateKey(keypair.privateKey, keypair.publicKey);

    const expectedPeerId = await createFromPrivKey(privKey);
    const actualPeerId = await createPeerIdFromPrivateKey(keypair.type, keypair.privateKey);

    expect(actualPeerId).to.be.deep.equal(expectedPeerId);
  });
  it("should properly create a PeerId from a secp256k1 public key", async function () {
    const keypair = generateKeypair("secp256k1");
    delete (keypair as any)._privateKey;
    const pubKey = new supportedKeys.secp256k1.Secp256k1PublicKey(keypair.publicKey);

    const expectedPeerId = await createFromPubKey(pubKey);
    const actualPeerId = await createPeerIdFromPublicKey(keypair.type, keypair.publicKey);

    expect(actualPeerId).to.be.deep.equal(expectedPeerId);
  });
});
