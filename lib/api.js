const _ = require('lodash')
const Swagger = require('swagger-client')

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
