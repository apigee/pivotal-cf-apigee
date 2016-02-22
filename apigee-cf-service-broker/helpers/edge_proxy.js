'use strict'

// TODO: refactor

var config = require('../helpers/config')
var JSZip = require('jszip')
var fs = require('fs')
var importProxy = require('./mgmt_api').importProxy
var getVirtualHosts = require('./mgmt_api').getVirtualHosts
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var logger = require('./logger')
var template = require('es6-template-strings')
var swagger = require('./swagger.js')

// create proxy in edge org
function createProxy (data, cb) {
  var org = data.org
  var env = data.env
  var route = data.route
  // TODO: this is brittle. Refactor. Goal is to support some configurability, but the code needs to match the template, or the avaliable variables need to be documented
  var routeName = route.bind_resource.route
  var proxyNameTemplate = config.get('APIGEE_PROXY_NAME_PATTERN')
  proxyNameTemplate = proxyNameTemplate.replace(/#/g, '$')
  var proxyHostTemplate = config.get('APIGEE_PROXY_HOST_PATTERN')
  proxyHostTemplate = proxyHostTemplate.replace(/#/g, '$')
  var proxyName = template(proxyNameTemplate, { routeName: routeName })
  uploadProxy({route: data.route, user: data.user, pass: data.pass, org: org, env: env, proxyname: proxyName, basepath: '/' + route.binding_id}, function (err, data) {
    if (err) {
      var loggerError = logger.handle_error(logger.codes.ERR_PROXY_UPLOAD_FAILED, err)
      cb(true, loggerError)
    } else {
      var proxyHost = config.get('APIGEE_PROXY_HOST')
      var proxyUrlRoot = template(proxyHostTemplate, { apigeeOrganization: org, apigeeEnvironment: env, proxyHost: proxyHost })
      route.proxyURL = 'https://' + proxyUrlRoot + '/' + route.binding_id
      route.proxyname = proxyName
      logger.log.info('route proxy url: ', route.proxyURL)
      cb(null, route)
    }
  })
}

// proxyData is {org: org, env: env, proxyname: name, basepath: path}
// should just get route details here, so we have access to parameters (add features)
function uploadProxy (proxyData, callback) {
  getZip(proxyData, function (err, data) {
    if (err) {
      var loggerError = logger.handle_error(logger.codes.ERR_PROXY_ZIP, err)
      callback(true, loggerError)
    } else {
      importProxy(proxyData, data, function (err, result) {
        if (err) {
          callback(true, result)
        } else {
          callback(null, result)
        }
      })
    }
  })
}

// TODO: cf route services requires TLS. This needs to be documented somewhere for users.
function getZip (proxyData, callback) {
  fs.readFile('./proxy-resources/apiproxy.zip', function (err, data) {
    if (err) {
      var loggerError = logger.handle_error(logger.codes.ERR_PROXY_READ_FAILED, err)
      callback(true, loggerError)
    } else {
      var zip = new JSZip(data)
      var re1 = /%BASEPATH%/g
      var re2 = /%PROXYNAME%/g
      var re3 = /%VIRTUALHOSTS%/g
      // get virtual hosts for org/env
      getVirtualHosts(proxyData, function (err, data) {
        if (err) {
          callback(true, data)
        } else {
          var vHostString = JSON.parse(data).map(function (val) { return '<VirtualHost>' + val + '</VirtualHost>' }).join('\n')
          var proxyDefTemplate = zip.folder('apiproxy/proxies').file('default.xml')
          var proxyDefValue = proxyDefTemplate.asText().replace(re1, proxyData.basepath)
          proxyDefValue = proxyDefValue.replace(re3, vHostString)
          zip.folder('apiproxy/proxies').file('default.xml', proxyDefValue)
          var proxyNameTemplate = zip.file('apiproxy/cf-proxy.xml').asText()
          zip.file('apiproxy/cf-proxy.xml', proxyNameTemplate.replace(re2, proxyData.proxyname))
          // Check for swagger & add policy support
          swagger.generatePolicy(proxyData.route, zip, function(err, updatedZip) {
            if (err) {
              callback(null, this.zip.generate({type: 'nodebuffer'}))
            }
            else {
              callback(null, updatedZip.generate({type: 'nodebuffer'}))
            }
          }.bind({ zip: zip }))
        }
      })
    }
  })
}

module.exports = {
  create: createProxy
}
