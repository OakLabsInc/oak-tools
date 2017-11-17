process.env.NODE_ENV = 'test'

const test = require('tape')
const _ = require('lodash')
const { join } = require('path')
const tools = require(join(__dirname, '..'))
const WsServer = tools.server('websocket')

test('*** server', function (t) {
  t.plan(10)
  let server = new WsServer({
    port: 10000
  }, function () {
    t.pass('server should callback when ready')
    t.comment('constructor')
    t.true(_.isObject(server), 'did return construct correctly')

    t.comment('arguments')
    t.equal(server.constructor.name, 'WebSocketServer', 'is the correct return object')

    t.comment('methods')
    t.true(_.isFunction(server.close), 'has close method')
    t.true(_.isFunction(server.pub), 'has pub method')

    t.comment('properties')
    t.true(_.property(server.server), 'has server property')
    t.true(_.property(server.connections), 'has connections property')
    t.equal(_.size(server.connections), 0, 'connections is an empty object by default')
    t.true(_.property(server.message), 'has message property')
    server.close(function () {
      t.pass('close executed optional callback')
    })
  })
}).on('end', function () {
  process.exit(+this._ok)
})
