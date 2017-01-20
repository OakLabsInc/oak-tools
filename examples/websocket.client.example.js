const { join } = require('path')

let Client = require(join(__dirname, '..')).client('websocket')

let client = new Client({
  id: 'testclient'
})

client.on('open', function () {
  console.log('* client is connected')
  // subscribe to 'ok' namespace
  setTimeout(function () {
    client.sub('ok')
    // publish to test namespace
    setTimeout(function () {
      client.pub('test', {
        'just-testing': 2
      })
      // close client
      setTimeout(function () {
        client.close()
      }, 1000)
    }, 1000)
  }, 1000)
})

client.on('error', function (err) {
  console.error('* client error', err)
})

client.on('connect', function (ID) {
  console.log('* server connect, my ID is:', ID)
})

client.on('ok', function (msg) {
  console.log('* got ok from server')
  console.log(JSON.stringify(msg, null, 2), '\n')
})
