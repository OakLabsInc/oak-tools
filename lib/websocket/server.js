const UUID = require('uuid/v4')
const _ = require('lodash')
const { Server } = require('ws')
const { EventEmitter2 } = require('eventemitter2')
const { createHash } = require('crypto')
const { join } = require('path')
const Message = require(join(__dirname, '..', 'message'))
const glob = require('minimatch')

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
class WebSocketServer extends EventEmitter2 {
  /**
   * Creates an instance of WebSocketServer.
   * @constructor
   * @param {String} [port=9500] server port
   * @param {String} [host=localhost] server host
   * @param {Function} [callback] executed when the server is ready
   * @fires WebSocketServer#connection
   * @fires WebSocketServer#reconnect
   * @fires WebSocketServer#close
   * @fires WebSocketServer#error
   */
  constructor ({ port = 9500, host = 'localhost', serializer } = {}, callback = function () {}) {
    super({ wildcard: true })
    let _this = this
    this.message = new Message(serializer)

    /**
     * @prop {Object} connections dictionary of connected clients
     */
    this.connections = {}

    /**
     * @prop {Object} server instance
     * @instance module:ws
     */
    this.server = new Server({
      port,
      host,
      clientTracking: true
    }, callback)

    this.server
      .on('connection', function (socket) {
        // use the http basic auth as ID
        let rawID = _.has(socket.upgradeReq.headers, 'authorization') ? Buffer(
          socket.upgradeReq.headers.authorization.replace('Basic ', ''),
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
          _this.connect
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
          conn.namespaces = []
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
            log.debug({
              name: 'message', id: ID, ns, pl
            })
            switch (ns) {
              case '_sub': {
                if (!_.isArray(pl)) {
                  pl = [pl]
                }
                _this.connections[ID].namespaces = _.union(_this.connections[ID].namespaces, pl)
                log.debug({
                  name: '_sub',
                  namespaces: _this.connections[ID].namespaces
                })
                break
              }
              case '_unsub': {
                _.remove(_this.connections[ID].namespaces, function (n) {
                  return n === pl
                })
                log.debug({
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
    log.debug({
      name: 'pub', namespace, data
    })
    if (packed) {
      _.forEach(_this.connections, function ({ namespaces, socket, open }) {
        if (open) {
          _.forEach(namespaces, function (n) {
            if (glob(namespace, n)) {
              log.debug({
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
