import {type ENR, type NodeId, getV4Crypto} from "@chainsafe/enr";
import {peerIdFromString} from "@libp2p/peer-id";
import {type Multiaddr, isMultiaddr} from "@multiformats/multiaddr";
import {type IKeypair, createKeypair} from "../keypair/index.js";
import type {IPMode} from "../transport/types.js";
import {getSocketAddressMultiaddrOnENR, multiaddrToObject} from "../util/ip.js";

/** A representation of an unsigned contactable node. */
export interface INodeAddress {
  /** The destination socket address. */
  socketAddr: Multiaddr;
  /** The destination Node Id. */
  nodeId: NodeId;
}

export function nodeAddressToString(nodeAddr: INodeAddress): string {
  // Since the Discv5 service allows a Multiaddr in outbound message handlers and requires a multiaddr input to
  // have a peer ID specified, we remove any p2p portions of the multiaddr when generating the nodeAddressString
  // since only the UDP socket addr is included in the session cache key (e.g. /ip4/127.0.0.1/udp/9000/p2p/Qm...)
  const normalizedAddr = nodeAddr.socketAddr.decapsulateCode(421);
  return `${nodeAddr.nodeId}:${Buffer.from(normalizedAddr.bytes).toString("hex")}`;
}

/**
 * This type abstracts the requirement of having an ENR to connect to a node, to allow for unsigned
 * connection types, such as multiaddrs.
 */
export enum INodeContactType {
  /** We know the ENR of the node we are contacting. */
  Enr = 0,
  /**
   * We don't have an ENR, but have enough information to start a handshake.
   * The handshake will request the ENR at the first opportunity.
   * The public key can be derived from multiaddr's whose keys can be inlined.
   */
  Raw = 1,
}

/**
 * This type abstracts the requirement of having an ENR to connect to a node, to allow for unsigned
 * connection types, such as multiaddrs.
 *
 * Either:
 *
 * * We know the ENR of the node we are contacting, or
 *
 * * We don't have an ENR, but have enough information to start a handshake.
 *
 *   The handshake will request the ENR at the first opportunity.
 *   The public key can be derived from multiaddr's whose keys can be inlined.
 */
export type NodeContact =
  | {
      type: INodeContactType.Raw;
      publicKey: IKeypair;
      nodeAddress: INodeAddress;
    }
  | {
      type: INodeContactType.Enr;
      publicKey: IKeypair;
      nodeAddress: INodeAddress;
      enr: ENR;
    };

/**
 * Convert an ENR or Multiaddr into a NodeContact.
 *
 * Note: this function may error if the input can't derive a public key or a valid socket address
 */
export function createNodeContact(input: ENR | Multiaddr, ipMode: IPMode): NodeContact {
  if (isMultiaddr(input)) {
    const options = multiaddrToObject(input);
    if ((options.family === 4 && !ipMode.ip4) || (options.family === 6 && !ipMode.ip6)) {
      throw new Error("Multiaddr family not supported by IP mode");
    }
    const peerIdStr = input.getComponents().find((c) => c.code === 421)?.value;
    if (!peerIdStr) {
      throw new Error("Multiaddr must specify a peer id");
    }
    const peerId = peerIdFromString(peerIdStr);
    const publicKey = peerId.publicKey;
    if (!publicKey) {
      throw new Error("Peer ID must have a public key");
    }
    const keypair = createKeypair({publicKey: publicKey.raw, type: publicKey.type});
    const nodeId = getV4Crypto().nodeId(keypair.publicKey);
    return {
      nodeAddress: {
        nodeId,
        socketAddr: input,
      },
      publicKey: keypair,
      type: INodeContactType.Raw,
    };
  }
  const socketAddr = getSocketAddressMultiaddrOnENR(input, ipMode);
  if (!socketAddr) {
    throw new Error("ENR has no suitable udp multiaddr given the IP mode");
  }
  return {
    enr: input,
    nodeAddress: {
      nodeId: input.nodeId,
      socketAddr,
    },
    publicKey: createKeypair({publicKey: input.publicKey, type: input.keypairType}),
    type: INodeContactType.Enr,
  };
}

export function getNodeId(contact: NodeContact): NodeId {
  return contact.nodeAddress.nodeId;
}

export function getNodeAddress(contact: NodeContact): INodeAddress {
  return contact.nodeAddress;
}

export function getPublicKey(contact: NodeContact): IKeypair {
  return contact.publicKey;
}
