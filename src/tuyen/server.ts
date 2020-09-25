// import PeerId from "peer-id";
import { createEnr, createPeerId, getAllIpAddresses} from "./util";
import { Discv5Discovery } from "../libp2p/discv5";
import { createKeypairFromPeerId } from "..";


async function main(): Promise<void> {
  const peerId = await createPeerId();
  const enr = await createEnr(peerId);
  const serverPort = 10001;
  const bindAddr = "/ip4/0.0.0.0/udp/" + serverPort;
  // a good enr
  // const bootEnr = await ENR.decodeTxt("enr:-Ku4QLglCMIYAgHd51uFUqejD9DWGovHOseHQy7Od1SeZnHnQ3fSpE4_nbfVs8lsy8uF07ae7IgrOOUFU0NFvZp5D4wBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpAYrkzLAAAAAf__________gmlkgnY0gmlwhBLf22SJc2VjcDI1NmsxoQJxCnE6v_x2ekgY_uoE1rtwzvGy40mq9eD66XfHPBWgIIN1ZHCCD6A")
  const discv5 = new Discv5Discovery({
    bindAddr,
    bootEnrs: [],
    enr,
    peerId,
  });
  await discv5.start();
  console.log("@@@ Started discv5 server node successfully at port", serverPort);
  const keypair = createKeypairFromPeerId(peerId);
  const enrTxt = enr.encodeTxt(keypair.privateKey);
  console.log("@@@ enr with signature", enrTxt);
  console.log("@@@ possible ipaddresses", getAllIpAddresses());
}

main().then(() => console.log("done"));
