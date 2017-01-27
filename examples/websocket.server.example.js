const { join } = require('path')
const tools = require(join(__dirname, '..'))

const log = tools.logger({
  pretty: true
})

let Server = tools.server('websocket')
let server = new Server({
  port: 5050
})

server.on('error', function (err) {
  log.error({ err })
})

server.on('connection', function (ID) {
  log.info({ name: 'connection', msg: ID })
})

server.on('reconnect', function (ID) {
  log.info({ name: 'reconnect', msg: ID })
})

server.on('close', function (ID) {
  log.info({ name: 'closed', msg: ID })
})

server.on('toserver.**', function (msg, ID) {
  log.info({ name: 'toserver.**', event: this.event, msg, from: ID })
  server.pub('toclient.hello', 'a/s/l?')
})
