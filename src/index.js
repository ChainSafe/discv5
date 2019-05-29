'use strict'

const EventEmitter = require('events').EventEmitter
const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')
const KadDHT = require('libp2p-kad-dht')
const debug = require('debug')
const log = debug('libp2p:discv5')
const nextTick = require('async/nextTick')
const ENR = require('./enr')

class Discv5 extends EventEmitter {
  constructor (options) {
    super()
  }

  start (callback) {
  
  }

  stop (callback) {
  
  }
}

exports = module.exports = Discv5
exports.tag = 'discv5'
