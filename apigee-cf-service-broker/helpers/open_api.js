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

var swaggerParser = require('swagger-parser')
var async = require('async')
var logger = require('./logger')
var quota = require('../policy_templates/quota/quota.js')
var spike = require('../policy_templates/spikeArrest/spikeArrest.js')
var cache = require('../policy_templates/cache/responseCache.js')
var verifyApiKey = require('../policy_templates/security/apikey.js')
var oauth2 = require('../policy_templates/security/verifyAccessToken.js')
var xmlToJson = require('../policy_templates/mediation/xmlToJson.js')
var jsonToXml = require('../policy_templates/mediation/jsonToXml.js')
var DOMParser = require('xmldom').DOMParser
var XMLSerializer = require('xmldom').XMLSerializer
var builder = require('xmlbuilder')

var generatePolicy = function (route, zip, cb) {
  var routeUrl = 'http://' + route.bind_resource.route
  async.waterfall([
    // check for openApi
    function (callback) {
      swaggerParser.parse(routeUrl + '/openApi.json', function (err, api, metadata) {
        if (err) {
          // TODO: Error / Warning
          var loggerError = logger.handle_error(logger.codes.ERR_OPENAPI_NOT_FOUND, err)
          callback(true, loggerError)
        } else {
          callback(null, api)
        }
      })
    },
    function (api, callback) {
      // Valid openApi Found -- Look for apigee Policies
      if (api['x-apigee-policies']) {
        async.each(Object.keys(api['x-apigee-policies']), function (service, cb) {
          // Perform operation on file here.
          var policy = api['x-apigee-policies'][service].type
          var xmlString = ''
          if (policy === 'quota') {
            // Add Quota Policy
            xmlString = quota.quotaGenTemplate(api['x-apigee-policies'][service].options, service)
          }
          if (policy === 'spikeArrest') {
            // Add spike Policy
            xmlString = spike.spikeArrestGenTemplate(api['x-apigee-policies'][service].options, service)
          }
          if (policy === 'responseCache') {
            // Add cache Policies
            xmlString = cache.responseCacheGenTemplate(api['x-apigee-policies'][service].options, service)
          }
          if (policy === 'verifyApiKey') {
            // Add cache Policies
            xmlString = verifyApiKey.apiKeyGenTemplate(api['x-apigee-policies'][service].options, service)
          }
          if (policy === 'oAuthV2') {
            // Add cache Policies
            xmlString = oauth2.verifyAccessTokenGenTemplate(api['x-apigee-policies'][service].options, service)
          }
          if (policy === 'xmlToJson') {
            // Add cache Policies
            xmlString = xmlToJson.xmlToJsonGenTemplate(api['x-apigee-policies'][service].options, service)
          }
          if (policy === 'jsonToXml') {
            // Add cache Policies
            xmlString = jsonToXml.jsonToXmlGenTemplate(api['x-apigee-policies'][service].options, service)
          }
          if (xmlString !== '') {
            zip.folder('apiproxy/policies').file(service + '.xml', xmlString)
          }
          cb(null)
        }, function (err) {
          // if any of the file processing produced an error, err would equal that error
          if (err) {
            callback(true, err)
          } else {
            callback(null, api, zip)
          }
        })
      } else {
        // TODO: Error / Warning
        var loggerError = logger.handle_error(logger.codes.ERR_POLICIES_NOT_FOUND, true)
        callback(true, loggerError)
      }
    },
    function (api, zip, callback) {
      // Attach policies to preFlow / postFlow
      if (api['x-apigee-apply']) {
        var proxyText = zip.file('apiproxy/proxies/default.xml').asText()
        var targetText = zip.file('apiproxy/targets/default.xml').asText()
        var proxyParser = new DOMParser().parseFromString(proxyText, 'text/xml')
        var targetParser = new DOMParser().parseFromString(targetText, 'text/xml')
        async.each(Object.keys(api['x-apigee-apply']), function (service, cb) {
          var flow = api['x-apigee-apply'][service].options.flow.charAt(0).toUpperCase() + api['x-apigee-apply'][service].options.flow.slice(1)
          var reqRes = api['x-apigee-apply'][service].options['on'].charAt(0).toUpperCase() + api['x-apigee-apply'][service].options['on'].slice(1)
          if (api['x-apigee-apply'][service].options.endPoint === 'proxy') {
            try {
              var flowParser = proxyParser.documentElement.getElementsByTagName(flow)[0]
              var flowReqRes = flowParser.getElementsByTagName(reqRes)[0]
              flowReqRes.appendChild(new DOMParser().parseFromString('<Step><Name>' + service + '</Name></Step>', 'text/xml'))
            } catch (ex) {
              // do nothing, just print error to log
              logger.handle_error(logger.codes.ERR_INVALID_OPENAPI_SPEC, ex)
            }
          }
          else if (api['x-apigee-apply'][service].options.endPoint === 'target') {
            try {
              var flowParser = targetParser.documentElement.getElementsByTagName(flow)[0]
              var flowReqRes = flowParser.getElementsByTagName(reqRes)[0]
              flowReqRes.appendChild(new DOMParser().parseFromString('<Step><Name>' + service + '</Name></Step>', 'text/xml'))
            } catch (ex) {
              // do nothing, just print error to log
              logger.handle_error(logger.codes.ERR_INVALID_OPENAPI_SPEC, ex)
            }
          }
          cb(null)
        }, function (err) {
          // if any of the file processing produced an error, err would equal that error
          if (err) {
            callback(true, err)
          }
          else {
            // Add back to zip
            zip.file('apiproxy/targets/default.xml', new XMLSerializer().serializeToString(targetParser))
            zip.file('apiproxy/proxies/default.xml', new XMLSerializer().serializeToString(proxyParser))
            callback(null, api, zip)
          }
        })
      } else {
        callback(null, api, zip)
      }
    },
    function (api, zip, callback) {
      // Attach conditional flows
      var proxyText = zip.file('apiproxy/proxies/default.xml').asText()
      var targetText = zip.file('apiproxy/targets/default.xml').asText()
      var proxyParser = new DOMParser().parseFromString(proxyText, 'text/xml')
      var targetParser = new DOMParser().parseFromString(targetText, 'text/xml')
      var allowedVerbs = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT', 'PATCH']

      for (var apiPath in api.paths) {

        for (var resource in api.paths[apiPath]) {

          if (allowedVerbs.indexOf(resource.toUpperCase()) >= 0) {
            var resourceItem = api.paths[apiPath][resource]

            resourceItem.operationId = resourceItem.operationId || resource.toUpperCase() + ' ' + apiPath

            var proxyFlowElement = builder.create('Flow', { headless: true }).att('name', resourceItem.operationId)

            var targetFlowElement = builder.create('Flow', { headless: true }).att('name', resourceItem.operationId)
            var flowCondition = '(request.uri MatchesPath &quot;' + apiPath + '&quot;) and (request.verb = &quot;' + resource.toUpperCase() + '&quot;)'
            proxyFlowElement.ele('Condition').raw(flowCondition)
            proxyFlowElement.ele('Description', {}, resourceItem.summary)
            targetFlowElement.ele('Condition').raw(flowCondition)
            targetFlowElement.ele('Description', {}, resourceItem.summary)
            var requestPipeProxy = proxyFlowElement.ele('Request')
            var responsePipeProxy = proxyFlowElement.ele('Response')
            var requestPipeTarget = targetFlowElement.ele('Request')
            var responsePipeTarget = targetFlowElement.ele('Response')
            var proxyFlow = false
            var targetFlow = false
            if (resourceItem['x-apigee-apply']) {
              // Check proxy / target conditonal flows has any policies
              for (var service in resourceItem['x-apigee-apply']) {
                if (resourceItem['x-apigee-apply'][service].options.endPoint.indexOf('proxy') > -1) {
                  proxyFlow = true
                  // Attach policies now
                  if (resourceItem['x-apigee-apply'][service].options['on'].indexOf('request') > -1) {
                    var step = requestPipeProxy.ele('Step', {})
                    step.ele('Name', {}, service)
                  }
                  if (resourceItem['x-apigee-apply'][service].options['on'].indexOf('response') > -1) {
                    var step = responsePipeProxy.ele('Step', {})
                    step.ele('Name', {}, service)
                  }
                } else if (resourceItem['x-apigee-apply'][service].options.endPoint.indexOf('target') > -1) {
                  targetFlow = true
                  // Attach policies now
                  // Attach policies now
                  if (resourceItem['x-apigee-apply'][service].options['on'].indexOf('request') > -1) {
                    var step = requestPipeTarget.ele('Step', {})
                    step.ele('Name', {}, service)
                  }
                  if (resourceItem['x-apigee-apply'][service].options['on'].indexOf('response') > -1) {
                    var step = responsePipeTarget.ele('Step', {})
                    step.ele('Name', {}, service)
                  }
                }
              }
            } // check for normal policies ends here
            // Check for Security Policies
            if (resourceItem['security']) {
              proxyFlow = true
              // Attach policies now
              for (var security in resourceItem['security']) {
                for (var stepName in resourceItem['security'][security]) {
                  // Attach verify access token policy..
                  var step = requestPipeProxy.ele('Step', {})
                  step.ele('Name', {}, stepName)
                }
              }
            }
            if (proxyFlow) {
              var flowParser = proxyParser.documentElement.getElementsByTagName('Flows')[0]
              flowParser.appendChild(new DOMParser().parseFromString(proxyFlowElement.end({ indent: '  ', newline: '\n' }), 'text/xml'))
            }
            if (targetFlow) {
              var flowParser = targetParser.documentElement.getElementsByTagName('Flows')[0]
              flowParser.appendChild(new DOMParser().parseFromString(targetFlowElement.end({ indent: '  ', newline: '\n' }), 'text/xml'))
            }
          }  // methods check ends here
        }  // for loop for resources ends here
      }  // for loop for paths ends here
      zip.file('apiproxy/targets/default.xml', new XMLSerializer().serializeToString(targetParser))
      zip.file('apiproxy/proxies/default.xml', new XMLSerializer().serializeToString(proxyParser))
      callback(null, zip)
    }
  ], function (err, zip) {
    if (err) {
      cb(true, {})
    } else {
      cb(null, zip)
    }
  })
}

module.exports = {
  generatePolicy: generatePolicy
}
