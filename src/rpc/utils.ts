import * as constants from "../constants.ts";
import { ISocketAddr } from "../transport.ts";
import * as utils from "../utils";
import { IMessage, IRequest, MsgType } from "./type";

export function matchRequestToResponse(reqType: MsgType): MsgType {
    switch (reqType) {
      case MsgType.Ping:
        return MsgType.Pong;
      case MsgType.FindNode:
        return MsgType.Nodes;
      case MsgType.ReqTicket:
        return MsgType.Ticket;
      case MsgType.RegTopic:
        return MsgType.RegConfirmation;
      case MsgType.TopicQuery:
        return MsgType.Nodes;
    }
}
export function newRequest(dst: ISocketAddr, p: packet, msg?: IMessage): IRequest {
  return {
    destinationAddr: dst,
    packet: p,
    message: msg,
    timeout: delay(Date.now() + constants.REQUEST_TIMEOUT),
    retries: 1,
  };
}
