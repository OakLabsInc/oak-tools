const _ = require('lodash')
const msgpack = require('msgpack5')()

class Message {

  constructor ({ encode, decode } = msgpack) {
    this.encoder = encode
    this.decoder = decode
    this.delimiter = '.'
    this.blocked = []
  }

  pack (namespace, payload) {
    if (!this.isBlocked(namespace)) {
      let ret = this.encode(
        [...namespace.split(this.delimiter), payload]
      )
      return ret
    }
  }

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
      // make sure the namespace isnt set to be blocked
      if (!this.isBlocked(namespace)) {
        return { ns: namespace, pl: payload }
      }
    }
  }

  encode (data) {
    try {
      let enc = this.encoder(data)
      return enc
    } catch (err) {
      return err
    }
  }

  decode (data) {
    try {
      return this.decoder(data)
    } catch (err) {
      return err
    }
  }

  isBlocked (ns) {
    return _.includes(this.blocked, ns)
  }

  set block (item) {
    return _.uniq(_.concat(this.blocked, [item]))
  }

}

module.exports = Message
