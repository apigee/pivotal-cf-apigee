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

// TODO: refactor

var config = require('../helpers/config')
var service_instance = require('./service_instance')
var async = require('async')
var proxy = require('./edge_proxy')

var mgmt_api = require('./mgmt_api')
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var logger = require('./logger')
var saveBinding = require('./datastore')['redis'].saveBinding
var deleteBinding = require('./datastore')['redis'].deleteBinding
var getBinding = require('./datastore')['redis'].getBinding

function createServiceBinding (route, callback) {
  async.waterfall([ function (cb) {
    // retrieve service instance details
    service_instance.fetch(route.instance_id, function (err, data) {
      if (err) {
        cb(true, data)
      } else {
        // get org and environment and continue
        // logger.log.info({data: data}, 'Service Binding get service instance org')
        var filteredData = {host: data.host, hostpattern: data.hostpattern, org: data.apigee_org, env: data.apigee_env, user: data.apigee_user, pass: data.apigee_pass}
        filteredData.route = route
        cb(null, filteredData)
      }
    }) },
    // create proxy
    function (data, cb) {
      proxy.create(data, function (err, result) {
        if (err) {
          var loggerError = logger.handle_error(logger.codes.ERR_PROXY_CREATION_FAILED, err)
          cb(true, loggerError)
          return
        } else {
          // result needs to have URL details in it
          cb(null, result)
        }
      })
    },
    // store binding details
    function (data, cb) {
      saveBinding(data, function (err, result) {
        if (err) {
          var loggerError = logger.handle_error(logger.codes.ERR_REDIS_BINDING_SAVE_FAILED, err)
          cb(loggerError)
          return
        } else {
          logger.log.info({result: result}, 'Service Binding Save Binding')
          cb(null, result)
        }
      })
    }],
    function (err, result) {
      if (err) {
        callback(true, result)
      } else {
        // need to call back with URL details for forwarding
        callback(null, result)
      }
    })
}

function deleteServiceBinding (route, callback) {
  /* route is
  {
    instance_id: req.params.instance_id,
    binding_id: req.params.binding_id,
    service_id: req.query.service_id,
    plan_id: req.query.plan_id
  }
  */
  async.waterfall([ function (cb) {
    // retrieve service instance details
    service_instance.fetch(route.instance_id, function (err, data) {
      if (err) {
        cb(true, data)
      } else {
        // get org and environment and continue
        // logger.log.info({data: data}, 'Service Binding get service instance org')
        var filteredData = {org: data.apigee_org, env: data.apigee_env, user: data.apigee_user, pass: data.apigee_pass}
        filteredData.route = route
        cb(null, filteredData)
      }
    }) },
  function (data, cb) {
    getBinding(data.route.binding_id, function (err, binding) {
      if (err) {
        cb(true, binding)
        return
      } else {
        data.proxyname = binding.proxyname
        logger.log.info({data: data}, 'delete binding getBinding')
        cb(null, {org: data.org, env: data.env, proxyname: binding.proxyname, route: data.route, user: data.user, pass: data.pass})
      }
    })
  },
  function (data, cb) {
    mgmt_api.undeployProxy(data, function (err, result) {
      if (err == 404) {
        // proxy manually deleted , not found, proceed with service binding deletion
        cb(null, data)
      }
      else if (err) {
        cb(err, result)
        return
      } else {
        cb(null, data)
      }
    })
  }, function (data, cb) {
    // delete data
    deleteBinding(data.route, function (err, result) {
      if (err) {
        cb(true, result)
        return
      } else {
        cb(null, {})
      }
    })
  }], function (err, result) {
    if (err) {
      callback(true, result)
    } else {
      // need to call back with URL details for forwarding
      callback(null, result)
    }
  })
}

module.exports = {
  create: createServiceBinding,
  delete: deleteServiceBinding
}
