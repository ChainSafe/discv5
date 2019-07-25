import { keccak256 } from "ethereumjs-util";
import { secp256k1 } from "secp256k1";

/**
 * Defines the default identity scheme as specified in EIP 778
 */
export class IdentityScheme {

  /**
   * Returns the signature for a signed record content
   */
  public static sign(content: any[], privKey: Buffer): Buffer {
    const hash = keccak256(content);
    const signature = secp256k1.sign(hash, privKey).signature;
    return signature;

  }

  /**
   * Returns the validity of a signature for a signed record content
   */
  public static verify(hash: Buffer, signature: Buffer, pubKey: Buffer): boolean {
    return secp256k1.verify(hash, signature, pubKey);
  }

  /**
   * Returns a node address
   */
  public static derive(pubKey: Buffer): Buffer {
    return keccak256(pubKey);
  }

  public defaultSchemeList: string;

  constructor() {
    this.defaultSchemeList  = "v4";
  }
}
