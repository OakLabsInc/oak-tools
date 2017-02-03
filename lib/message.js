const _ = require('lodash')
const msgpack = require('msgpack5')()

/**
 * Message encapsulation and decapsulation
 */
class Message {
  /**
   * Creates an instance of Message.
   * @constructor
   * @param {Object} [options] options object
   * @param {Function} [options.encode=msgpack5/encode] Encoder function
   * @param {Function} [options.decode=msgpack5/decode] Decoder function
   */
  constructor ({ encode, decode } = msgpack) {
    /**
     * @prop {Function} encoder function
     */
    this.encoder = encode
    /**
     * @prop {Function} decoder function
     */
    this.decoder = decode
    /**
     * @prop {String} Namespace delimiter
     */
    this.delimiter = '.'
  }

  static delimiter () {
    return this.delimeter || '.'
  }

  /**
   * Pack a message
   * @param {String} namespace namespace of the message
   * @param {any} payload payload of the message
   * @returns {Buffer} Encoded namespace and payload
   */
  pack (namespace, payload) {
    let ret = this.encode(
      [...namespace.split(this.delimiter), payload]
    )
    return ret
  }
  /**
   * @typedef {Object} message
   * @property {String} ns Namespace of the message
   * @property {any} pl Payload of the message
   */

  /**
   * Unpack a message
   * @param {Buffer} data
   * @returns {message}
   * @memberof Message
   */
  unpack (data) {
    let _this = this
    let decoded = _this.decode(data)
    // make sure the message decoded and it's an array
    if (decoded && _.isArray(decoded) && decoded.length) {
      // push null to the unpack if there is no payload
      if (decoded.length === 1) {
        decoded.push(null)
      }
      // namespace consists of all array items minus the last
      let namespace = _.join(_.initial(decoded), '.')
      // payload is the last array item
      let payload = _.last(decoded)
      return { ns: namespace, pl: payload }
    }
  }

  /**
   * Encode data
   * @param {any} data
   * @returns {Buffer}
   * @memberof Message
   */
  encode (data) {
    if (_.isFunction(this.encoder)) {
      try {
        let enc = this.encoder(data)
        return enc
      } catch (err) {
        return err
      }
    } else {
      return data
    }
  }

  /**
   * Decode data
   * @param {Buffer} data
   * @returns {any}
   * @memberof Message
   */
  decode (data) {
    if (_.isFunction(this.decoder)) {
      try {
        return this.decoder(data)
      } catch (err) {
        return err
      }
    } else {
      return data
    }
  }
}

module.exports = Message
