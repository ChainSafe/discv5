// import PeerId from "peer-id";
import { readEnr, readPeerId } from "./util";
import { Discv5Discovery } from "../libp2p/discv5";
import { ENR } from "../enr";
import Multiaddr from "multiaddr";


async function main(): Promise<void> {
  const wd = "/Users/tuyennguyen/Projects/workshop/discv5/test/tuyen/";
  const peerId = await readPeerId(wd + "peer-id.json");
  const enr = await readEnr(wd + "enr.json");
  // 9000 for rumor
  const bindAddr = "/ip4/0.0.0.0/udp/9001";
  // const bootEnr = await readEnr("/Users/tuyennguyen/Projects/workshop/lodestar_fresh/lodestar/packages/lodestar-cli/.medalla/enr.json");
  const bootEnr = await ENR.decodeTxt("enr:-IO4QAYORrTjQl6z6A6XYLpgmXVmawH5LqMkobVTEkOCeNU-Oc9FS5A0GP02xsmlRS4uRZYtngNNZDiagMQnnpllbFYCgmlkgnY0iXNlY3AyNTZrMaECI_HdAJQwUq2cT2qNTjcTqmnmigKAEVUaM_4l2AXjgTiDdGNwgiMog3VkcIIjKA")
  bootEnr.setLocationMultiaddr(Multiaddr("/ip4/192.168.100.26/udp/9000"))
  const discv5 = new Discv5Discovery({
    bindAddr,
    bootEnrs: [bootEnr],
    enr,
    peerId,
  });
  await discv5.start();
}

main().then(() => console.log("done"));
