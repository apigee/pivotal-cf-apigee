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


// See bindReq objects created in calls from api/service_instances
function retrieveServiceInstanceDetails (bindReq, cb) {
  service_instance.fetch(bindReq.instance_id, function (err, instance) {
    if (err) {
      cb(err, instance)
    } else {
      var bindDetails = {
        micro: instance.micro_host,
        host: instance.host_template,
        org: instance.apigee_org, env: instance.apigee_env,
        user: instance.apigee_user, pass: instance.apigee_pass,
        bindReq: bindReq
      }
      // logger.log.info({was: data, now: filteredData}, 'retrieveServiceInstanceDetails')
      cb(null, bindDetails)
    }
  })
}


function createServiceBinding (bindReq, callback) {
  async.waterfall([
    retrieveServiceInstanceDetails.bind(this, bindReq),
    function (bindDetails, cb) {
      proxy.create(bindDetails, function (err, bindRes) {
        if (err) {
          var loggerError = logger.ERR_PROXY_CREATION_FAILED(err)
          cb(loggerError)
        } else {
          // result needs to have URL details in it
          cb(null, bindRes)
        }
      })
    },
    function (bindRes, cb) {
      saveBinding(bindRes, function (err, result) {
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

function deleteServiceBinding (bindReq, callback) {
  async.waterfall([
    retrieveServiceInstanceDetails.bind(this, bindReq),
    function (bindDetails, cb) {
      getBinding(bindDetails.bindReq.binding_id, function (err, bindRes) {
        if (err) {
          cb(err, bindRes)
        } else {
          bindDetails.proxyname = bindRes.proxyname
          const maskedDetails = Object.assign({}, bindDetails, {pass: '****'})
          logger.log.info({bindDetails: maskedDetails}, 'delete binding getBinding')
          cb(null, bindDetails)
        }
      })
    },
    function (bindDetails, cb) {
      mgmt_api.undeployProxy(bindDetails, function (err, result) {
        if (err && err.statusCode == 404) {
          // proxy manually deleted , not found, proceed with service binding deletion
          cb(null, bindDetails)
        } else if (err) {
          cb(err, result)
        } else {
          cb(null, bindDetails)
        }
      })
    },
    function (bindDetails, cb) {
      deleteBinding(bindDetails.bindReq.binding_id, cb)
    }
  ],
  callback)
}

module.exports = {
  create: createServiceBinding,
  delete: deleteServiceBinding
}
