import assert from  "assert";
import * as PeerId  from "peer-id";
import * as PeerInfo from "peer-info";
import ctx from "../src/crypto/ctx";
import { EthereumNodeRecord } from "../src/enr/enr";
import { ENRKeyPair } from "../src/enr/enr_keypair";

import { sha256 } from "js-sha256";
import * as multihash from "multihashes";

describe("ENR", () => {
 // Create sample ENR
 let ENR: EthereumNodeRecord;
 beforeEach(() => {
   const enrKeyPair: ENRKeyPair = new ENRKeyPair();
   const privKey: Uint8Array = Uint8Array.from(Buffer.from("b71c71a67e1177ad4e901695e1b4b9ee17ae16c6668d313eac2f96dbcda3f291"));
   enrKeyPair.setPrivateKey(privKey);
   const comPubKey: Uint8Array = Uint8Array.from(Buffer.from("b71c71a67e1177ad4e901695e1b4b9ee17ae16c6668d313eac2f96dbcda3f291"));
   enrKeyPair.compressedPublicKey = comPubKey;
   ENR = new EthereumNodeRecord(enrKeyPair);
   ENR.id = "v4";
   ENR.sequenceNumber = BigInt(1);
   ENR.ipV4 = "127.0.0.1";
   ENR.udp = 30303;
 });

 it("should get NodeId", () => {
   const expectedNodeId: Buffer = Buffer.from("a448f24c6d18e575453db13171562b71999873db5b286df957af199ec94617f7", "utf-8");
   const actualNodeId: Buffer = ENR.nodeId;
   assert.strictEqual(actualNodeId, expectedNodeId, "These should give the same node IDs.");
 });

 it("should get id", () => {
   const expectedNodeId: string = "v4";
   const actualNodeId: string = ENR.id;
   assert.strictEqual(actualNodeId, expectedNodeId, "These should give the same identity scheme id");
 });

 it("should get libp2p peer id", () => {
   let expectedLibp2pPeerId: PeerInfo;
   const pubKey = ENR.uncompressedPubKey;
   let peerIdBuf = Buffer.from(sha256(pubKey), "hex");
   peerIdBuf = multihash.encode(peerIdBuf, "sha256");
   expectedLibp2pPeerId = new PeerInfo (new PeerId(peerIdBuf));
   const actualLibp2pPeerId: PeerInfo = ENR.libp2pPeerInfo;

   assert.deepEqual(actualLibp2pPeerId, expectedLibp2pPeerId, "These Peer info objects should be the same");
 });

 it("should get sequence number", () => {
   const expectedSeqNum: bigint = BigInt(1);
   const actualSeqNum: bigint = ENR.sequenceNumber;
   assert.strictEqual(actualSeqNum, expectedSeqNum, "ENR sequence numbers should be the same");
 });

 it("should get signature", () => {
   const expectedSignature = Buffer.from("7098ad865b00a582051940cb9cf36836572411a47278783077011599ed5cd16b76f2635f4e234738f30813a89eb9137e3e3df5266e3a1f11df72ecf1145ccb9c");
   const actualSignature: Buffer = ENR.signature;
   assert.deepEqual(actualSignature, expectedSignature, "ENR signatures should be the same");
 });

 it("should get ipv4 address", () => {
   const expectedIPv4Addr: string = "127.0.0.1";
   const actualIPv4Addr: string = ENR.ipV4;
   assert.strictEqual(actualIPv4Addr, expectedIPv4Addr, "IPv4 addrs should be the same");
 });

 it("should get ipv6 address", () => {
   const expectedIPv6: string = "";
   const actualIPv6: string = ENR.ipV6;
   assert.strictEqual(actualIPv6, expectedIPv6, "IPv6 defaults should be the same");
 });

 it("should get tcp port", () => {
   const expectedTCPPort: number = 0;
   const actualTCPPort: number = ENR.tcp;
   assert.strictEqual(actualTCPPort, expectedTCPPort, "Default tcp port should be the same");
 });

 it("should get udp port", () => {
   const expectedUDPPort: number = 30303;
   const actualUDPPort: number = ENR.udp;
   assert.strictEqual(actualUDPPort, expectedUDPPort, "UDP ports should be the same");
 });

 it("should get tcp6 port", () => {
   const expectedTCP6Port: number = 0;
   const actualTCP6Port: number = ENR.tcp6;
   assert.strictEqual(actualTCP6Port, expectedTCP6Port, "Default tcp6 port should be the same");
 });

 it("should get udp6 port", () => {
   const expectedUDP6Port: number = 0;
   const actualUDP6Port: number = ENR.udp6;
   assert.strictEqual(actualUDP6Port, expectedUDP6Port, "Default udp6 ports should be the same");
 });

 it("should encode to RLP encoding", () => {
   const expectedRLPencodedENR = [
  Buffer.from("7098ad865b00a582051940cb9cf36836572411a47278783077011599ed5cd16b76f2635f4e234738f30813a89eb9137e3e3df5266e3a1f11df72ecf1145ccb9c"), 01, "id", "v4", "ip", Buffer.from("7f000001"), "secp256k1", "03ca634cae0d49acb401d8a4c6b6fe8c55b70d115bf400769cc1400f3258cd3138", "udp", Buffer.from("765f") ];

   const actualRLPencodedENR = ENR.encode();

   assert.deepEqual(actualRLPencodedENR, expectedRLPencodedENR, "RLP encoded ENRs should be the same");
 });

 it("should encode to Txt encoding", () => {
   const expectedTxtEncodedENR = "enr:-IS4QHCYrYZbAKWCBRlAy5zzaDZXJBGkcnh4MHcBFZntXNFrdvJjX04jRzjzCBOonrkTfj499SZuOh8R33Ls8RRcy5wBgmlkgnY0gmlwhH8AAAGJc2VjcDI1NmsxoQPKY0yuDUmstAHYpMa2_oxVtw0RW_QAdpzBQA8yWM0xOIN1ZHCCdl8";
   const actualTxtEncodedENR = ENR.encodeTxt();
   assert.strictEqual(actualTxtEncodedENR, expectedTxtEncodedENR, "Txt encodings of ENRs should be the same");
 });

 it("should decode from RLP encoding", () => {
   const expectedDecodedENR = ENR;
   const actualDecodedENR = EthereumNodeRecord.decode(ENR.encode());
   assert.deepEqual(actualDecodedENR, expectedDecodedENR, "Decoded ENR should be the same as the explicitly defined ENR");
 });
});
