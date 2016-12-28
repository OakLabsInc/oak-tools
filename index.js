const { join } = require('path')

module.exports.logger = function (opts, cb = function () {}) {
  let logger = new (require(join(__dirname, 'lib', 'logger')))(opts)
  cb(logger)
  return logger
}
