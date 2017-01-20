const { join } = require('path')

let Server = require(join(__dirname, '..')).server('websocket')
let server = new Server()

server.on('error', function (err) {
  console.error('* client error', err)
})

server.on('connection', function (ID) {
  console.log('* client connection: ', ID)
})

server.on('reconnect', function (ID) {
  console.log('* client reconnect: ', ID)
})

server.on('close', function (ID) {
  console.log('* client closed', ID)
})

server.on('test', function (msg) {
  console.log('* test from client', msg)
  server.pub('ok', {
    gotit: true
  })
})
