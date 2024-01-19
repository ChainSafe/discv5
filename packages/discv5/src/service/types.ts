import { EventEmitter } from "events";
import StrictEventEmitter from "strict-event-emitter-types";
import { Multiaddr } from "@multiformats/multiaddr";
import { ENR, SequenceNumber, SignableENR } from "@chainsafe/enr";

import { ITalkReqMessage, ITalkRespMessage, RequestMessage } from "../message/index.js";
import { INodeAddress, NodeContact } from "../session/nodeInfo.js";
import { ConnectionDirection, RequestErrorType } from "../session/index.js";
import { SocketAddress } from "../util/ip.js";

export interface IDiscv5Events {
  /**
   * A node has been discovered from a FINDNODES request.
   *
   * The ENR of the node is returned.
   */
  discovered: (enr: ENR) => void;
  /**
   * A new ENR was added to the routing table
   */
  enrAdded: (enr: ENR, replaced?: ENR) => void;
  /**
   * Our local ENR IP address has been updated
   */
  multiaddrUpdated: (addr: Multiaddr) => void;
  /**
   * A TALKREQ message was received.
   *
   * The message object is returned.
   */
  talkReqReceived: (nodeAddr: INodeAddress, enr: ENR | null, message: ITalkReqMessage) => void;
  /**
   * A TALKREQ message was received.
   *
   * The message object is returned.
   */
  talkRespReceived: (nodeAddr: INodeAddress, enr: ENR | null, message: ITalkRespMessage) => void;
}

export type Discv5EventEmitter = StrictEventEmitter<EventEmitter, IDiscv5Events>;

/**
 * For multiple responses to a FINDNODES request,
 * this keeps track of the request count and the nodes that have been received.
 */
export interface INodesResponse {
  /**
   * The response count.
   */
  count: number;
  /**
   * The filtered nodes that have been received.
   */
  enrs: ENR[];
}

/**
 * Active RPC request awaiting a response
 */
export interface IActiveRequest<T extends RequestMessage = RequestMessage, U extends ResponseType = ResponseType> {
  /**
   * The address the request was sent to.
   */
  contact: NodeContact;
  /**
   * The request that was sent.
   */
  request: T;
  /**
   * The lookup ID if the request was related to a lookup
   */
  lookupId?: number;
  /**
   * Callback if this request was from a user level request.
   */
  callbackPromise?: {
    resolve: (value: U) => void;
    reject: (err: RequestErrorType) => void;
  };
}

export type PongResponse = {
  enrSeq: SequenceNumber;
  addr: SocketAddress;
};

export type ResponseType = Buffer | ENR[] | PongResponse;

export enum ConnectionStatusType {
  Connected,
  PongReceived,
  Disconnected,
}

export type ConnectionStatus =
  | {
      type: ConnectionStatusType.Connected;
      enr: ENR;
      direction: ConnectionDirection;
    }
  | {
      type: ConnectionStatusType.PongReceived;
      enr: ENR;
    }
  | {
      type: ConnectionStatusType.Disconnected;
    };

export type ENRInput = ENR | string;
export type SignableENRInput = SignableENR | string;
