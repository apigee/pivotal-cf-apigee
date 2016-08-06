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
 * Creates/deletes service binding
 * @module
 */

var async = require('async')

var config = require('./config')
var logger = require('./logger')
var mgmt_api = require('./mgmt_api')
var proxy = require('./edge_proxy')
var service_instance = require('./service_instance')

var saveBinding = require('./datastore').saveBinding
var deleteBinding = require('./datastore').deleteBinding
var getBinding = require('./datastore').getBinding


// See route objects created in calls from api/service_instances
function retrieveServiceInstanceDetails (route, cb) {
  service_instance.fetch(route.instance_id, function (err, data) {
    if (err) {
      cb(err, data)
    } else {
      var filteredData = {
        micro: data.microHost,
        host: data.host, hostpattern: data.hostpattern,
        org: data.apigee_org, env: data.apigee_env,
        user: data.apigee_user, pass: data.apigee_pass,
        route: route
      }
      // logger.log.info({was: data, now: filteredData}, 'retrieveServiceInstanceDetails')
      cb(null, filteredData)
    }
  })
}


function createServiceBinding (route, callback) {
  async.waterfall([
    retrieveServiceInstanceDetails.bind(this, route),
    function (data, cb) {
      proxy.create(data, function (err, route) {
        if (err) {
          var loggerError = logger.ERR_PROXY_CREATION_FAILED(err)
          cb(loggerError)
        } else {
          // result needs to have URL details in it
          cb(null, route)
        }
      })
    },
    function (route, cb) {
      saveBinding(route, function (err, result) {
        if (err) {
          var loggerError = logger.ERR_REDIS_BINDING_SAVE_FAILED(err)
          cb(loggerError)
        } else {
          logger.log.info({result: result}, 'Service Binding Save Binding')
          // need to call back with URL details for forwarding
          cb(null, result)
        }
      })
    }
  ],
  callback)
}

function deleteServiceBinding (route, callback) {
  async.waterfall([
    retrieveServiceInstanceDetails.bind(this, route),
    function (data, cb) {
      getBinding(data.route.binding_id, function (err, binding) {
        if (err) {
          cb(err, binding)
        } else {
          data.proxyname = binding.proxyname
          logger.log.info({data: data}, 'delete binding getBinding')
          cb(null, data)
        }
      })
    },
    function (data, cb) {
      mgmt_api.undeployProxy(data, function (err, result) {
        if (err && err.statusCode == 404) {
          // proxy manually deleted , not found, proceed with service binding deletion
          cb(null, data)
        } else if (err) {
          cb(err, result)
        } else {
          cb(null, data)
        }
      })
    },
    function (data, cb) {
      deleteBinding(data.route, cb)
    }
  ],
  callback)
}

module.exports = {
  create: createServiceBinding,
  delete: deleteServiceBinding
}
