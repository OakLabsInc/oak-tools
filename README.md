# oak-tools

[![Greenkeeper badge](https://badges.greenkeeper.io/OakLabsInc/oak-tools.svg)](https://greenkeeper.io/)

![npm](https://img.shields.io/npm/v/oak-tools.svg) ![Circle CI build status](https://circleci.com/gh/OakLabsInc/oak-tools.svg?style=svg) [![Coverage Status](https://coveralls.io/repos/github/OakLabsInc/oak-tools/badge.svg?branch=master)](https://coveralls.io/github/OakLabsInc/oak-tools?branch=master) ![license](https://img.shields.io/npm/l/oak-tools.svg) [![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-green.svg)](http://standardjs.com/)

Helpful utilities for developing oak applications

![nodei.co](https://nodei.co/npm/oak-tools.png?downloads=true&downloadRank=true&stars=true)

![](https://david-dm.org/OakLabsInc/oak-tools/status.svg)
![](https://david-dm.org/OakLabsInc/oak-tools/dev-status.svg)

## Install

`npm install --save oak-tools`

## Documentation

Head on over to the [documentation](https://oaklabsinc.github.io/oak-tools/) page!

## Usage

`oak-tools` consists of a few helpful utility methods. Everything exposed from the module is a `Class` and needs to be constructed using `new`, except the `logger`

**logger()**

The logger is based off [pino](https://github.com/pinojs/pino) and has nearly the same same option parameters. The following example are the default options.

```javascript
const { logger } = require('oak-tools')
let log = logger({
  // these are the default properties
  level: 'info',
  stream: process.stdout,
  pretty: false
})
log.info('sup')
log.error({
  err: new Error('crap...')
})
log.debug({
  msg: 'debug message here',
  now: Date.now()
})

```

**server(_type_)**

The server is extended from a good 'ol [EventEmitter2](https://github.com/asyncly/EventEmitter2). Head [here](https://oaklabsinc.github.io/oak-tools/WebSocketServer.html) for full documentation on the `server` class

```javascript
const msgpack = require('msgpack5')()
const Server = require('oak-tools').server('websocket')

// all these options are, well... optional
let server = new Server({
  // these are the default properties
  port: 9500,
  host: 'localhost',
  serializer: { encode, decode } = msgpack
})

server
  .on('error', function (err) {
    console.error('* client error', err)
  })
  .on('connection', function (ID) {
    console.log('* client connection: ', ID)
  })
  .on('reconnect', function (ID) {
    console.log('* client reconnect: ', ID)
  })
  .on('close', function (ID) {
    console.log('* client closed', ID)
  })
  .on('who.is.the.man.now', function () {
    server.pub('heres.who', {
      answer: 'you are. http://www.yourethemannowdog.com/'
    })
  })
```

**client(_type_)**

The `client` API is similar to `server`, but it has both a `sub` and a `pub` method.

```javascript
const { join } = require('path')

let Client = require(join(__dirname, '..')).client('websocket')

let client = new Client({
  id: 'sean connery' // defaults to random UUID
})

client.on('ready', function () {
  console.log('* client is connected')
  client
    .on('heres.who', function ({ answer }) {
      console.log(answer)
    })
    .pub('who.is.the.man.now')
})
```

## Message Rationale & Flow

The goal of the server/client is to wrap up all the higher level messaging operations to be more protocol agnostic (as well as non-repetitive). This means we have a couple more steps than a normal `TCP` or `WebSocket` flow:

**Client -> Server**

1. Client publishes on a namespace
   > `client > pub('foo.bar', { my: 'message' })`

2. The namespace and message get split into an flat array, where the last item is the message
   > `client > outbound message [ 'foo', 'bar', { my: 'message' } ]`

3. Payload gets encoded by the client
   > `client > encode(array) // <Buffer a5 68 65 6c 6c 6f>`

4. Client sends encoded message to the server
   > `client > send(payload)`

5. Server receives payload Buffer
   > `server > on('message', decode)`

6. Server receives and unpacks the payload
   > `server > decode(payload) // our array`

7. Server reconstructs the array, and emits the message
   > `server > emit('foo.bar', { my: 'message' })`

**Server -> Client(s)**

1. Client sends a subscription message to the server, through its binding
   > `client > on('foo.*', handler)`

2. Server receives a subscription event from the client
   > `server > on('_sub') // remember client wants 'foo.*' messages`
  
   Time passes...

3. Server sends an event to all clients that subscribed
   > `server > pub('foo.baz', { my: 'message' }) // matches anyone who sent _sub to foo.*`

4. Encode and write the same way the client does to each socket
   > `server > each connections send(payload)`

5. Client receives payload, unpacks, and emits it
   > `client > on('foo.*', fn(data))  // this.event === foo.baz`

**Serializer**

On both server and client, encoder and decoder to pass messages. The `serializer` consists of the encoding and decoding methods to use against payloads.
By default, we use `msgpack5`, but doing something as simple as this will work:
```javascript
new clientOrServer({
  serializer: {
    encode: JSON.stringify,
    decode: JSON.parse
  }
})
```

## Dependencies

Package | Version | Dev
--- |:---:|:---:
[eventemitter2](https://www.npmjs.com/package/eventemitter2) | ~2.2.2 | ✖
[minimatch](https://www.npmjs.com/package/minimatch) | ~3.0.3 | ✖
[msgpack5](https://www.npmjs.com/package/msgpack5) | ~3.4.1 | ✖
[pino](https://www.npmjs.com/package/pino) | ~3.0.5 | ✖
[swagger-client](https://www.npmjs.com/package/swagger-client) | ~2.1.32 | ✖
[uuid](https://www.npmjs.com/package/uuid) | ~3.0.1 | ✖
[ws](https://www.npmjs.com/package/ws) | ~1.1.1 | ✖
[coveralls](https://www.npmjs.com/package/coveralls) | 2.11.15 | ✔
[docdash](https://www.npmjs.com/package/docdash) | 0.4.0 | ✔
[istanbul](https://www.npmjs.com/package/istanbul) | 0.4.5 | ✔
[node-readme](https://www.npmjs.com/package/node-readme) | 0.1.9 | ✔
[standard](https://www.npmjs.com/package/standard) | 8.6.0 | ✔
[tap-difflet](https://www.npmjs.com/package/tap-difflet) | 0.7.0 | ✔
[tape](https://www.npmjs.com/package/tape) | 4.6.3 | ✔


## Contributing

Contributions welcome; Please submit all pull requests against the master branch. If your pull request contains patches or features, you should include relevant unit tests. Thanks!

## Authors

- [Flynn Joffray](http://github.com/nucleardreamer) - <nucleardreamer@gmail.com>
- [Nir Ziv](http://github.com/nirziv) - <nir@oaklabs.is>

## License

 - **Apache 2.0** : http://opensource.org/licenses/Apache-2.0
