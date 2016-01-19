'use strict'
/*
service instance provisioning
*/

var config = require('../helpers/config')
var saveServiceInstance = require('./datastore')[config.get('cf_broker').datastore].saveServiceInstance
var getServiceInstance = require('./datastore')[config.get('cf_broker').datastore].getServiceInstance
var deleteServiceInstance = require('./datastore')[config.get('cf_broker').datastore].deleteServiceInstance

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
