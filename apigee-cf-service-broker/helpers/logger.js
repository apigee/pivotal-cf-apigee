var log = require('bunyan').createLogger({name: 'apigee'})
var util = require('util')

var codes = {
  ERR_REQ_JSON_SCHEMA_FAIL: 'E0010',
  ERR_REQ_INVALID_PROTOCOL: 'E0011',
  ERR_PROXY_CREATION_FAILED: 'E0020',
  ERR_APIGEE_AUTH: 'E0030',
  ERR_APIGEE_REQ_FAILED: 'E0031',
  ERR_SERVICE_DELETE_FAIL: 'E0041',
  ERR_SERVICE_SAVE_FAIL: 'E0042',
  ERR_SERVICE_GET_FAIL: 'E0043',
  ERR_BINDING_SAVE_FAILED: 'E0052',
  ERR_BINDING_GET_FAILED: 'E0053',
  ERR_REDIS: 'E0060',
  ERR_REDIS_SERVICE_GET_KEY_MISSING: 'E0061'
}

var messages = {
  ERR_REQ_INVALID_PROTOCOL: 'Invalid protocol, needs to be TLS enabled. Send req over https',
  ERR_REQ_JSON_SCHEMA_FAIL: 'Invalid JSON Sent to the server',
  ERR_PROXY_CREATION_FAILED: 'Proxy Creation Failed',
  ERR_APIGEE_AUTH: 'Error Authenticating to Apigee, Please check apigee credentials',
  ERR_APIGEE_REQ_FAILED: 'Error making reqest to Apigee',
  ERR_SERVICE_DELETE_FAIL: 'Service Instance Deletion Failed',
  ERR_SERVICE_SAVE_FAIL: 'Service Instance Saving Failed',
  ERR_SERVICE_GET_FAIL: 'Service Instance Retrieving Failed',
  ERR_BINDING_SAVE_FAILED: 'Route Binding Save Failed',
  ERR_BINDING_GET_FAILED: 'Route Binding Get Details Failed',
  ERR_REDIS: 'Unable to connect to redis',
  ERR_REDIS_SERVICE_GET_KEY_MISSING: 'Service instance details not found in redis'
}

var getMessage = function(code) {
  return util.format('[%s] - %s', codes[code], messages[code])
}

var handle_error = function(code, err) {
// console log error for pcf
  log.error({errDetails: err}, getMessage(code));
// return the error object
  return new Error(getMessage(code))
}


module.exports = {
  codes: codes,
  messages: messages,
  getMessage: getMessage,
  handle_error: handle_error,
  log: log
}