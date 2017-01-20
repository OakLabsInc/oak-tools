process.env.NODE_ENV = 'test'

const { join } = require('path')
const Stream = require('stream')
const async = require('async')
const test = require('tape')
const { logger: Logger } = require(join(__dirname, '..'))
const logger = new Logger()

const levels = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace'
]

test('*** logger', function (t) {
  t.plan(10 + levels.length)
  t.comment('constructor')
  t.equal(typeof logger, 'function', 'did return construct correctly')

  t.comment('parameters')
  t.equal(typeof logger(), 'object', 'did return correctly')
  t.equal(typeof logger({}), 'object', 'blank object parameter')

  t.comment('level property')
  let levelProp = logger({
    level: 'info'
  })
  t.equal(typeof levelProp, 'object', 'did return correctly')
  t.equal(levelProp.info.name, 'LOG', 'has level info method')
  t.equal(levelProp.debug.name, 'noop', 'has no debug method')

  t.comment('stream property')
  let streamProp = logger({
    stream: new Stream()
  })

  t.equal(typeof streamProp, 'object', 'did return correctly')
  t.equal(streamProp.stream._isStdio, true, 'defaults to stdout')
  t.equal(streamProp.stream.writable, true, 'stream is readable')

  t.comment('pretty property')
  let prettyProp = logger({ pretty: true })
  t.equal(typeof prettyProp, 'object', 'did return correctly')

  async.forEach(levels, function (level, cb) {
    let type = logger().hasOwnProperty(level)
    t.equal(type, true, `Should return ${level} method`)
    cb()
  }, t.end)
})
