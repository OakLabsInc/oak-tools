const { join } = require('path')
const tools = require(join(__dirname, '..'))
const Advertiser = tools.advertise('mdns')
const logger = tools.logger({
  pretty: true
})

const ad = new Advertiser({
  name: 'testservice'
})

ad.on('done', function (srvs) {
  logger.debug({
    msg: 'advertiser.done'
  })
})

ad.start()

process.stdin.resume()

setInterval(function () {
  console.log(ad.advertiser)
}, 5000)
