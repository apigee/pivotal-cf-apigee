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
 * Log messages/errors
 * @module
 */

var log = require('bunyan').createLogger({name: 'apigee'})
var util = require('util')

var codes = {
  ERR_UAE: 'E0000',
  ERR_REQ_JSON_SCHEMA_FAIL: 'E0010',
  ERR_REQ_INVALID_PROTOCOL: 'E0011',
  ERR_PROXY_CREATION_FAILED: 'E0020',
  ERR_PROXY_UPLOAD_FAILED: 'E0021',
  ERR_PROXY_ZIP: 'E0022',
  ERR_PROXY_READ_FAILED: 'E0023',
  ERR_PROXY_VHOSTS_NON200_RES: 'E0024',
  ERR_APIGEE_AUTH: 'E0030',
  ERR_APIGEE_REQ_FAILED: 'E0031',
  ERR_APIGEE_PROXY_UPLOAD: 'E0032',
  ERR_APIGEE_GET_PROXY_REV_FAILED: 'E0033',
  ERR_APIGEE_DEPLOY_PROXY: 'E0034',
  ERR_APIGEE_UNDEPLOY_PROXY_FAILED: 'E0035',
  ERR_APIGEE_GET_KVM: 'E0036',
  ERR_APIGEE_DELETE_KVM: 'E0037',
  ERR_APIGEE_KVM_NOT_FOUND: 'E0038',
  ERR_APIGEE_KVM_SET_ERROR: 'E0039',
  ERR_APIGEE_PROXY_NOT_FOUND: 'E00310',
  ERR_KVM_SERVICE_DELETE_FAIL: 'E0040',
  ERR_KVM_BINDING_DELETE_FAIL: 'E0041',
  ERR_REDIS: 'E0060',
  ERR_REDIS_SERVICE_GET_KEY_MISSING: 'E0061',
  ERR_REDIS_SERVICE_DELETE_FAIL: 'E0062',
  ERR_REDIS_SERVICE_SAVE_FAIL: 'E0063',
  ERR_REDIS_BINDING_SAVE_FAILED: 'E0064',
  ERR_REDIS_BINDING_GET_KEY_MISSING: 'E0065',
  ERR_REDIS_BINDING_DELETE_FAIL: 'E0066',
  ERR_REDIS_DELETE_GET_KEY_MISSING: 'E0067',
  ERR_CODE_COVERAGE_BADGE: 'E0070',
  ERR_OPENAPI_PARSE_FAIL: 'E0080',
  ERR_POLICIES_NOT_FOUND: 'E0081',
  ERR_INVALID_OPENAPI_SPEC: 'E0082'
}

var messages = {
  E0000: 'Unexpected Application Error',
  E0010: 'Invalid JSON Sent to the server',
  E0011: 'Invalid protocol, needs to be TLS enabled. Send req over https',
  E0020: 'Proxy Creation Failed',
  E0021: 'Proxy Upload Failed',
  E0022: 'Error in zipping proxy bundle',
  E0023: 'Error in reading proxy template',
  E0024: 'Apigee returned non-200 response while fetching Virtual Hosts',
  E0030: 'Error Authenticating to Apigee, Please check Apigee credentials',
  E0031: 'Error making request to Apigee',
  E0032: 'Error uploading proxy to Apigee',
  E0033: 'Error Retrieving proxy revision details from Apigee',
  E0034: 'Error deploying proxy to Apigee',
  E0035: 'Error undeploying proxy from Apigee',
  E0036: 'Error Retrieving KVM from Apigee',
  E0037: 'Error deleting KVM from Apigee',
  E0038: 'Error Retrieving KVM from Apigee',
  E0039: 'Error updating KVM in Apigee',
  E00310: 'Error proxy not found in Apigee',
  E0040: 'Error deleting service from Apigee KVM',
  E0041: 'Error deleting binding from Apigee KVM',
  E0060: 'Unable to connect to redis',
  E0061: 'Service instance details not found in redis',
  E0062: 'Service Instance Deletion Failed',
  E0063: 'Service Instance Saving Failed',
  E0064: 'Route Binding Save Failed',
  E0065: 'Service instance details not found in redis',
  E0066: 'Route Binding Delete failed',
  E0067: 'Service instance details not found in redis',
  E0070: 'Error generating code coverage badge',
  E0080: 'Error getting OpenAPI interface file',
  E0081: 'Unable to find policies in Open API spec',
  E0082: 'Invalid Open API Spec, Check policy attachment'
}

var getMessage = function(code) {
  return util.format('[%s] - %s', code, messages[code])
}

function LoggerError(code, statusCode) {
    Error.captureStackTrace(this, handle_error)
    let line = this.stack.split('\n')[1]
    this.topOfStack = line ? line.trim() : line
    this.code = code
    this.description = getMessage(code)  // 'description' expected in CF response
    this.statusCode = statusCode || 500
}
util.inherits(LoggerError, Error)

var handle_error = function(code, originalErr, statusCode) {
    if (originalErr instanceof LoggerError) {
        if (statusCode) {
          originalErr.statusCode = statusCode
        }
        return originalErr
    }

    const error = new LoggerError(code, statusCode)

    log.error({
        errAt: error.topOfStack,
        errStatusCode: statusCode,  // undefined if used default 500
        errDetails: originalErr
    }, error.message);
    return error
}


module.exports.log = log;
for (let name in codes) {
    const code = codes[name]
    const fn = handle_error.bind(this, code)
    fn.code = code
    module.exports[name] = fn
}
