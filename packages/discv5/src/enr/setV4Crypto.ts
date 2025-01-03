// This module has the side effect of setting the ENR crypto implementations to use bcrypto

import { setV4Crypto, defaultCrypto } from "@chainsafe/enr";

setV4Crypto(defaultCrypto);
