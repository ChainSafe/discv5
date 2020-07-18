import { networkInterfaces } from "os";
import Multiaddr from "multiaddr";
import debug from "debug";
import publicIp from "public-ip";
const log = debug("discv5:transport");

/**
 * Check if multiaddr belongs to the current network interfaces.
 */
export async function isCorrectNetworkMultiAddr(multiaddr: Multiaddr | undefined): Promise<boolean> {
  if (!multiaddr) return false;
  const protoNames = multiaddr.protoNames();
  if (protoNames.length !== 2 && protoNames[1] !== "udp") {
    throw new Error("Invalid udp multiaddr");
  }
  const interfaces = networkInterfaces();
  const tuples = multiaddr.tuples();
  const isIPv4: boolean = tuples[0][0] === 4;
  const family = isIPv4 ? "IPv4" : "IPv6";
  const ip = tuples[0][1];
  const ipStr = isIPv4
    ? Array.from(ip).join(".")
    : Array.from(Uint16Array.from(ip))
        .map((n) => n.toString(16))
        .join(":");
  log(`Checking if ip address ${ipStr} belongs to the current network..`);
  const localIpStrs = Object.values(interfaces)
    .flat()
    .filter((networkInterface) => networkInterface.family === family)
    .map((networkInterface) => networkInterface.address);
  if (localIpStrs.includes(ipStr)) return true;
  try {
    const publicIpStr = isIPv4 ? await publicIp.v4() : await publicIp.v6();
    log(`Found public ip address ${publicIpStr}, ip address in ENR: ${ipStr}`);
    return publicIpStr === ipStr;
  } catch (err) {
    log(`WARN: failed to get public ip address to check, ip address in ENR: ${ipStr}, error ${err}`);
    return true;
  }
}
