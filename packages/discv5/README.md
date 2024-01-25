# discv5

![ES Version](https://img.shields.io/badge/ES-2020-yellow)
![Node Version](https://img.shields.io/badge/node-18.x-green)

A TypeScript implementation of the [DiscV5](https://github.com/ethereum/devp2p/blob/master/discv5/discv5.md) protocol

## Libp2p compatibility

![Peer Discovery Compatible](https://github.com/libp2p/js-libp2p-interfaces/raw/master/src/peer-discovery/img/badge.png)

Included is a libp2p peer-discovery compatibility module.

#### Example

```typescript
import { Discv5Discovery, ENR } from "@chainsafe/discv5";
import Libp2p from "libp2p";
import PeerId from "peer-id";

const myPeerId: PeerId = ...;

const bootstrapEnrs: ENR[] = [...];

const libp2p = new Libp2p({
  peerId: myPeerId,
  modules: {
    peerDiscovery: [Discv5Discovery],
  },
  config: {
    discv5: {
      enr: ENR.createFromPeerId(myPeerInfo.id),
      bindAddr: "/ip4/0.0.0.0/udp/9000",
      bootstrapEnrs: bootstrapEnrs,
      searchInterval: 30000, // wait 30s between searches
    },
  },
});

```

## Additional features

By default, importing this library will, as a side-effect, change the enr crypto implementation to use `bcrypto`.
If you'd like to remain using `@chainsafe/enr`'s default crypto you can add this after importing `@chainsafe/discv5`:
```ts
import {setV4Crypto, defaultCrypto} from "@chainsafe/enr";

setV4Crypto(defaultCrypto)
```

## License

Apache-2.0
