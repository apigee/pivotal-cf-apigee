var log = require('bunyan').createLogger({name: 'apigee'})
var util = require('util')

var codes = {
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
  ERR_CODE_COVERAGE_BADGE: 'E0070'
}

var messages = {
  E0011: 'Invalid protocol, needs to be TLS enabled. Send req over https',
  E0010: 'Invalid JSON Sent to the server',
  E0020: 'Proxy Creation Failed',
  E0021: 'Proxy Upload Failed',
  E0022: 'Error in zipping proxy bundle',
  E0023: 'Error in reading proxy template',
  E0024: 'Apigee returned non 200 response while fetching Virtual Hosts',
  E0030: 'Error Authenticating to Apigee, Please check apigee credentials',
  E0031: 'Error making reqest to Apigee',
  E0032: 'Error uploading proxy to Apigee',
  E0033: 'Error Retrieving proxy revision details from Apigee ',
  E0034: 'Error deploying proxy to Apigee',
  E0035: 'Error undeploying proxy from Apigee',
  E0036: 'Error Retrieving KVM from Apigee',
  E0037: 'Error deleting KVM from Apigee',
  E0038: 'Error Retrieving KVM from Apigee',
  E0039: 'Error updating KVM in Apigee',
  E0040: 'Error deleting service from Apigee KVM',
  E0041: 'Error deleting binding from Apigee KVM',
  E0060: 'Unable to connect to redis',
  E0061: 'Service instance details not found in redis',
  E0062: 'Service Instance Deletion Failed',
  E0063: 'Service Instance Saving Failed',
  E0064: 'Route Binding Save Failed',
  E0065: 'Service instance details not found in redis',
  E0066: "Route Binding Delete failed",
  E0067: 'Service instance details not found in redis',
  E0070: "Error generating code coverage badge"
}

var getMessage = function(code) {
  return util.format('[%s] - %s', code, messages[code])
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