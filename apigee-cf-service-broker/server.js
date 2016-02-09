'use strict'

var express = require('express')
var api = require('./api/api')
var catalog = require('./api/catalog')
var service_instances = require('./api/service_instances')
var bodyParser = require('body-parser')
var log = require('bunyan').createLogger({name: "apigee",src: true})

var app = express()
app.use(bodyParser.json())

app.use('/', api)
app.use('/v2/catalog', catalog)
app.use('/v2/service_instances/', service_instances)

app.use(function (err, req, res, next) {
  var responseData
  if (err.name === 'JsonSchemaValidation') {
    log.error(err.message, "JSON Schema Validation error, Invalid JSON")
    res.status(400)
    responseData = {
      statusText: 'Bad Request',
      description: 'Validation failed. Details: ' + JSON.stringify(err.validations) + ' For additional help, please contact support at http://support.apigee.com/.',
      jsonSchemaValidation: true,
      validations: err.validations  // All of your validation information
    }
    res.json(responseData)
  } else {
    // pass error to next error middleware handler
    next(err)
  }
})

var port = process.env.PORT || 8888
app.listen(port)
log.info('listening on port ', port)

module.exports = app
