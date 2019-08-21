import { keccak256 } from "ethereumjs-util";
import ctx from "../crypto/ctx";
import { ECDH } from "@chainsafe/milagro-crypto-js/src/ecdh";

/**
 * Defines the default identity scheme as specified in EIP 778
 */
export class IdentityScheme {

  /**
   * Returns the signature for a signed record content
   */
  public static sign(content: any[], privKey: ArrayLike<number>): Signature {
    const hash = Uint8Array.from(keccak256(content));
    let C: ArrayLike<number> = number[]; // X-coordinate of output signature
    let D: ArrayLike<number> = number[]; // Y-coordinate of output signature
    let res = ctx.ECDH.ECPSP_DSA(32, new ctx.RAND(), privKey,hash, C, D);
    // TODO: Check if res == 0 and return appropriate error message
    let signature = Buffer.concat([C, D]);
    return signature;
  }

  /**
   * Returns the validity of a signature for a signed record content
   */
  public static verify(hash: ArrayLike<number>, signature: Buffer, pubKey: ArrayLike<number>): boolean {
    let sigX = signature.slice(0,33);
    let sigY = signature.slice(33, 66);
    let res: number = ctx.ECDH.ECPVP_DSA(32, pubKey, hash, sigX, sigY);
    if (res === 0) {
        return true;
    } else {
        return false;
    }
  }

  /**
   * Returns a node address
   * Note that the pubkey is uncompressed
   */
    public static derive(pubKey: ArrayLike<number>): Buffer {
    return keccak256(Buffer.from(pubKey));
  }

  public defaultSchemeList: string;

  constructor() {
    this.defaultSchemeList  = "v4";
  }
}
