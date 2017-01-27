
const { join } = require('path')

/**
 * oak-tools module
 * @version 0.2.0
 * @module oak-tools
 */

/**
 * Logger object
 * @param {Object} options options object
 * @param {Function} callback callback function
 * @returns {Logger}
 */
module.exports.logger = function () {
  return require(join(__dirname, 'lib', 'logger'))
}

/**
 * Message class
 * @returns {Message}
 */
module.exports.message = function () {
  return require(join(__dirname, 'lib', 'message'))
}

/**
 * Starts a messaging server
 * @param {String} type Type of server
 * @returns {WebSocketServer}
 */
module.exports.server = function (type) {
  return require(join(__dirname, 'lib', type, 'server'))
}

/**
 * Starts a messaging client
 * @param {String} type Type of client
 * @returns {WebSocketClient}
 */

module.exports.client = function (type) {
  return require(join(__dirname, 'lib', type, 'client'))
}
