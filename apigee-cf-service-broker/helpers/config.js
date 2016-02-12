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
}

var randomPass = require('crypto').randomBytes(18).toString('base64')
nconf.set('APIGEE_BROKER_PASSWORD', randomPass)
log.info('Using default password for application endpoints:', nconf.get('APIGEE_BROKER_PASSWORD'))

module.exports = nconf
