const UUID = require('uuid/v4')
const _ = require('lodash')
const { Buffer } = require('safe-buffer')
const { Server } = require('ws')
const { EventEmitter2 } = require('eventemitter2')
const { createHash } = require('crypto')
const { join } = require('path')
const Message = require(join(__dirname, '..', 'message'))
const glob = require('minimatch')
const heartbeats = require('ws-heartbeats')

/**
 * Web socket to enable communication as sub pub
 */
class WebSocketServer extends EventEmitter2 {
  /**
   * Creates an instance of WebSocketServer.
   * @see {@link https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocketserver|ws}
   * @constructor
   * @param {Object} [options] `WS` server options
   * @param {Number} [options.port=9500] server port
   * @param {String} [options.host=localhost] server host
   * @param {Boolean} [options.clientTracking=true] client tracking
   * @param {Boolean} [options.heartbeats=true] use WS ping/pong heartbeats
   * @param {logger|Boolean} [options.logger={logger}] Optional logger to pass in, or use a default instance of {logger} set to debug level
   * @param {Function} [callback] executed when the server is ready
   * @fires WebSocketServer#connection
   * @fires WebSocketServer#reconnect
   * @fires WebSocketServer#close
   * @fires WebSocketServer#error
   * @returns {WebSocketServer}
   */

  constructor (opts = {}, callback = function () {}) {
    super({ wildcard: true })
    let _this = this

    opts = _.defaultsDeep(opts, {
      clientTracking: true,
      heartbeats: true,
      logger: false
    })

    this.message = new Message(opts.serializer)

    /**
     * @prop {Object} connections dictionary of connected clients
     */
    this.connections = {}
    /**
     * @prop {logger} logger the logger of this instance
     */
    if (_.isBoolean(opts.logger)) {
      opts.logger = new (require(join(__dirname, '..', 'logger')))({
        level: opts.logger === true ? 'debug' : 'fatal',
        pretty: opts.logger
      })
    }
    this.logger = opts.logger
    /**
     * @prop {Object} server instance
     * @see {@link https://github.com/websockets/ws|WS}
     */
    this.server = new Server(opts, callback)

    this.server
      .on('connection', function (socket, { headers } = {}) {
        if (opts.heartbeats) {
          // start ping/pong heartbeats
          heartbeats(socket)
        }
        // use the http basic auth as ID
        let rawID = _.has(headers, 'authorization') ? new Buffer(
          headers.authorization.replace('Basic ', ''),
          'base64'
        ).toString() : UUID()
        let ID = makeSHA(rawID)

        // has previously connected
        if (_this.connections.hasOwnProperty(ID)) {
          // TODO: wait timer cancel
          let conn = _this.connections[ID]
          conn.socket = socket
          conn.open = true
          /**
           * `id` of reconnected client
           * @event WebSocketServer#reconnect
           * @type {String}
           */
          let encoded = _this.message.pack('reconnect', ID)
          if (encoded) {
            socket.send(encoded)
          }
          _this.emit('reconnect', ID)
        } else {
          // set connection key to SHA
          _this.connections[ID] = {
            id: ID,
            open: true,
            namespaces: [
              'connect', 'reconnect'
            ],
            socket
          }
          let encoded = _this.message.pack('connect', ID)
          if (encoded) {
            socket.send(encoded)
          }
          /**
           * `id` of connected client
           * @event WebSocketServer#connection
           * @type {String}
           */
          _this.emit('connection', ID)
        }

        socket.cleanupClose = function () {
          let conn = _this.connections[ID]
          conn.open = false
          conn.namespaces = ['connect', 'reconnect']
          // TODO: start close timer to kill connection
        }
        /**
         * `id` of closed client
         * @event WebSocketServer#close
         * @type {String}
         */
        socket.on('close', function () {
          _this.emit('close', ID)
          socket.cleanupClose()
        })
        /**
         * `error` object from client disconnection (most likely)
         * @event WebSocketServer#error
         * @type {Object}
         */
        socket.on('error', function (err) {
          _this.emit('error', err)
          socket.cleanupClose()
        })

        // decode message, should be an array
        // last array item is the payload, everything before is the namespace joined by `.`
        // example: ['person', 'name', { first: 'John', last: 'Smith' }]
        socket.on('message', function (data) {
          let decoded = _this.message.unpack(data)
          if (decoded) {
            let { ns, pl } = decoded
            _this.logger.debug({
              name: 'message', id: ID, ns, pl
            })
            switch (ns) {
              case '_sub': {
                if (!_.isArray(pl)) {
                  pl = [pl]
                }
                _this.connections[ID].namespaces = _.union(_this.connections[ID].namespaces, pl)
                _this.logger.debug({
                  name: '_sub',
                  namespaces: _this.connections[ID].namespaces
                })
                break
              }
              case '_unsub': {
                _.remove(_this.connections[ID].namespaces, function (n) {
                  return n === pl
                })
                _this.logger.debug({
                  name: '_unsub',
                  namespaces: _this.connections[ID].namespaces
                })

                break
              }
              default: {
                _this.emit(ns, pl, ID)
                break
              }
            }
          }
        })
      })
      .on('error', function (err) {
        _this.emit('error', err)
      })

    return this
  }

  /**
   * Publish data to a given namespace
   * @param {String} namespace event namespace
   * @param {any} data the data to publish
   * @memberof WebSocketServer
   */
  pub (namespace, data) {
    let _this = this
    let packed = _this.message.pack(namespace, data)
    this.logger.debug({
      name: 'pub', namespace, data
    })
    if (packed) {
      _.forEach(_this.connections, function ({ namespaces, socket, open }) {
        if (open) {
          _.forEach(namespaces, function (n) {
            if (glob(namespace, n)) {
              _this.logger.debug({
                name: 'pub', namespace, data
              })
              try {
                socket.send(packed)
              } catch (err) {
                _this.emit('error', new Error(err))
              }
            }
          })
        }
      })
    }
    return this
  }

  /**
   * @description close the server
   * @param {Object} callback callback when server has closed
   * @memberof WebSocketServer
   */
  close (cb = function () {}) {
    if (this.server) {
      this.server.close(cb)
    }
    return this
  }
}

function makeSHA (str) {
  let shasum = createHash('sha1')
  shasum.update(str)
  return shasum.digest('hex')
}

module.exports = WebSocketServer
