var swaggerParser = require('swagger-parser')
var async = require('async')
var JSZip = require('jszip')
var logger = require('./logger')
var quota = require('../policy_templates/quota/quota.js');
var spike = require('../policy_templates/spikeArrest/spikeArrest.js');
var cache = require('../policy_templates/cache/responseCache.js');
var verifyApiKey = require('../policy_templates/security/apikey.js');
var oauth2 = require('../policy_templates/security/verifyAccessToken.js');

var generatePolicy = function(route, zip, cb) {
  var routeUrl
  if (process.env.NODE_ENV === 'TEST') {
    routeUrl = 'http://' + route.bind_resource.route
  }
  else {
    routeUrl = 'https://' + route.bind_resource.route
  }
  async.waterfall([
    // check for swagger
    function(callback) {
      swaggerParser.parse(routeUrl + '/swagger.json', function(err, api, metadata) {
        if (err) {
          // TODO: Error / Warning
          var loggerError = logger.handle_error(logger.codes.ERR_SWAGGER_NOT_FOUND, err)
          callback(true, loggerError)
        } else {
          callback(null, api)
        }
      })
    },
    function(api, callback) {
      // Valid Swagger Found -- Look for A127 Policies
      if (api['x-a127-services']) {
        async.each(Object.keys(api['x-a127-services']), function(service, cb) {
          // Perform operation on file here.
          var provider = api['x-a127-services'][service].provider;
          var xmlString = '';
          if (provider.indexOf('quota') > -1) {
            // Add Quota Policy
            xmlString = quota.quotaGenTemplate(api['x-a127-services'][service].options, service);
          }
          if (provider.indexOf('spike') > -1) {
            // Add spike Policy
            xmlString = spike.spikeArrestGenTemplate(api['x-a127-services'][service].options, service);
          }
          if (provider.indexOf('cache') > -1) {
            // Add cache Policies
            xmlString = cache.responseCacheGenTemplate(api['x-a127-services'][service].options, service);
          }
          if (provider.indexOf('oauth') > -1 && (service == "apiKeyQuery" || service == "apiKeyHeader")) {
            // Add cache Policies
            xmlString = verifyApiKey.apiKeyGenTemplate(api['x-a127-services'][service].options, service);
          }
          if (provider.indexOf('oauth') > -1 && (service == "oauth2")) {
            // Add cache Policies
            xmlString = oauth2.verifyAccessTokenGenTemplate(api['x-a127-services'][service].options, "verifyAccessToken");
          }
          zip.folder('apiproxy/policies').file(service  +".xml", xmlString)
          cb(null)
        }, function(err){
          // if any of the file processing produced an error, err would equal that error
          if(err) {
            callback(true, err)
          } else {
            callback(null, zip);
          }
        })
      } else {
        // TODO: Error / Warning
        var loggerError = logger.handle_error(logger.codes.ERR_POLICIES_NOT_FOUND, err)
        callback(true, loggerError);
      }
    }
  ], function (err, zip) {
    if (err) {
      cb(true, {})
    }
    else {
      cb(null, zip)
    }
  })
}

module.exports = {
  generatePolicy: generatePolicy
}