// import PeerId from "peer-id";
import { readEnr, readPeerId } from "./util";
import { Discv5Discovery } from "../../src/libp2p/discv5";
import { ENR } from "../../src/enr";
// import Multiaddr from "multiaddr";


async function main(): Promise<void> {
  const wd = "/Users/tuyennguyen/Projects/workshop/discv5/test/tuyen/";
  const peerId = await readPeerId(wd + "peer-id.json");
  const enr = await readEnr(wd + "enr.json");
  // 9000 for rumor
  const bindAddr = "/ip4/0.0.0.0/udp/9001";
  // const bootEnr = await readEnr("/Users/tuyennguyen/Projects/workshop/lodestar_fresh/lodestar/packages/lodestar-cli/.medalla/enr.json");
  const bootEnr = await ENR.decodeTxt("enr:-IO4QE-_6sPGVev16Z7z3upgbpG1gOeXUAuy2N9UVr6qW2DIZtPUWd4gbvyXwOojVMtuzf1uy3E3LrpT17lV3S8wx9ICgmlkgnY0iXNlY3AyNTZrMaECrnFB2_27QnaVppdvDTENeTv_Q6ybtNnPXCqHNSMcxT-DdGNwgiMog3VkcIIjKA")
  // bootEnr.setLocationMultiaddr(Multiaddr("/ip4/192.168.100.26/udp/9000"))
  bootEnr.ip = "161.35.29.249";
  bootEnr.udp = 9000;
  const discv5 = new Discv5Discovery({
    bindAddr,
    bootEnrs: [bootEnr],
    enr,
    peerId,
  });
  await discv5.start();
}

main().then(() => console.log("done"));
