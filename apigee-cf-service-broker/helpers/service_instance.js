'use strict'
/*
service instance provisioning
*/

var saveServiceInstance = require('./datastore')['redis'].saveServiceInstance
var getServiceInstance = require('./datastore')['redis'].getServiceInstance
var deleteServiceInstance = require('./datastore')['redis'].deleteServiceInstance
var mgmt_api = require('./mgmt_api')
var logger = require('./logger')

// TODO: should probably validate the org/env info. Could be mgmt_api function.
function create (instance, callback) {
  // validate user has access to provided apigee org-guid-here
  mgmt_api.authenticate({org: instance.apigee_org, user: instance.apigee_user, pass: instance.apigee_pass}, function (err, data) {
    if (err) {
      callback(true, data)
    } else {
      saveServiceInstance(instance, function (err, data) {
        if (err) {
          callback(true, data)
        } else {
          callback(null, data)
        }
      })
    }
  })
}

function get (instance_id, callback) {
  getServiceInstance(instance_id, function (err, data) {
    if (err) {
      var loggerError = logger.handle_error('ERR_SERVICE_GET_FAIL', err)
      callback(loggerError, null)
    } else {
      callback(null, data)
    }
  })
}

function deleteInstance (instance_id, callback) {
  deleteServiceInstance(instance_id, function (err, data) {
    if (err) {
      var loggerError = logger.handle_error('ERR_SERVICE_DELETE_FAIL', err)
      callback(err, loggerError)
    } else {
      callback(null, data)
    }
  })
}

module.exports = {
  create: create,
  get: get,
  del: deleteInstance
}
