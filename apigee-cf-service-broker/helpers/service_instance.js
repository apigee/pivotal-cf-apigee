'use strict'
/*
service instance provisioning
*/

var config = require('../helpers/config')
var saveServiceInstance = require('./datastore')[config.get('cf_broker').datastore].saveServiceInstance
var getServiceInstance = require('./datastore')[config.get('cf_broker').datastore].getServiceInstance
var deleteServiceInstance = require('./datastore')[config.get('cf_broker').datastore].deleteServiceInstance
var mgmt_api = require('./mgmt_api')

// TODO: should probably validate the org/env info. Could be mgmt_api function.
function create (instance, callback) {
  // console.log('service_instance.create: ' + JSON.stringify(instance))
  // validate user has access to provided apigee org-guid-here
  mgmt_api.authenticate({org: instance.apigee_org, user: instance.apigee_user, pass: instance.apigee_pass}, function (err, data) {
    if (err) {
      // problem
      console.error('Auth to apigee failed.', err, data)
      callback('401', null)
    } else {
      saveServiceInstance(instance, function (err, data) {
        if (err) {
          callback('Error saving service instance to datastore. ' + err, null)
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
      console.error('error getting service instance from datastore', err)
      callback(err, null)
    } else {
      callback(null, data)
    }
  })
}

function deleteInstance (instance_id, callback) {
  deleteServiceInstance(instance_id, function (err, data) {
    if (err) {
      console.error('error deleting service instance', err)
      callback(err, null)
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
