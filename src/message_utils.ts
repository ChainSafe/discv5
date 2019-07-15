import { packet, request, response } from "./messages";
import { secp256k1 } from "secp256k1";
import { Buffer } from "types/Buffer";

export encodePacket(msg: packet, privKey: Buffer): Buffer {
  let packetBuffer = Buffer.from(JSON.stringify(msg));
  let signature = secp256k1.sign(packetBuffer, privKey).signature;
  let encodedPacket = Buffer.concat([signature, packetBuffer]);
  return encodedPacket;
} 

// Note: might consider function overloading here for the return type
export decodePacket(payload: Buffer): packet {
  // decode payload into one of the following packet types:
  // Who are you packet
  // Auth packet
  // Random packet
  // the 2 different types of message packets

  let payloadObj = JSON.parse(payload.toString());
  // Retrieve signature and verify
  // Decode into appropriate packet type and return result
}

export function encode(msg: packet | request | response, typeName: string, privKey: Buffer): Buffer {
  if typeMaps.byName[typeName] === undefined {
    throw new Error(`Invalid typename: ${typeName}`);
  }  
  const msgType = typeMaps.byName[typeName];
  // encode message
  let encodedMsg: Buffer = ;
  return encodedMsg;
}

export function decode(): request | response {

}
