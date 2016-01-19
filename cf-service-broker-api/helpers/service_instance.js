'use strict'
/*
service instance provisioning
*/

var config = require('../helpers/config')
var saveServiceInstance = require('./datastore')[config.get('cf_broker').datastore].saveServiceInstance
var getServiceInstance = require('./datastore')[config.get('cf_broker').datastore].getServiceInstance

// TODO: should probably validate the org/env info. Could be mgmt_api function.
function create (instance, callback) {
  // console.log('service_instance.create: ' + JSON.stringify(instance))
  saveServiceInstance(instance, function (err, data) {
    if (err) {
      callback('Error saving service instance to datastore. ' + err, null)
    } else {
      callback(null, data)
    }
  })
}

function get (instance_id, callback) {
  getServiceInstance(instance_id, function (err, data) {
    if (err) {
      callback('Error getting service instance from datastore. ' + err, null)
    } else {
      callback(null, data)
    }
  })
}

module.exports = {
  create: create,
  get: get
}
