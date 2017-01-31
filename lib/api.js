const _ = require('lodash')
const Swagger = require('swagger-client')
/**
 * API options object
 * @typedef {Object} ApiOptions
 * @prop {String} [url=https://localhost/] Full URL of to a swagger spec
 * @prop {AsyncResultCallback} [success=callback] success callback
 * @prop {ErrorCallback} [failure=callback] error callback
 * @prop {String} [basePath=/] overrides the URL basepath
 * @see {@link https://github.com/swagger-api/swagger-js|swagger-client}
 */
/**
 * Creates a API object
 * @constructor
 * @param {String|ApiOptions} options options object, or the name of the API (sets URL default to to `https://localhost/name`)
 * @param {AsyncResultCallback} [callback] returns ({Error}, {@link https://github.com/swagger-api/swagger-js|swagger-client})
 * @returns {@link https://github.com/swagger-api/swagger-js|swagger-client}
 */
class Api {
  constructor (opts = {}, cb = function () {}) {
    if (_.isString(opts)) {
      opts = { name: opts }
    }
    let defaultUrl = 'https://localhost/' + _.defaultTo(opts.name, '')
    let client = new Swagger(_.defaultsDeep(opts, {
      basePath: opts.name,
      url: !opts.spec ? defaultUrl : undefined,
      success: function () { cb(null, client) },
      failure: cb
    }))
    return client
  }
}

module.exports = Api
