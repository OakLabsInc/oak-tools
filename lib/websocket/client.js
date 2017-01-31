const UUID = require('uuid/v4')
const Client = require('ws')
const url = require('url')
const _ = require('lodash')
const { EventEmitter2 } = require('eventemitter2')
const { join } = require('path')
const Message = require(join(__dirname, '..', 'message'))

let log = { debug: function () {} }

if (process.env.NODE_ENV !== 'production') {
  log = new (require(join(__dirname, '..', 'logger')))({
    level: 'debug',
    pretty: true
  })
}

/**
 * Web socket to enable communication as sub pub
 */
class WebSocketClient extends EventEmitter2 {
  /**
   * @constructor
   * @param {Object} [options] options object
   * @param {String} [options.uri=ws://localhost:9500] Full URI of server to connect to
   * @param {String} [options.id=UUID] Unique ID of client, defaults to random UUID
   * @param {Serializer} [options.serializer] singleton with an encode and decode object to be used
   * @param {Encoder} [options.serializer.encode=msgpack5/encode] encoder function
   * @param {Decoder} [options.serializer.decode=msgpack5/decode] decoder function
   * @fires WebSocketClient#ready
   * @fires WebSocketClient#close
   * @fires WebSocketClient#connect
   * @returns {WebSocketClient}
   */
  constructor ({ uri = 'ws://localhost:9500', id, serializer } = {}) {
    super({
      wildcard: true,
      newListener: true
    })
    let _this = this
    /**
     * @prop {String} id Current `id` of client. Defaults to random `UUID()`
     */
    this.id = id || UUID()
    /**
     * @prop {String} blacklistNamespaces array of namespaces that will be filtered out in pub()
     */
    this.blacklist = [
      '_pub',
      '_sub',
      '_unsub',
      'close',
      'connect',
      'error',
      'message',
      'open',
      'ping',
      'pong',
      'reconnect',
      'ready',
      'unexpected-response'
    ]
    /**
     * @prop {String} uri `uri` which `client` uses to connect
     */
    this.uri = url.parse(uri)
    this.uri.auth = this.id
    this.uri = this.uri.format()
    /**
     * @prop {Array} subscribed Curret subscribed events. Defaults to `['connect']`
     */
    this.subscribed = []
    /**
     * @prop {Message} message
     */
    this.message = new Message(serializer)
    /**
     * @prop {Object} WS client
     * @see {@link https://github.com/websockets/ws|WS}
     */
    this.client = new Client(this.uri)
    this.client
      .on('open', () => {
        if (_this.client.readyState === 1) {
          /**
           * client has opened and is ready
           * @event WebSocketClient#ready
           */
          _this.emit('ready')
          _this._send('_sub', _this.subscribed)
        }
      })
      /**
       * client has closed connection
       * @event WebSocketClient#close
       */
      .on('close', () => _this.emit('close'))
      /**
       * client has received a connect event
       * @event WebSocketClient#connect
       * @type {String}
       */

      .on('message', function (msg) {
        let unpacked = _this.message.unpack(msg)
        if (unpacked) {
          let { ns, pl } = unpacked
          log.debug({
            name: 'message', pl, ns
          })
          _this.emit(ns, pl)
        }
      })

    this.on('removeListener', function (ns, fn) {
      if (_this._isSubscribed(ns)) {
        _.remove(_this.subscribed, function (n) {
          return n === ns
        })
        _this._send('_unsub', ns)
      }
    })

    this.on('newListener', function (ns, fn) {
      if (!_this._isSubscribed(ns) && !_this._isBlacklisted(ns)) {
        _this.subscribed = _.union(_this.subscribed, [ns])
        _this._send('_sub', ns)
      }
    })

    return _this
  }
  /**
   * @memberof WebSocketClient
   * @prop {Boolean} connecting client is connecting
   */
  get connecting () {
    return this.client.readyState === 0
  }
  /**
   * @memberof WebSocketClient
   * @prop {Boolean} connecting client is open
   */
  get open () {
    return this.client.readyState === 1
  }
  /**
   * @memberof WebSocketClient
   * @prop {Boolean} connecting client is closeing
   */
  get closing () {
    return this.client.readyState === 2
  }
  /**
   * @memberof WebSocketClient
   * @prop {Boolean} connecting client is closed
   */
  get closed () {
    return this.client.readyState === 3
  }

  /**
   * @description pub Publish a payload to a given event namespace
   * @param {String} namespace - delimited namespace to publish on
   * @param {Number|String|Object} payload - the payload object to publish
   * @param {Function} [callback] - optional callback for message sent
   * @returns {WebSocketClient}
   * @memberof WebSocketClient
   */
  pub (namespace, payload, callback = function () {}) {
    if (this._isBlacklisted(namespace)) {
      callback(new Error(`Cannot publish on blacklisted namespace: ${namespace}`))
      return this
    }
    this._send(namespace, payload, callback)
    return this
  }

  /**
   * @description close the client connection
   * @returns {WebSocketClient}
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

  /**
   * @private
   */
  _send (namespace, payload, callback = function () {}) {
    let packed = this.message.pack(namespace, payload)
    if (packed) {
      try {
        this.client.send(packed, callback)
      } catch (err) {
        this.client.emit('error', err)
        callback(err)
      }
    } else {
      callback(new Error('Packing payload did not succeed'))
    }
    return this
  }
  /**
   * @private
   */
  _isSubscribed (ns) {
    return _.includes(this.subscribed, ns)
  }
  /**
   * @private
   */
  _isBlacklisted (ns) {
    return _.includes(this.blacklist, ns)
  }

}

module.exports = WebSocketClient
