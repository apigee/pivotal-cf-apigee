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
  ERR_REQ_INVALID_PROTOCOL: 'Invalid protocol, needs to be TLS enabled. Send req over https',
  ERR_REQ_JSON_SCHEMA_FAIL: 'Invalid JSON Sent to the server',
  ERR_PROXY_CREATION_FAILED: 'Proxy Creation Failed',
  ERR_PROXY_UPLOAD_FAILED: 'Proxy Upload Failed',
  ERR_PROXY_ZIP: 'Error in zipping proxy bundle',
  ERR_PROXY_READ_FAILED: 'Error in reading proxy template',
  ERR_PROXY_VHOSTS_NON200_RES: 'Apigee returned non 200 response while fetching Virtual Hosts',
  ERR_APIGEE_AUTH: 'Error Authenticating to Apigee, Please check apigee credentials',
  ERR_APIGEE_REQ_FAILED: 'Error making reqest to Apigee',
  ERR_APIGEE_PROXY_UPLOAD: 'Error uploading proxy to Apigee',
  ERR_APIGEE_GET_PROXY_REV_FAILED: 'Error Retrieving proxy revision details from Apigee ',
  ERR_APIGEE_DEPLOY_PROXY: 'Error deploying proxy to Apigee',
  ERR_APIGEE_UNDEPLOY_PROXY_FAILED: 'Error undeploying proxy from Apigee',
  ERR_APIGEE_GET_KVM: 'Error Retrieving KVM from Apigee',
  ERR_APIGEE_DELETE_KVM: 'Error deleting KVM from Apigee',
  ERR_APIGEE_KVM_NOT_FOUND: 'Error Retrieving KVM from Apigee',
  ERR_APIGEE_KVM_SET_ERROR: 'Error updating KVM in Apigee',
  ERR_KVM_SERVICE_DELETE_FAIL: 'Error deleting service from Apigee KVM',
  ERR_KVM_BINDING_DELETE_FAIL: 'Error deleting binding from Apigee KVM',
  ERR_REDIS: 'Unable to connect to redis',
  ERR_REDIS_SERVICE_GET_KEY_MISSING: 'Service instance details not found in redis',
  ERR_REDIS_SERVICE_DELETE_FAIL: 'Service Instance Deletion Failed',
  ERR_REDIS_SERVICE_SAVE_FAIL: 'Service Instance Saving Failed',
  ERR_REDIS_BINDING_SAVE_FAILED: 'Route Binding Save Failed',
  ERR_REDIS_BINDING_GET_KEY_MISSING: 'Service instance details not found in redis',
  ERR_REDIS_BINDING_DELETE_FAIL: "Route Binding Delete failed",
  ERR_REDIS_DELETE_GET_KEY_MISSING: 'Service instance details not found in redis',
  ERR_CODE_COVERAGE_BADGE: "Error generating code coverage badge"
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