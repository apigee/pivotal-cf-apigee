'use strict'
var nconf = require('nconf')
var log = require('bunyan').createLogger({name: 'apigee', src: true})

// arguments, environment vars
nconf.argv()
  .env()
  .file({file: 'tmp.json'}) // not used, but required to nconf.set later on

// read from manifest.yml if in TEST
if (process.env.NODE_ENV === 'TEST') {
  var yaml = require('js-yaml')
  var fs = require('fs')
  var defaults = yaml.safeLoad(fs.readFileSync('manifest.yml', 'utf8'))
  nconf.defaults(defaults.env)
  nconf.set('SECURITY_USER_PASSWORD', 'testing')
  nconf.set('SECURITY_USER_NAME', 'tester')
}

module.exports = nconf
