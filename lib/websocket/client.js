const Client = require('ws')
const url = require('url')
const _ = require('lodash')
const { v4: UUID } = require('node-uuid')
const { EventEmitter } = require('events')
const { join } = require('path')
const Message = require(join(__dirname, '..', 'message'))

/**
 * @description Web socket to enable communication as sub pub
 * @class WebSocketClient
 */
class WebSocketClient extends EventEmitter {
  /**
   * Creates an instance of WebSocketClient.
   * @param  {string} uri=wss://localhost:9500 - Full URI of server to connect to
   * @param  {string} id=UUID - Unique ID of client, defaults to random UUID
   * @param  {object} serializer=msgpack - singleton with an encode and decode object to be used
   * @memberOf WebSocketClient
   */
  constructor ({ uri = 'ws://localhost:9500', id, serializer } = {}) {
    super()
    let _this = this
    this.id = id || UUID()

    this.uri = url.parse(uri)
    this.uri.auth = this.id
    this.uri = this.uri.format()

    this.subscribed = ['connect']
    this.message = new Message(serializer)
    this.client = new Client(this.uri)
    this.client
      .on('open', () => _this.emit('open'))
      .on('close', () => _this.emit('close'))
      .on('message', function (msg) {
        let unpacked = _this.message.unpack(msg)
        if (unpacked) {
          let { ns, pl } = unpacked
          _this.emit(ns, pl)
        }
      })

    return _this
  }

  /**
   * @description pub <namespace, payload> to a given namespace <see namespace>
   * @param {string} namespace - delimited namespace to publish on
   * @param {any} payload - the payload object to publish
   * @memberOf WebSocketClient
   */
  pub (namespace, payload) {
    let packed = this.message.pack(namespace, payload)
    if (packed) {
      this.client.send(packed)
    }
  }

  sub (ns) {
    let _this = this
    if (!_.isArray(ns)) {
      ns = [ns]
    }
    this.subscribed = _.union(this.subscribed, ns)
    _.forEach(ns, function (n) {
      _this.pub('sub', n)
    })
  }

  unsub (ns) {
    let _this = this
    if (!_.isArray(ns)) {
      ns = [ns]
    }
    _.remove(this.subscribed, function (n) {
      return _.includes(ns, n)
    })
    _.forEach(ns, function (n) {
      _this.pub('unsub', n)
    })
  }

  /**
   * @description close the client connection
   * @memberOf WebSocketClient
   */
  close () {
    if (this.client) {
      this.client.close(1000, '', {
        keepClosed: true
      })
    }
  }
}

module.exports = WebSocketClient
