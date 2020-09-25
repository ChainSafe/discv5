// import PeerId from "peer-id";
import { createEnr, createPeerId } from "./util";
import { Discv5Discovery } from "../libp2p/discv5";
import { ENR } from "../enr";
import Multiaddr from "multiaddr";


async function main(): Promise<void> {
  const peerId = await createPeerId();
  const enr = await createEnr(peerId);
  const serverPort = 10001;
  const clientPort = 10002;
  const bindAddr = "/ip4/0.0.0.0/udp/" + clientPort;
  // TODO: fix this when a server is ready.
  const bootEnr = await ENR.decodeTxt("enr:-HW4QL6XgxpjbdTY2-1YvQPjtk9AB5IQUFol_ZlhMuckebf1U9AUzO4HU-8GehGv-pPfSM9sy_i-AAOWWZSr7tKel2QBgmlkgnY0iXNlY3AyNTZrMaEDLxn7bq0kymeW-ImWjnuSI_IP2VgodSqEd1mD3d9QECQ");
  // TODO: fix this when a server is ready.
  const ipAddress = "192.168.100.26";
  bootEnr.setLocationMultiaddr(Multiaddr(`/ip4/${ipAddress}/udp/${serverPort}`));
  const discv5 = new Discv5Discovery({
    bindAddr,
    bootEnrs: [bootEnr],
    enr,
    peerId,
  });
  await discv5.start();
  console.log("@@@ Start client successfully");
}

main().then(() => console.log("done"));
