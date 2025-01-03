// This module has the side effect of setting the ENR crypto implementations to use the defaultCrypto
// implementation at present.
// TODO: Adjust this if we use a different implementation

import { setV4Crypto, defaultCrypto } from "@chainsafe/enr";

setV4Crypto(defaultCrypto);
