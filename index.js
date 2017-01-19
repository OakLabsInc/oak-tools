const { join } = require('path')

let logger = (opts, cb = function () {}) => {
  let _logger = new (require(join(__dirname, 'lib', 'logger')))(opts)
  cb(_logger)
  return _logger
}

let message = require(join(__dirname, 'lib', 'message'))

let server = type => require(join(__dirname, 'lib', type, 'server'))
let client = type => require(join(__dirname, 'lib', type, 'client'))

module.exports = { logger, server, client, message }
