'use strict'
var nconf = require('nconf')

// arguments, environment vars
nconf.argv()
  .env()

// read from manifest.yml if in TEST
if (process.env.NODE_ENV === 'TEST') {
  var yaml = require('js-yaml')
  var fs = require('fs')
  var defaults = yaml.safeLoad(fs.readFileSync('manifest.yml', 'utf8'))
  nconf.defaults(defaults.env)
}
module.exports = nconf
