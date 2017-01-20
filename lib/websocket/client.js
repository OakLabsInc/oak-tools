const Client = require('ws')
const url = require('url')
const _ = require('lodash')
const { v4: UUID } = require('node-uuid')
const { EventEmitter } = require('events')
const { join } = require('path')
const Message = require(join(__dirname, '..', 'message'))

/**
 * Web socket to enable communication as sub pub
 */
class WebSocketClient extends EventEmitter {
  /**
   * @constructor
   * @param {string} [uri=wss://localhost:9500] Full URI of server to connect to
   * @param {string} [id=UUID] Unique ID of client, defaults to random UUID
   * @param {Serializer} [serializer] singleton with an encode and decode object to be used
   * @param {Encoder} [serializer.encode=msgpack5/encode] encoder function
   * @param {Decoder} [serializer.decode=msgpack5/decode] decoder function
   */
  constructor ({ uri = 'ws://localhost:9500', id, serializer } = {}) {
    super()
    let _this = this
    /**
     * @prop {string} id Current `id` of client. Defaults to random `UUID()`
     */
    this.id = id || UUID()
    /**
     * @prop {string} uri `uri` which `client` uses to connect
     */
    this.uri = url.parse(uri)
    this.uri.auth = this.id
    this.uri = this.uri.format()
    /**
     * @prop {Array} subscribed Curret subscribed events. Defaults to `['connect']`
     */
    this.subscribed = ['connect']
    /**
     * @prop {Message} message
     */
    this.message = new Message(serializer)
    /**
     * @prop {type} `ws` client
     */
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
   * @description pub Publish a payload to a given event namespace
   * @param {string} namespace - delimited namespace to publish on
   * @param {any} payload - the payload object to publish
   * @memberof WebSocketClient
   */
  pub (namespace, payload) {
    let packed = this.message.pack(namespace, payload)
    if (packed) {
      this.client.send(packed)
    }
    return this
  }

  /**
   * @description sub Subscribe to a event namespace, which will fire on the `client` object
   * @param {string|Array} namespace - delimited namespace
   * @memberof WebSocketClient
   */

  sub (ns) {
    let _this = this
    if (!_.isArray(ns)) {
      ns = [ns]
    }
    this.subscribed = _.union(this.subscribed, ns)
    _.forEach(ns, function (n) {
      _this.pub('sub', n)
    })
    return this
  }

  /**
   * @description unsub Unsubscribe from event namespace(s)
   * @param {string|Array} namespace - delimited namespace
   * @memberof WebSocketClient
   */
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
    return this
  }

  /**
   * @description close the client connection
   * @memberof WebSocketClient
   */
  close () {
    if (this.client) {
      this.client.close(1000, '', {
        keepClosed: true
      })
    }
    return this
  }
}

module.exports = WebSocketClient
