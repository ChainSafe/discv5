import { multiaddr, NodeAddress } from "@multiformats/multiaddr";
import { MessageType, RequestMessage, ResponseMessage } from "./types.js";

export function requestMatchesResponse(req: RequestMessage, res: ResponseMessage): boolean {
  switch (req.type) {
    case MessageType.PING:
      return res.type === MessageType.PONG;
    case MessageType.FINDNODE:
      return res.type === MessageType.NODES;
    case MessageType.REGTOPIC:
      return res.type === MessageType.TICKET;
    case MessageType.TALKREQ:
      return res.type === MessageType.TALKRESP;
    default:
      return false;
  }
}

export function ipToBuffer({ family, address }: Pick<NodeAddress, "family" | "address">): Buffer {
  // TODO: Improve, drop use of multiaddr
  const ipMultiaddr = multiaddr(`/${family === 4 ? "ip4" : "ip6"}/${address}`);
  const tuple = ipMultiaddr.tuples()[0][1];
  if (!tuple) throw Error(`Invalid IP ${address}`);

  return Buffer.from(tuple);
}
