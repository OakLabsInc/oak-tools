const { join } = require('path')
const logger = require(join(__dirname, '..', '..', 'logger'))()
const _ = require('lodash')
const WebSocketClient = require('ws')
const url = require('url')
const WS = WebSocketClient.Server

/**
 * @description Web socket to enable communication as sub pub
 * @class WebSocketServer
 */
class WebSocketServer {
  /**
   * Creates an instance of WebSocketServer.
   * @param  {string} port='9500' - assign port to the socket
   * @param  {string} hostName='localhost' - assign the host name of the socket
   * @param  {string} protocol='wss' - assign the protocol of the socket
   * @param  {string} socketUrl=null - give a full socketUrl. Suppress <port>,<hostName> and <protocol>
   * @memberOf WebSocketServer
   */
  constructor ({port = '9500', hostName = 'localhost', protocol = 'wss', socketUrl = null, encoder = JSON.stringify, decoder = JSON.parse}) {
    let self = this
    /**
     * clients will be in array of objects. Each object will contain the following keys:
     *  * clientId: {uuid}
     *  * client: {WebSocketClient}
     *  * namespaces: {array}
     */
    WebSocketServer.clients = []
    WebSocketServer.encoder = encoder
    WebSocketServer.decoder = decoder
    console.log('encoder', WebSocketServer.encoder, encoder)
    if (!_.isNull(socketUrl)) {
      let urlParts = url.parse(socketUrl)
      port = urlParts.port
      hostName = urlParts.hostname
      protocol = urlParts.protocol
    }
    self.port = port
    self.hostName = hostName
    self.protocol = protocol
    if (!self.instance) {
      if (_.isNull(hostName)) {
        self.wss = new WS({port: port})
      } else {
        self.wss = new WS({port: port, host: hostName})
      }
      self.wss.on('connection', function (socket) {
        logger.info({
          event: 'ws.connections',
          properties: {}
        })
        socket.on('close', function () {
          logger.info({
            event: 'client.close',
            properties: {}
          })
        })
        socket.on('message', function (data, flags) {
          logger.debug({
            event: 'client.message',
            data: data
          })
          socket.send(data)
        })
      })
      WebSocketServer.instance = self
    }
    return WebSocketServer.instance
  }

  /**
   * @description publish <data> to a given namespace <see namespace>
   * @param {string} namespace - comma delimited namespaces to publish to
   * @param {any} data - the data to publish
   * @memberOf WebSocketServer
   */
  static publish (namespace, data) {
    logger.debug(`Start Server publish(${namespace}, ${data})`)

    let splittedNamespaces = [..._.split(namespace, ',')]
    let clients = _.filter(WebSocketServer.clients, _.conforms({'namespaces': function (n) {
      let found = false
      _.forEach(splittedNamespaces, function (ns) {
        if (_.indexOf(n, ns) > -1) {
          found = true
          return found
        }
      })
      return found
    }}))
    if (!_.isObject(data)) {
      data = {data: data}
    }

    if (clients.length > 0) {
      _.forEach(clients, function (client) {
        _.forEach(splittedNamespaces, function (ns) {
          if (_.indexOf(client.namespaces, ns) > -1) {
            data.ns = ns
            logger.debug('client id', client.clientId)
            client.send(WebSocketServer.encoder(data))
          }
        })
      })
    } else {
      logger.debug({
        event: 'publish',
        properties: {
          msg: `0 clients were found for namespaces: ${namespace}`
        }
      })
    }
  }

  /**
   * @description subscribe a client to a given <see namespace>
   * @param {string} [namespace='all'] - comma delimited namespaces. Value of 'all' (default) will fire for any namespace
   * @param {WebSocketClient} [client=null] - if client is null (default) this function will create
   * a new web socket client  <see WebSocketServer>
   * @param {Function} [cb=function (obj) {}] - call back function when the socket is open. Obj is the error object. If not null something happened
   * @returns {WebSocketClient} - new client if <see client> is null or the passed client with updated namespaces property
   * @memberOf WebSocketServer
   */
  static subscribe (client, cb = function (obj) {}) {
    logger.debug(`Start Server subscribe (${_.isNull(client) ? 'null, null' : client.namespaces + ',client'}, ${cb})`)
    logger.debug(`client id: ${client.clientId}`)
    // if (!_.isNull(client) && _.isNull(WebSocketServer.getClient(client.clientId, WebSocketServer.clients))) {
    //   logger.warning({
    //     event: 'subscribe',
    //     properties: {
    //       msg: `client object with id: ${client.clientId} wasn't found in clients object`
    //     }
    //   })
    //   cb({type: 'Client not exists', msg: "client object wasn't part of existing clients"})
    // }

    if (_.isNull(client)) {
      logger.debug({
        event: 'subscribe',
        properties: {
          msg: 'client was null. Cannot do anything'
        }})
      return client
    }

    WebSocketServer.clients = WebSocketServer.insertUpdateClient(client, WebSocketServer.clients)
    return client
  }

