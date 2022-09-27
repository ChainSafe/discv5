import { Multiaddr } from "multiaddr";
import { ENR } from "../src/enr";
import { nodeAddressToString } from "../src/session/nodeInfo";
console.log("hello world");

const originalExt = process.memoryUsage().external;
const times = 1e9;

const txt =
        "enr:-Ku4QMh15cIjmnq-co5S3tYaNXxDzKTgj0ufusA-QfZ66EWHNsULt2kb0eTHoo1Dkjvvf6CAHDS1Di-htjiPFZzaIPcLh2F0dG5ldHOIAAAAAAAAAACEZXRoMpD2d10HAAABE________x8AgmlkgnY0gmlwhHZFkMSJc2VjcDI1NmsxoQIWSDEWdHwdEA3Lw2B_byeFQOINTZ0GdtF9DBjes6JqtIN1ZHCCIyg";
const enr = ENR.decodeTxt(txt);

const test = async (): Promise<void> => {
  for (let i = 0; i < times; i++) {
    for (let j = 0; j < 1e6; j++) {
      const socketAddr = enr.getLocationMultiaddr("udp");
      if (!socketAddr) throw Error("no udp addr");
      nodeAddressToString({
        socketAddr,
        nodeId: enr.nodeId,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log("New memory", i, toMem(process.memoryUsage().external - originalExt));
  }
}


function toMem(n: number): string {
  const bytes = Math.abs(n);
  const sign = n > 0 ? "+" : "-";
  if (bytes < 1e6) return sign + Math.floor(bytes / 10) / 100 + " KB";

  if (bytes < 1e9) return sign + Math.floor(bytes / 1e4) / 100 + " MB";

  return sign + Math.floor(bytes / 1e7) / 100 + " GB";
}

// main
test()
  .then(() => console.log("done"))
  .catch((e) => console.log("got error", e));