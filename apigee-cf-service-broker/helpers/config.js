'use strict'
var nconf = require('nconf')
var apigee = require('apigee-access')

// arguments, environment vars, then file
nconf.argv()
  .env()
  .file({file: 'config.json'})

module.exports = nconf