  /**
   * @description close function to either remove namespaces from a client or remove the client from the list.
   * It is up to the client to implement the close function.
   * @param {any} {client, namespaces = null} - sending the client to work with and the namepsace.
   * If namespace is null the client will be closed.
   * If no more namespaces are in the client, the connection will be closed
   * @returns updated client with reminder of namespaces.
   * @memberOf WebSocketServer
   */
  static close ({ client, namespaces = null }) {
    logger.debug(`Start close (client, ${namespaces})`)

    if (_.isNull(client) || _.isUndefined(client)) {
      logger.debug({
        event: 'close',
        properties: {
          msg: 'client is null'
        }
      })
      return client
    }
    let clientId = client.clientId
    let tmpClient = null
    if (_.isNull(tmpClient = WebSocketServer.getClient(clientId, WebSocketServer.clients))) {
      logger.debug({
        event: 'close',
        properties: {
          msg: `client with id: ${clientId} was not found`
        }
      })
      return client
    }
    client = tmpClient
    if (_.isNull(namespaces)) {
      logger.debug(`namespaces is null. Client should closing the object. Client:${client.clientId}`)
      client.namespaces = []
      _.pullAt(WebSocketServer.clients, WebSocketServer.getClientIndex(client.clientId, WebSocketServer.clients))
    } else {
      let splittedNamespaces = [..._.split(namespaces, ','), 'all']
      client.namespaces = _.pull(client.namespaces, ...splittedNamespaces)
      logger.debug(`namespces remained for clientid ${client.clientId}: ${client.namespaces.length > 0 ? client.namespaces : '[]'}`)
    }

    return client
  }

  /**
   * @description a method to insert or update the client within the list of clients
   * @static
   * @param {WebSocketClient} client the client to insert or update
   * @param {array} clients the list of WebSocketClient to work with
   * @returns the list of the new clients
   * @memberOf WebSocketServer
   */
  static insertUpdateClient (client, clients) {
    let clientIndex = WebSocketServer.getClientIndex(client.clientId, clients)
    if (clientIndex === -1) {
      clients.push(client)
    } else {
      clients[clientIndex].namespaces = client.namespaces
    }

    return clients
  }

  /**
   * @description get the client index from the list clietns. -1 if not found
   * @static
   * @param {uuid} clientId the client id
   * @param {array} clients a list of WebSocketClient to look for clientId
   * @returns -1 if not found. Otherwise the 0 base index
   * @memberOf WebSocketServer
   */
  static getClientIndex (clientId, clients) {
    return _.findIndex(clients, {clientId})
  }

  /**
   * @description get the client from the list clients. Returns null if not found
   * @static
   * @param {uuid} clientId the client id to search for
   * @param {array} clients a list of WebSocketClient to search for clientId
   * @returns null if not found. Otherwise the object {WebSocketClient}
   * @memberOf WebSocketServer
   */
  static getClient (clientId, clients) {
    let index = WebSocketServer.getClientIndex(clientId, clients)
    if (index === -1) return null
    return clients[index]
  }
}

module.exports = WebSocketServer

// // some test code. Just run node ./socket/index.js
// let Client = require(join(__dirname, 'client'))
// // const { encode, decode } = require('msgpack5')()
// let server = new WebSocketServer({socketUrl: 'ws://localhost:9500'})
// let client2 = new Client({socketUrl: 'ws://localhost:9500'}, {onMessage: function (data, flags) {
//   console.log('client2', data, flags)
//   client2.close()
//   client1.close()
// },
//   onOpen: function () {
//     console.log('client2 open')
//     client2.subscribe('ns1', function () {
//       console.log('subscribed')
//     })
//   },
//   onClose: function () {
//     console.log('client2 closed')
//   }
// })
// let client1 = new Client({socketUrl: 'ws://localhost:9500'}, {onMessage: function (data, flags) {
//   console.log('client1', data, flags)
// },
//   onOpen: function () {
//     console.log('client1 Open')
//     client1.publish('ns1', {msg: 'hello from client1'}, {encoder: JSON.stringify})
//   },
//   onClose: function () {
//     console.log('client1 closed')
//   }
// })
 // server.subscribe('ns1', null, function () {
// })

// client2.on('message', function (data, flags) {
//   logger.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~inside client2 message')
//   // logger.info({data, flags})
//   data = decode(data)
//   switch (data.ev) {
//     case 'ns1':
//       console.log('Success')
//       console.log(server.clients.length)
//       server.close({client: client2, namespace: 'ns1'})
//       console.log(server.clients.length)
//       server.publish('ns2,ns1', 'This is a test for ns2', {encoder: encode})
//       break
//     case 'ns2':
//       console.log('did\'t expect ns1')
//       break
//     default:
//       console.log('oh dang something is not write')
//       break
//   }
// })

// client2.on('close', function () {
//   console.log('wha wha whaaaaa i was closed')
// })

// let client1 = server.subscribe('ns1,ns2', null, function () {
//   server.publish('ns2,ns1', 'This is a test for ns2', {encoder: encode})
// })

// client1.on('message', function (data, flags) {
//   logger.info('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~inside client1 message')
//   // logger.info({data, flags})
//   data = decode(data)
//   switch (data.ev) {
//     case 'ns1':
//       console.log('did\'t expect ns1')
//       break
//     case 'ns2':
//       console.log('Success')
//       break
//     default:
//       console.log('oh dang something is not write')
//       break
//   }
// })
