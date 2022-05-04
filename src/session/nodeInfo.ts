import { Multiaddr } from "multiaddr";
import PeerId from "peer-id";
import { createKeypairFromPeerId, ENR, IKeypair, NodeId, v4 } from "..";

/** A representation of an unsigned contactable node. */
export interface INodeAddress {
  /** The destination socket address. */
  socketAddr: Multiaddr;
  /** The destination Node Id. */
  nodeId: NodeId;
}

export function nodeAddressToString(nodeAddr: INodeAddress): string {
  return nodeAddr.nodeId + ":" + Buffer.from(nodeAddr.socketAddr.bytes).toString("hex");
}

/**
 * This type relaxes the requirement of having an ENR to connect to a node, to allow for unsigned
 * connection types, such as multiaddrs.
 */
export enum INodeContactType {
  /** We know the ENR of the node we are contacting. */
  ENR,
  /**
   * We don't have an ENR, but have enough information to start a handshake.
   *
   * The handshake will request the ENR at the first opportunity.
   * The public key can be derived from multiaddr's whose keys can be inlined.
   */
  Raw,
}

/**
 * This type relaxes the requirement of having an ENR to connect to a node, to allow for unsigned
 * connection types, such as multiaddrs.
 */
export type NodeContact =
  | {
      type: INodeContactType.ENR;
      enr: ENR;
    }
  | {
      type: INodeContactType.Raw;
      publicKey: IKeypair;
      nodeAddress: INodeAddress;
    };

export function createNodeContact(input: ENR | Multiaddr | INodeAddress): NodeContact {
  if (Multiaddr.isMultiaddr(input)) {
    const options = input.toOptions();
    if (options.transport !== "udp") {
      throw new Error("Multiaddr must specify a UDP port");
    }
    const peerIdStr = input.getPeerId();
    if (!peerIdStr) {
      throw new Error("Multiaddr must specify a peer id");
    }
    const peerId = PeerId.createFromB58String(peerIdStr);
    const keypair = createKeypairFromPeerId(peerId);
    const nodeId = v4.nodeId(keypair.publicKey);
    return {
      type: INodeContactType.Raw,
      publicKey: keypair,
      nodeAddress: {
        socketAddr: input,
        nodeId,
      },
    };
  } else if (input instanceof ENR) {
    return {
      type: INodeContactType.ENR,
      enr: input,
    };
  } else
    return {
      type: INodeContactType.Raw,
      publicKey: {} as IKeypair,
      nodeAddress: input,
    };
}

export function getNodeId(contact: NodeContact): NodeId {
  switch (contact.type) {
    case INodeContactType.ENR:
      return contact.enr.nodeId;
    case INodeContactType.Raw:
      return contact.nodeAddress.nodeId;
  }
}

export function getNodeAddress(contact: NodeContact): INodeAddress {
  switch (contact.type) {
    case INodeContactType.ENR: {
      const socketAddr = contact.enr.getLocationMultiaddr("udp");
      if (!socketAddr) {
        throw new Error("ENR has no udp multiaddr");
      }
      return {
        socketAddr,
        nodeId: contact.enr.nodeId,
      };
    }
    case INodeContactType.Raw:
      return contact.nodeAddress;
  }
}

export function getPublicKey(contact: NodeContact): IKeypair {
  switch (contact.type) {
    case INodeContactType.ENR:
      return contact.enr.keypair;
    case INodeContactType.Raw:
      return contact.publicKey;
  }
}
