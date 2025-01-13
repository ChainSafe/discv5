import { KeyType } from "@libp2p/interface";

export interface IKeypair {
  type: KeyType;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  privateKeyVerify(): boolean;
  publicKeyVerify(): boolean;
  sign(msg: Uint8Array): Uint8Array;
  verify(msg: Uint8Array, sig: Uint8Array): boolean;
  deriveSecret(keypair: IKeypair): Uint8Array;
  hasPrivateKey(): boolean;
}

export interface IKeypairClass {
  new (privateKey?: Uint8Array, publicKey?: Uint8Array): IKeypair;
  generate(): IKeypair;
}

export abstract class AbstractKeypair {
  readonly _privateKey?: Uint8Array;
  readonly _publicKey?: Uint8Array;
  constructor(privateKey?: Uint8Array, publicKey?: Uint8Array) {
    if ((this._privateKey = privateKey) && !this.privateKeyVerify()) {
      throw new Error("Invalid private key");
    }
    if ((this._publicKey = publicKey) && !this.publicKeyVerify()) {
      throw new Error("Invalid private key");
    }
  }
  get privateKey(): Uint8Array {
    if (!this._privateKey) {
      throw new Error();
    }
    return this._privateKey;
  }
  get publicKey(): Uint8Array {
    if (!this._publicKey) {
      throw new Error();
    }
    return this._publicKey;
  }
  privateKeyVerify(): boolean {
    return true;
  }
  publicKeyVerify(): boolean {
    return true;
  }
  hasPrivateKey(): boolean {
    return Boolean(this._privateKey);
  }
}
