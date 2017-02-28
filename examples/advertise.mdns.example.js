const { join } = require('path')
const tools = require(join(__dirname, '..'))
const Advertiser = tools.advertise('mdns')

const logger = tools.logger({
  level: 'debug',
  pretty: true
})

const ad = new Advertiser({
  name: 'testservice',
  type: 'oak',
  logger
})

ad.start()
