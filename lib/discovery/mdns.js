const _ = require('lodash')
const { join } = require('path')
const mdns = require('mdns-js')
const { EventEmitter2 } = require('eventemitter2')

/**
 * Creates an instance of mDNS browser.
 * @constructor
 * @param {Object} [options] options object
 * @param {String} [options.name=https] Service Name {@link http://www.dns-sd.org/serviceTypes.html|See mDNS Service Types}
 * @param {String} [options.protocol=tcp] Service Protocol to search on, udp or tcp
 * @param {Array}  [options.subtypes] Array of subtypes
 * @param {Number} [options.timeout=5000] Timeout to stop search
 * @param {logger} [options.logger] Optional logger
 * @fires DiscoveryMdns#found
 * @fires DiscoveryMdns#stop
 * @see {@link https://github.com/mdns-js/node-mdns-js/|mdns-js}
 */
class DiscoveryMdns extends EventEmitter2 {
  constructor (opts = {}) {
    super({
      wildcard: true
    })
    opts = _.defaults(opts, {
      name: 'https',
      protocol: 'tcp',
      subtypes: [],
      timeout: 5000,
      excludeInterfaces: [],
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
    /**
     * @prop {Array} excludeInterfaces network interfaces that are excluded
     */
    this.excludeInterfaces = opts.excludeInterfaces
    this.excludeInterfaces.forEach(function (i) {
      if (i && i.length) mdns.excludeInterface(i)
    })
    /**
     * @prop {Number} timeout search timeout in milliseconds
     */
    this.timeout = opts.timeout
    /**
     * @prop {String} name Service name
     */
    this.name = opts.name
    /**
     * @prop {String} protocol Service protocol
     */
    this.protocol = opts.protocol
    /**
     * @prop {Array} subtypes Service subtypes to search on
     */
    this.subtypes = opts.subtypes
    /**
     * @prop {Object} browser mDNS browser
     * @see {@link https://github.com/mdns-js/node-mdns-js/|mdns-js}
     */
    this.browser = null
    /**
     * @prop {Function} timeoutFn The timeout search function
     * @private
     */
    this.timeoutFn = null
    return this
  }
  makeBrowser () {
    let _this = this
    return mdns.createBrowser(
      mdns.makeServiceType({
        name: _this.name,
        protocol: _this.protocol,
        subtypes: _this.subtypes
      })
    )
  }

  start () {
    let _this = this
    if (_.isNull(this.browser)) {
      this.browser = this.makeBrowser()
    }
    this.logger.debug({ name: 'discovery.mdns', msg: 'start', browser: this.browser })

    // check for duplicate listeners
    if (this.browser.listeners('ready').length === 0) {
      this.browser.on('ready', function () {
        if (_this.timeout > 0) {
          _this.timeoutFn = setTimeout(function () {
            _this.stop()
          }, _this.timeout)
        }
        _this.browser.discover()
      })
    }
    if (this.browser.listeners('update').length === 0) {
      this.browser.on('update', function (srv) {
        _this.logger.debug({ name: 'discovery.mdns', msg: 'service.found', properties: srv })
        /**
         * service found
         * @event Mdns#found
         * @type {Object}
         */
        _this.emit('found', srv)
      })
    }
    return this
  }

  stop () {
    this.logger.debug({ name: 'discovery.mdns', msg: 'stop' })
    if (this.browser) {
      /**
       * service search finished
       * @event Mdns#done
       * @type {Object}
       */
      this.browser.stop()
      clearTimeout(this.timeoutFn)
      this.browser = null
      this.emit('stop', this.foundServices)
    }
    return this
  }
}

module.exports = DiscoveryMdns
