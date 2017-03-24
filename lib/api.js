const _ = require('lodash')
const Swagger = require('swagger-client')
/**
 * API options object
 * @typedef {Object} ApiOptions
 * @prop {String} url Full URL of to a swagger spec
 * @prop {AsyncResultCallback} [success=callback] success callback
 * @prop {ErrorCallback} [failure=callback] error callback
 * @prop {String} [basePath=/] overrides the URL basepath
 * @see {@link https://github.com/swagger-api/swagger-js|swagger-client}
 */
/**
 * Creates a API object
 * @constructor
 * @param {String|ApiOptions} options options object, or the name of the API (sets URL default to to `https://localhost/name`)
 * @param {AsyncResultCallback} [callback] returns ({Error}, Api)
 * @returns {@link https://github.com/swagger-api/swagger-js|swagger-client}
 */
class Api {
  constructor (opts, cb = function () {}) {
    let _this = this
    if (_.isString(opts)) {
      opts = { url: opts }
    }
    this.opts = opts
    this.client = Swagger(opts)
      .then(function ({ spec, errors, apis }) {
        _this.spec = spec
        _this.errors = errors.length ? errors : null
        cb(_this.errors, apis)
      })
    return this.client
  }
}

module.exports = Api
