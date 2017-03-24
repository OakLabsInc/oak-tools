const { join } = require('path')
const tools = require(join(__dirname, '..'))
const Api = tools.api

const petstore = new Api('http://petstore.swagger.io/v2/swagger.json', function (err, api) {
  if (err) throw err
  console.log('petStore api:', api)
})
