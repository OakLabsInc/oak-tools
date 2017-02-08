const { join } = require('path')
const tools = require(join(__dirname, '..'))
const Discovery = tools.discovery('mdns')
const logger = tools.logger({
  pretty: true
})

const discovery = new Discovery({
  excludeInterfaces: ['0.0.0.0']
})

discovery
  .on('found', function (srv) {
    logger.info({
      msg: 'service',
      service: srv
    })
    // console.log(JSON.stringify({
    //   addr: srv.address,
    //   txt: srv.txt,
    //   name: srv.fullname
    // }, null, 2))
  })
  .on('done', function (srvs) {
    logger.debug({
      msg: 'done',
      services: srvs
    })
  })

discovery.start()
