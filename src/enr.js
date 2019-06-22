const crypto = require('libp2p-crypto')
const Buffer = require('Buffer')
const RLP = require('rlp')

// Constants in bytes
const MAX_RECORD_SIZE = 300
const SEQUENCE_SIZE = 8

class IdentityScheme {
  
  constructor () {
    this.defaultSchemeList = "v4"
  }

  static sign (content) {
  
  }

  static verify (signatures, pubKey) {
  
  }

  static derive (pubKey) {
  
  }
}

/*
 * Implementation of an Ethereum Node Record (ENR) as defined in EIP 778
 * */
class EthereumNodeRecord {
  /**
   * constructor
   * @param Buffer
   * @param number
   * @param Map<String, Buffer>
   */
  constructor () {
    this.signature = Buffer.from('')
    this.sequence = BigInt(0)
    this.keyPairs = new Map([
      ["id", "v4"],
      ["secp256k1", ""],
      ["ip", ""],
      ["tcp", ""],
      ["udp", ""]])    
  }

  encode () {
    let content = RLP.encode([
      this.sequence,
      "id", this.keyPairs.get("id"),
      "secp256k1", this.keyPairs.get("secp256k1"),
      "ip", this.keyPairs.get("ip"),
      "tcp", this.keyPairs.get("tcp"),
      "udp", this.keyPairs.get("udp")
    ])
    this.signature = IdentityScheme.sign(content)
    let totalSize = content.length + this.signature.length
    if (totalSize > MAX_RECORD_LENGTH) {
      // reject record
      return new Error("Size of the record is larger than 300 bytes. It's size is " + totalSize)
    }
    let record = Buffer.concat([RLP.encode(signature), content])
    return record
  }

  encodeTxt() {
    let record = this.encode()
    return "enr:" + record.toString('base64')
  }

  increaseSequenceNumber(offset) {
    this.sequence += BigInt(offset)
  }  

  setNewKeyValPairs (keyValPairs) {
     keyValPairs.forEach((key, val) => {
       this.keyPairs.set(key, val)
     })
  }

}

module.exports = EthereumNodeRecord
