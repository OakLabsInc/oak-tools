const _ = require('lodash')
const { join } = require('path')
const mdns = require('mdns-js')
const { EventEmitter2 } = require('eventemitter2')

/**
 * Creates an instance of mDNS advertiser.
 * @constructor
 * @param {Object} options options object
 * @param {String} options.name Service name
 * @param {String} [options.type=https] Service type {@link http://www.dns-sd.org/serviceTypes.html|See mDNS Service Types}
 * @param {String} [options.protocol=tcp] Service protocol
 * @param {String} [options.nameSuffix] Service name suffix
 * @param {Array}  [options.subtypes] Service subtypes
 * @param {Number} [object.port=443] Service port
 * @param {Object} [object.txt] TXT record(s) of the service
 * @fires AdvertiseMdns#stop
 * @fires AdvertiseMdns#start
 * @fires AdvertiseMdns#error
 * @see {@link https://github.com/mdns-js/node-mdns-js/|mdns-js}
 */
class AdvertiseMdns extends EventEmitter2 {
  constructor (opts = {}) {
    super({
      wildcard: true
    })
    opts = _.defaultsDeep(opts, {
      type: 'https',
      protocol: 'tcp',
      subtypes: [],
      port: 443,
      txt: {},
      logger: false
    })
    /**
     * @prop {logger} logger the logger of this instance
     */
    if (_.isBoolean(opts.logger)) {
      opts.logger = new (require(join(__dirname, '..', 'logger')))({
        level: opts.logger === true ? 'debug' : 'fatal',
        pretty: opts.logger
      })
    }
    this.logger = opts.logger
    if (!opts.name) {
      let err = new Error('You must set a name property')
      return this.logger.error({
        err
      })
    }
    /**
     * @prop {Number} state State of the advertiser
     */
    this.state = 0
    /**
     * @prop {Object} options Advertiser options
     * @prop {Number} options.name Service name
     * @prop {String} options.protocol Service protocol
     * @prop {String} options.type Service type
     * @prop {Array}  options.subtypes Service subtypes
     * @prop {Number} options.port Service port
     * @prop {Object} advertiser mDNS advertiser
    */
    this.options = opts
    this.logger.debug({ name: 'options', options: this.options })
    /**
     * @see {@link https://github.com/mdns-js/node-mdns-js/|mdns-js}
     */
    this.advertiser = mdns.createAdvertisement(
      mdns[opts.protocol](`_${this.options.type}`),
      this.options.port,
      _.pick(this.options, [
        'name',
        'txt',
        'nameSuffix',
        'subtypes'
      ])
    )
    return this
  }

  get status () {
    return this.advertiser.status
  }

  start () {
    this.logger.debug({ name: 'advertise.mdns', msg: 'start' })
    if (this.advertiser) {
      /**
       * service search started
       * @event Mdns#start
       * @type {Object}
       */
      this.emit('start', this.options)
      this.advertiser.start()
    }
    return this
  }

  stop () {
    this.logger.debug({ name: 'advertise.mdns', msg: 'stop' })
    if (this.advertiser) {
      /**
       * service search finished
       * @event Mdns#stop
       * @type {Object}
       */
      this.emit('stop', this.advertiser)
      this.advertiser.stop()
    }
    return this
  }
}

module.exports = AdvertiseMdns
