const _ = require('lodash')
const { join } = require('path')
const mdns = require('mdns-js')
const { EventEmitter2 } = require('eventemitter2')

/**
 * Creates an instance of mDNS advertiser.
 * @constructor
 * @param {Object} [options] options object
 * @param {String} [options.type=https] Service type {@link http://www.dns-sd.org/serviceTypes.html|See mDNS Service Types}
 * @param {String} [options.protocol=tcp] Service protocol
 * @param {String} [options.name='oak-tools'] Service name
 * @param {String} [options.suffix] Service name suffix
 * @param {Number} [object.port=443] Service port
 * @param {Object} [object.txt] TXT record(s) of the service
 * @fires Mdns#stop
 * @see {@link https://github.com/mdns-js/node-mdns-js/|mdns-js}
 */
class Mdns extends EventEmitter2 {
  constructor (opts = {}) {
    super({
      wildcard: true
    })
    opts = _.defaults(opts, {
      name: 'oak-tools',
      type: 'https',
      protocol: 'tcp',
      port: 443,
      txt: {}
    })
    /**
     * @prop {Number} name Service name
     */
    this.name = opts.name
    /**
     * @prop {String} protocol Service protocol
     */
    this.protocol = opts.protocol
    /**
     * @prop {String} type Service type
     */
    this.type = opts.type
    /**
     * @prop {String} suffix Service name suffix
     */
    this.suffix = opts.suffix
    /**
     * @prop {Number} port Service port
     */
    this.port = opts.port
    /**
     * @prop {Object} advertiser mDNS advertiser
     * @see {@link https://github.com/mdns-js/node-mdns-js/|mdns-js}
     */
    this.advertiser = mdns.createAdvertisement(
      mdns[opts.protocol](`_${opts.type}`),
      this.port, {
        name: this.name,
        nameSuffix: this.suffix,
        txt: this.txt
      }
    )
    return this
  }

  start () {
    this.advertiser.start()
    return this
  }

  stop () {
    this.logger.debug({ name: 'advertise.mdns', msg: 'stop' })
    if (this.advertiser) {
      /**
       * service search finished
       * @event Mdns#done
       * @type {Object}
       */
      this.emit('stop', this.advertiser)
      this.advertiser.stop()
    }
    return this
  }
}

module.exports = Mdns
