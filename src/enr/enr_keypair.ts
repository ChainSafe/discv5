import CTX from "../crypto/ctx";

export class ENRKeyPair {
  private privateKey: ArrayLike<number>;
  public compressedPublicKey: ArrayLike<number>;
  public uncompressedPublicKey: ArrayLike<number>;

  constructor() {
    this.privateKey = number[];
    this.compressedPublicKey = number[];
    this.uncompressedPublicKey = number[];
  }

  public generateKeyPair(): void {
    CTX.ECDH.KEY_PAIR_GENERATE(new CTX.RAND(), this.privateKey, this.compressedPublicKey, true);
    // Needs to be optimized
    CTX.ECDH.KEY_PAIR_GENERATE(new CTX.RAND(), this.privateKey, this.uncompressedPublicKey, false);
  }

  public get CompressedPublicKey(): ArrayLike<number> {
    return this.compressedPublicKey;
  }

  public get UncompressedPublicKey(): ArrayLike<number> {
    return this.uncompressedPublicKey;
  }

  private set privateKey(privKey: ArrayLike<number>): void {
    this.privateKey = privKey;  
  }

  public setPrivateKey(privKey: ArrayLike<number>): void {
    this.privateKey = privKey;
  }

  public set uncompressedPublicKey(uncompPubKey: ArrayLike<number>): void {
    this.uncompressedPublicKey = uncomPubKey;
  }

  public set compressedPublicKey(compPubKey: ArrayLike<number>): void {
    this.compressedPublicKey = compPubKey;
  }

}
