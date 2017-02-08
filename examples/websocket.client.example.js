const { join } = require('path')
const tools = require(join(__dirname, '..'))

const logger = tools.logger({
  pretty: true
})

let Client = tools.client('websocket')
let client = new Client({
  id: 'testclient',
  logger
})

client.on('ready', function () {
  logger.info({
    name: 'ready'
  })
  client
    .on('toclient.*', function (msg) {
      logger.info({ name: 'toclient.*', event: this.event, msg })
    })
    .pub('toserver.question', 'hey who are you?', function (err) {
      if (err) {
        logger.error('pub tosever error', { name: 'pub', err })
      }
    })
})
.on('error', function (err) {
  logger.error({ err })
})
.on('connect', function (ID) {
  logger.info({ name: 'connect', msg: ID })
})
.on('reconnect', function (ID) {
  logger.info({ name: 'reconnect', msg: ID })
})

client.client.on('ping', function () {
  logger.info({ name: 'ping' })
})

client.client.on('pong', function () {
  logger.info({ name: 'pong' })
})
