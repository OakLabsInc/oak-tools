const pino = require('pino')

/**
 * Creates a logger object
 * @param {string} [level='info'] - set the log level, default is info
 * @param {Object} [stream=process.stdout] - outbound stream, defaults to process.stdout
 * @param {boolean} [pretty=false] - pretty printing, defaults to false
 * @returns {Object} - Log level methods
 */
function logger ({ level = 'info', stream = process.stdout, pretty = false } = {}) {
  if (pretty) {
    let _pretty = pino.pretty()
    _pretty.pipe(stream)
    stream = _pretty
  }

  let _logger = pino(stream)
  _logger.level = level

  return _logger
}

module.exports = logger
