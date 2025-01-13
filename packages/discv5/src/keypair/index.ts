import { KeyType } from "@libp2p/interface";

import { IKeypair } from "./types.js";
import { ERR_TYPE_NOT_IMPLEMENTED } from "./constants.js";
import { Secp256k1Keypair } from "./secp256k1.js";

export * from "./types.js";
export * from "./secp256k1.js";

export function generateKeypair(type: KeyType): IKeypair {
  switch (type) {
    case "secp256k1":
      return Secp256k1Keypair.generate();
    default:
      throw new Error(ERR_TYPE_NOT_IMPLEMENTED);
  }
}

type KeypairInit =
  | {
      type: KeyType;
      privateKey: Uint8Array;
      publicKey?: Uint8Array;
    }
  | {
      type: KeyType;
      privateKey?: Uint8Array;
      publicKey: Uint8Array;
    };

export function createKeypair(init: KeypairInit): IKeypair {
  switch (init.type) {
    case "secp256k1":
      return new Secp256k1Keypair(
        init.privateKey ? init.privateKey : undefined,
        init.publicKey ? init.publicKey : undefined
      );
    default:
      throw new Error(ERR_TYPE_NOT_IMPLEMENTED);
  }
}
