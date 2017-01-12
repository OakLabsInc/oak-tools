const { join } = require('path')
const logger = require(join(__dirname, '..', '..', 'logger'))()
const _ = require('lodash')
const Client = require('ws')
const url = require('url')
const guid = require('node-uuid')
const WebSocketServer = require(join(__dirname, 'server'))
// const { encode, decode } = require('msgpack5')()

/**
 * @description Web socket to enable communication as sub pub
 * @class WebSocketClient
 */
class WebSocketClient {
  /**
   * Creates an instance of WebSocketClient.
   * @param  {string} port='9500' - assign port to the socket
   * @param  {string} hostName='localhost' - assign the host name of the socket
   * @param  {string} protocol='wss' - assign the protocol of the socket
   * @param  {string} socketUrl=null - give a full socketUrl. Suppress <port>,<hostName> and <protocol>
   * @memberOf WebSocketClient
   */
  constructor ({ port = '9500',
                  hostName = 'localhost',
                  protocol = 'wss',
                  socketUrl = null,
                  onMessage = function () {},
                  onOpen = function () {},
                  onClose = function () {} }) {
    let self = this
    self.onMessage = onMessage
    self.onClose = onClose
    if (!_.isNull(socketUrl)) {
      let urlParts = url.parse(socketUrl)
      port = urlParts.port
      hostName = urlParts.hostname
      protocol = urlParts.protocol
    }
    self.port = port
    self.hostName = hostName
    self.protocol = protocol
    self.client = self.webSocketClient
    self.client.on('open', function () {
      logger.debug({
        event: 'onOpen',
        properties: {
          msg: `client open connection`
        }
      })
      onOpen()
    })
    self.client.on('message', onMessage)
    self.client.on('close', onClose)
    return self
  }

  /**
   * @readonly
   * @description create a client web socket property
   * @return {WebSocketClient} a web socket client
   * @memberOf WebSocketClient
   */
  get webSocketClient () {
    let self = this
    let client = new Client(`${self.protocol || 'wss:'}//${self.hostName || 'localhost'}:${self.port || 9500}`)
    client.clientId = guid.v4()
    client.namespaces = []
    return client
  }

  /**
   * @description publish <data> to a given namespace <see namespace>
   * @param {string} namespace - comma delimited namespaces to publish to
   * @param {any} data - the data to publish
   * @param {any} {encoder} - an encoder function to encode the data with. Must support json
   * @memberOf WebSocketClient
   */
  publish (namespace, data, {encoder}) {
    logger.debug(`Start client publish(${namespace}, ${data}, {encoder})`)
    let self = this
    let splittedNamespaces = [..._.split(namespace, ',')]
    // if (!_.isObject(data)) {
    data = {data: data}
    // }
    logger.debug('namespaces', namespace)
    logger.debug('client', self.client.clientId)
    _.forEach(splittedNamespaces, function (ns) {
      WebSocketServer.publish(ns, data)
    })
  }

  /**
   * @description subscribe a client to a given <see namespace>
   * @param {string} [namespace='all'] - comma delimited namespaces. Value of 'all' (default) will fire for any namespace
   * @param {WebSocketClient} [client=null] - if client is null (default) this function will create
   * a new web socket client  <see WebSocketClient>
   * @param {Function} [cb=function (obj) {}] - call back function when the socket is open. Obj is the error object. If not null something happened
   * @returns {WebSocketClient} - new client if <see client> is null or the passed client with updated namespaces property
   * @memberOf WebSocketClient
   */
  subscribe (namespace = 'all', cb = function (obj) {}) {
    logger.debug(`Start client subscribe (${namespace}, ${cb})`)
    let self = this
    let namespaces = []
    let splitted = _.split(namespace, ',')

    namespaces = self.client.namespaces
    namespaces.push(...splitted)
    namespaces = _.uniq(namespaces)
    logger.debug({
      event: 'subscribe',
      properties: {
        msg: `recieved namespaces: ${namespaces}`
      }
    })

    self.client.namespaces = namespaces

    cb(null, WebSocketServer.subscribe(self.client, cb))
  }

  /**
   * @description close function to either remove namespaces from a client or close the client
   * @param {string} [namespaces = null] - namespace the client want to unsubscribe.
   * If namespace is null the client will be closed.
   * If no more namespaces are in the client, the connection will be closed
   * @memberOf WebSocketClient
   */
  close (namespaces = null) {
    logger.debug(`Start close (${namespaces})`)
    let self = this
    logger.debug('namespaces', self.client.namespaces)
    if (_.isNull(self.client) || _.isUndefined(self.client)) {
      logger.debug({
        event: 'close',
        properties: {
          msg: 'client is null'
        }
      })
      return
    }
    self.client = WebSocketServer.close({client: self.client, namespaces: namespaces})
    if (self.client.namespaces.length === 0) {
      if (_.isFunction(self.onClose)) {
        self.onClose(self.client)
      } else {
        self.client.close()
      }
    }

    // let clientId = client.clientId
    // if (_.isNull(client = WebSocketClient.getClient(clientId, WebSocketClient.clients))) {
    //   logger.debug({
    //     event: 'close',
    //     properties: {
    //       msg: `client with id: ${clientId} was not found`
    //     }
    //   })
    //   return
    // }

  // if (_.isNull(namespaces)) {
  //   logger.debug(`namespaces is null. Closing client:${client.clientId}`)
  //   client.close()
  //   _.pullAt(WebSocketClient.clients, WebSocketClient.getClientIndex(client.clientId, WebSocketClient.clients))
  // } else {
  //   let splittedNamespaces = [..._.split(namespaces, ','), 'all']
  //   client.namespaces = _.pull(client.namespaces, ...splittedNamespaces)
  //   logger.debug(`namespces remained for clientid ${client.clientId}: ${client.namespaces.length > 0 ? client.namespaces : '[]'}`)
  //   if (client.namespaces.length === 0) {
  //     client.close()
  //     _.pullAt(WebSocketClient.clients, WebSocketClient.getClientIndex(client.clientId, WebSocketClient.clients))
  //   }
  // }
  }

  /**
   * @description a method to insert or update the client within the list of clients
   * @static
   * @param {WebSocketClient} client the client to insert or update
   * @param {array} clients the list of WebSocketClient to work with
   * @returns the list of the new clients
   * @memberOf WebSocketClient
   */
  static insertUpdateClient (client, clients) {
    let clientIndex = WebSocketClient.getClientIndex(client.clientId, clients)
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
   * @memberOf WebSocketClient
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
   * @memberOf WebSocketClient
   */
  static getClient (clientId, clients) {
    let index = WebSocketClient.getClientIndex(clientId, clients)
    if (index === -1) return null
    return clients[index]
  }
}

module.exports = WebSocketClient

// some test code. Just run node ./socket/index.js
// let server = new WebSocketClient({socketUrl: 'ws://localhost:9500'})
// let client2 = server.subscribe('ns1', null, function () {
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
