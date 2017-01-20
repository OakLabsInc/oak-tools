# oak-tools

![npm](https://img.shields.io/npm/v/oak-tools.svg) ![license](https://img.shields.io/npm/l/oak-tools.svg) ![github-issues](https://img.shields.io/github/issues/OakLabsInc/oak-tools.svg) [![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-green.svg)](http://standardjs.com/)

Helpful utilities for developing oak applications

![nodei.co](https://nodei.co/npm/oak-tools.png?downloads=true&downloadRank=true&stars=true)

![](https://david-dm.org/OakLabsInc/oak-tools/status.svg)
![](https://david-dm.org/OakLabsInc/oak-tools/dev-status.svg)

## Install

`npm install --save oak-tools`

## Documentation

Head on over to the [documentation](https://oaklabsinc.github.io/oak-tools/) page!

## Usage

`oak-tools` consists of a few helpful utility methods. Everything exposed from the module is a `Class` and needs to be constructed using `new`

**logger()**

The logger is based off [pino](https://github.com/pinojs/pino) and has nearly the same same option parameters. The following example are the default options.

```javascript
const Logger = require('oak-tools').logger
let log = new Logger({
  level: 'info',
  stream: process.stdout,
  pretty: true
})

```



**server(_type_)**

The server is extended from a plain 'ol [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). Head [here](https://oaklabsinc.github.io/oak-tools/WebSocketServer.html) for full documentation on the `server` class

```javascript
const msgpack = require('msgpack5')()
const Server = require('oak-tools').server('websocket')

// all these options are, well... optional
let server = new Server({
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
  id: 'sean connery'
})

client.on('open', function () {
  console.log('* client is connected')
  client
    .sub('heres.who')
    .on('heres.who', function ({ answer }) {
      console.log(answer)
    })
    .pub('who.is.the.man.now')
})
```



## Scripts

 - **npm run coverage** : `node node_modules/.bin/istanbul cover node_modules/.bin/tape test/*.js || true`
 - **npm run coveralls** : `npm run-script coverage && node node_modules/.bin/coveralls < coverage/lcov.info && rm -rf coverage/ || true`
 - **npm run generate-docs** : `node_modules/.bin/jsdoc -c jsdoc.json`
 - **npm run readme** : `node ./node_modules/.bin/node-readme`
 - **npm run test** : `node_modules/.bin/standard && find test/*.js | xargs -n 1 node | node_modules/.bin/tap-difflet`

## Dependencies

Package | Version | Dev
--- |:---:|:---:
[msgpack5](https://www.npmjs.com/package/msgpack5) | 3.4.1 | ✖
[pino](https://www.npmjs.com/package/pino) | 3.0.5 | ✖
[ws](https://www.npmjs.com/package/ws) | 1.1.1 | ✖
[coveralls](https://www.npmjs.com/package/coveralls) | 2.11.14 | ✔
[docdash](https://www.npmjs.com/package/docdash) | 0.4.0 | ✔
[istanbul](https://www.npmjs.com/package/istanbul) | 0.4.2 | ✔
[node-readme](https://www.npmjs.com/package/node-readme) | 0.1.9 | ✔
[standard](https://www.npmjs.com/package/standard) | 8.5.0 | ✔
[tap-difflet](https://www.npmjs.com/package/tap-difflet) | 0.4.0 | ✔
[tape](https://www.npmjs.com/package/tape) | 4.6.0 | ✔


## Contributing

Contributions welcome; Please submit all pull requests against the master branch. If your pull request contains patches or features, you should include relevant unit tests. Thanks!

## Authors

- [Flynn Joffray](http://github.com/nucleardreamer) - <nucleardreamer@gmail.com>
- [Nir Ziv](http://github.com/nirziv) - <nir@oaklabs.is>

## License

 - **MIT** : http://opensource.org/licenses/MIT
