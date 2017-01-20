const pino = require('pino')

/**
 * logger object
 * @typedef {object} logger
 * @prop {function} trace
 * @prop {function} debug
 * @prop {function} info
 * @prop {function} error
 * @prop {function} warn
 * @prop {function} fatal
 */

/**
 * Creates a logger object
 * @constructor
 * @param {object} options options object
 * @param {string} [options.level=info] set the log level, default is info
 * @param {object} [options.stream=stdout] outbound stream, defaults to process.stdout
 * @param {boolean} [options.pretty=false] pretty printing, defaults to false
 * @returns {logger}
 */
function Logger ({ level = 'info', stream = process.stdout, pretty = false } = {}) {
  if (pretty) {
    let _pretty = pino.pretty()
    _pretty.pipe(stream)
    stream = _pretty
  }

  let _logger = pino(stream)
  _logger.level = level

  return _logger
}

module.exports = Logger
