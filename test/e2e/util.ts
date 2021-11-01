import PeerId from "peer-id";
import { ENR } from "../../src";

const privKeysBase64 = [
  // Base64 encoded mashal privKey                    // enr.nodeId
  "CAISIF9nhmNn+vOoMPdR+adfKwjSdgqrVGmAX0AWe6Tgjj/p", // 83e37e534450c86d115f805055c27840a9780afafd95cd33650297d70b8ec363
  "CAISIMSR1N4+3m62NGJ8pdgiUPzFR4vv8pZKG6q+iys+B2DL", // 2862ae92fa59042fd4d4a3e3bddb92b33a53b72be15deafce07dfbd7c3b12812
  "CAISICt4F0d4SSXzWUfH8t6ubKqvFF5yJ35lxXnmrovJvwGL", // acbf39af112b99a81742c5ae59adb35e65351fe2af1ee131c053f5535430a111
  "CAISIEQcrGuNoRcrUBR4nM/p1Pjhk22WWGMQ0+7wtGqnG2Mj", // 70bed188aaed2a3e29ff6dec2c001a2fc081299c80d452b4b5cfb58dd317f376
  "CAISIPeChcLlW+8EoyQwcM6hBxBH3ozY/zq9C9j20Zzpsi5U", // d48f41ef96afdcb5e20d7e93508a4a7211331913fdb5ac856ad878c192d3018e
  "CAISICVr/9VGoyDkzkvlIa7OMNKXMPhhfMsG19WLilEbqOZy", // af3655c22e7cafd7ae1cb69c926e43835d9dc8ebe3ea4a26508c9493431367ac
  "CAISIBawDQDzDpH4WQiDo0g8qhkMmqYpXIeYt+wF1l9t1Zyh", // ddcec64f6c500309228f38c04944e65d41983bbcf64076e56c1c8eaad0339ab9
  "CAISII1BySgfilbW8Q831rIm/IvAxqu65BtSFt0+cw7lt1yu", // 1d8dc020d08669d955132077fc9212d5275fe1f24de572157f9a7c9652d53948
  "CAISIHRKcVKLTpKhQOEIPwQjH2xx/nvJWWLUCr90/NOuuZ+l", // e23f0d942ca2cb2dcb67376a0467af1dfc1c29ecb90d1878aadbbdba35ead571
  "CAISIP3n7vFWZKye7duop0nhfttFJUXTVvQfd4q0dPpURLke", // 57d8eb775e302c02d7679cd92e72bfd31688ccea3a522b39a004eabbefad15b3
];

const peerIdCache: PeerId[] = [];
const nodeIdToIdx = new Map<string, number>();

export async function getPeerId(i: number): Promise<PeerId> {
  if (!peerIdCache[i]) {
    peerIdCache[i] = await PeerId.createFromPrivKey(privKeysBase64[i]);
  }
  return peerIdCache[i];
}

export type NodeIdToIdx = (nodeId: string) => number;

export async function getNodeIdToIdx(): Promise<NodeIdToIdx> {
  if (nodeIdToIdx.size === 0) {
    for (let i = 0; i < privKeysBase64.length; i++) {
      const peerId = await getPeerId(i);
      const enr = ENR.createFromPeerId(peerId);
      nodeIdToIdx.set(enr.nodeId, i);
    }
  }

  return function (nodeId: string) {
    const i = nodeIdToIdx.get(nodeId);
    if (i === undefined) throw Error(`Unknown nodeId ${nodeId}`);
    return i;
  };
}
