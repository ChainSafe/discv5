# discv5

![ES Version](https://img.shields.io/badge/ES-2020-yellow)
![Node Version](https://img.shields.io/badge/node-18.x-green)

A TypeScript implementation of the [DiscV5](https://github.com/ethereum/devp2p/blob/master/discv5/discv5.md) protocol

## Libp2p compatibility

![Peer Discovery Compatible](https://github.com/libp2p/js-libp2p-interfaces/raw/master/src/peer-discovery/img/badge.png)

Included is a libp2p peer-discovery compatibility module.

#### Example

```typescript
import {Discv5Discovery} from "@chainsafe/discv5";
import {ENR, SignableENR} from "@chainsafe/enr";
import {createLibp2p} from "libp2p";
import PeerId from "peer-id";

const myPeerId: PeerId = ...;

const bootEnrs: ENR[] = [...];

const libp2p = createLibp2p({
  peerId: myPeerId,
  peerDiscovery: [() => new Discv5Discovery({
    enabled: true,
    enr: SignableENR.createFromPeerId(myPeerId),
    peerId: myPeerId,
    bindAddrs: {ip4: "/ip4/0.0.0.0/udp/9000"},
    bootEnrs,
    searchInterval: 30000, // wait 30s between searches
  })]
});
```

## License

Apache-2.0
