const { join } = require('path')
const tools = require(join(__dirname, '..'))

const logger = tools.logger({
  pretty: true
})

let Server = tools.server('websocket')
let server = new Server({
  port: 9500,
  logger
})

server
  .on('error', function (err) {
    logger.error({ err })
  })
  .on('connection', function (ID) {
    logger.info({ name: 'connection', msg: ID })
  })
  .on('reconnect', function (ID) {
    logger.info({ name: 'reconnect', msg: ID })
  })
  .on('close', function (ID) {
    logger.info({ name: 'closed', msg: ID })
  })
  .on('toserver.**', function (msg, ID) {
    logger.info({ name: 'toserver.**', event: this.event, msg, from: ID })
    server.pub('toclient.hello', 'a/s/l?')
  })
  .on('toserver.question', function () {
    server.pub('toclient.answer', 'I am the server, did you not call me?')
  })
