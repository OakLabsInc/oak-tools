const { join } = require('path')
const tools = require(join(__dirname, '..'))

const Logger = tools.logger()
const log = new Logger({
  pretty: true
})

let Client = tools.client('websocket')
let client = new Client({
  id: 'testclient'
})

client.on('ready', function () {
  log.info({
    name: 'ready'
  })
  client
    .on('toclient.*', function (msg) {
      console.log
      log.info({ name: 'toclient.*', event: this.event, msg })
    })
    .pub('toserver.question', 'hey who are you?', function (err) {
      if (err) {
        log.error('pub tosever error', { name: 'pub', err })
      }
    })
})
.on('error', function (err) {
  log.error({ err })
})
.on('connect', function (ID) {
  log.info({ name: 'connect', msg: ID })
})
.on('reconnect', function (ID) {
  log.info({ name: 'reconnect', msg: ID })
})
