
const { join } = require('path')

/**
 * oak-tools module
 * @version 0.2.0
 * @module oak-tools
 */

/**
 * Logger object
 * @param {object} options options object
 * @param {function} callback callback function
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
 * @param {string} type Type of server
 * @returns {WebSocketServer}
 */
module.exports.server = function (type) {
  return require(join(__dirname, 'lib', type, 'server'))
}

/**
 * Starts a messaging client
 * @param {string} type Type of client
 * @returns {WebSocketClient}
 */

module.exports.client = function (type) {
  return require(join(__dirname, 'lib', type, 'client'))
}
