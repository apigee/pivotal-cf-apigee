'use strict'
/**
 * Copyright (C) 2016 Apigee Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Create proxy on Edge
 * @todo refactor
 * @module
 */

var config = require('../helpers/config')
var JSZip = require('jszip')
var fs = require('fs')
var importProxy = require('./mgmt_api').importProxy
var getVirtualHosts = require('./mgmt_api').getVirtualHosts
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var logger = require('./logger')
var template = require('es6-template-strings')
var openApi = require('./open_api.js')

// create proxy in edge org
function createProxy (data, callback) {
  var apigeeHost = data.host
  var apigeeHostPattern = data.hostpattern
  var org = data.org
  var env = data.env
  var route = data.route
  // TODO: this is brittle. Refactor. Goal is to support some configurability, but the code needs to match the template, or the avaliable variables need to be documented
  var routeName = route.bind_resource.route
  // restore if we expose proxy naming template to end users
  // var proxyNameTemplate = config.get('APIGEE_PROXY_NAME_PATTERN')
  var proxyNameTemplate = 'cf-${routeName}'
  var proxyHostTemplate = apigeeHostPattern || '${apigeeOrganization}-${apigeeEnvironment}.${proxyHost}'
  var proxyName = template(proxyNameTemplate, { routeName: routeName })
  uploadProxy({route: data.route, user: data.user, pass: data.pass, org: org, env: env, proxyname: proxyName, basepath: '/' + route.binding_id}, function (err, data) {
    if (err) {
      var loggerError = logger.ERR_PROXY_UPLOAD_FAILED(err)
      callback(loggerError)
    } else {
      var proxyHost = apigeeHost || 'apigee.net'
      var proxyUrlRoot = template(proxyHostTemplate, { apigeeOrganization: org, apigeeEnvironment: env, proxyHost: proxyHost })
      route.proxyURL = 'https://' + proxyUrlRoot + '/' + route.binding_id
      route.proxyname = proxyName
      logger.log.info('route proxy url: ', route.proxyURL)
      callback(null, route)
    }
  })
}

// proxyData is {org: org, env: env, proxyname: name, basepath: path}
// should just get route details here, so we have access to parameters (add features)
function uploadProxy (proxyData, callback) {
  getZip(proxyData, function (err, data) {
    if (err) {
      var loggerError = logger.ERR_PROXY_ZIP(err)
      callback(loggerError)
    } else {
      importProxy(proxyData, data, function (err, result) {
        if (err) {
          var loggerError = logger.ERR_UAE(err)
          callback(loggerError)
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
      var loggerError = logger.ERR_PROXY_READ_FAILED(err)
      callback(loggerError)
    } else {
      var zip = new JSZip(data)
      var re1 = /%BASEPATH%/g
      var re2 = /%PROXYNAME%/g
      var re3 = /%VIRTUALHOSTS%/g
      var re4 = /%TARGETURL%/g
      // get virtual hosts for org/env
      getVirtualHosts(proxyData, function (err, data) {
        if (err) {
          var loggerError = logger.ERR_UAE(err)
          callback(loggerError)
        } else {
          var vHostString = JSON.parse(data).map(function (val) { return '<VirtualHost>' + val + '</VirtualHost>' }).join('\n')
          var proxyDefTemplate = zip.folder('apiproxy/proxies').file('default.xml')
          var proxyDefValue = proxyDefTemplate.asText().replace(re1, proxyData.basepath)
          proxyDefValue = proxyDefValue.replace(re3, vHostString)
          zip.folder('apiproxy/proxies').file('default.xml', proxyDefValue)
          var proxyNameTemplate = zip.file('apiproxy/cf-proxy.xml').asText()
          zip.file('apiproxy/cf-proxy.xml', proxyNameTemplate.replace(re2, proxyData.proxyname))
          var targetNameTemplate = zip.file('apiproxy/targets/default.xml').asText()
          var targetUrl = 'https://' + proxyData.route.bind_resource.route
          zip.file('apiproxy/targets/default.xml', targetNameTemplate.replace(re4, targetUrl))
          // Check for open Api & add policy support
          openApi.generatePolicy(proxyData.route, zip, function(err, updatedZip) {
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
