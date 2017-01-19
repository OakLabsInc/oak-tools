const _ = require('lodash')

const { Server } = require('ws')
const { EventEmitter } = require('events')
const { createHash } = require('crypto')
const { v4: UUID } = require('node-uuid')
const { join } = require('path')
const Message = require(join(__dirname, '..', 'message'))

// const protectedNamespaces = [
//   'close',
//   'connect',
//   'error',
//   'ready',
//   'reconnect'
// ]

/**
 * @description Web socket to enable communication as sub pub
 * @class WebSocketServer
 */
class WebSocketServer extends EventEmitter {
  /**
   * Creates an instance of WebSocketServer.
   * @param  {string} port='9500' - assign port to the socket
   * @param  {string} host='localhost' - assign the host name of the socket
   * @memberOf WebSocketServer
   */
  constructor ({ port = 9500, host = 'localhost', serializer } = {}, callback = function () {}) {
    super()
    let _this = this
    this.message = new Message(serializer)

    this.connections = {}

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
          _this.emit('reconnect', ID)
        } else {
          // set connection key to SHA
          _this.connections[ID] = {
            id: ID,
            open: true,
            namespaces: [
              'connect'
            ],
            socket
          }
          _this.connect
          let encoded = _this.message.pack('connect', ID)
          if (encoded) {
            socket.send(encoded)
          }
          _this.emit('connection', ID)
        }

        socket.cleanupClose = function () {
          _this.connections[ID].open = false
          // TODO: start close timer to kill connection
        }

        socket.on('close', function () {
          _this.emit('close', ID)
          socket.cleanupClose()
        })

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
            switch (ns) {
              case 'sub': {
                _this.connections[ID].namespaces = _.union(_this.connections[ID].namespaces, [pl])
                break
              }
              case 'unsub': {
                _.remove(_this.connections[ID].namespaces, function (n) {
                  return n === ns
                })
                break
              }
              default: {
                _this.emit(ns, pl)
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
   * @description pub <data> to a given namespace <see namespace>
   * @param {string} namespace - comma delimited namespaces to publish to
   * @param {any} data - the data to publish
   * @memberOf WebSocketServer
   */
  pub (namespace, data) {
    let _this = this
    let packed = _this.message.pack(namespace, data)
    if (packed) {
      _.forEach(_this.connections, function ({ namespaces, socket, open }) {
        if (open && _.includes(namespaces, namespace)) {
          try {
            socket.send(packed)
          } catch (err) {
            _this.emit('error', new Error(err))
          }
        }
      })
    }
  }

  /**
   * @description close the server
   * @memberOf WebSocketServer
   */
  close (cb = function () {}) {
    if (this.server) {
      return this.server.close(cb)
    }
  }

}

function makeSHA (str) {
  let shasum = createHash('sha1')
  shasum.update(str)
  return shasum.digest('hex')
}

module.exports = WebSocketServer
