'use strict'
var nconf = require('nconf')

// arguments, environment vars, then file
nconf.argv()
  .env()
  .file({file: 'config.json'})

module.exports = nconf
