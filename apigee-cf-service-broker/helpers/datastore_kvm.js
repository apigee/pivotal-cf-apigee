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
 * CRUD datastore functions for provisioning and binding;
 * KVM implementation, not used
 * @module
 */

var mgmt_api = require('./mgmt_api')
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var logger = require('./logger')


/* istanbul ignore next */
function putServiceInstanceKVM (instance, callback) {
  var options = {
    key: instance.instance_id,
    value: instance
  }
  mgmt_api.setKVM(options, function (err, data) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, instance)
    }
  })
}

/* istanbul ignore next */
function getServiceInstanceKVM (instance_id, callback) {
  var options = {
    key: instance_id
  }
  mgmt_api.getKVM(options, function (err, data) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, JSON.parse(data.value))
    }
  })
}

/* istanbul ignore next */
function deleteServiceInstanceKVM (instance_id, callback) {
  var options = {
    key: instance_id
  }
  mgmt_api.deleteKVM(options, function (err, data) {
    if (err) {
      var loggerError = logger.ERR_KVM_SERVICE_DELETE_FAIL(err)
      callback(loggerError)
    } else {
      callback(null, data)
    }
  })
}

/* istanbul ignore next */
function putBindingKVM (route, callback) {
  var options = {
    key: route.binding_id,
    value: route
  }
  mgmt_api.setKVM(options, function (err, data) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, route)
    }
  })
}

/* istanbul ignore next */
function getBindingKVM () {

}

/* istanbul ignore next */
function deleteBindingKVM (route, callback) {
  var options = {
    key: route.binding_id
  }
  mgmt_api.deleteKVM(options, function (err, data) {
    if (err) {
      var loggerError = logger.ERR_KVM_BINDING_DELETE_FAIL(err)
      callback(loggerError)
    } else {
      callback(null, data)
    }
  })
}


module.exports = {
    saveServiceInstance: putServiceInstanceKVM,
    getServiceInstance: getServiceInstanceKVM,
    updateServiceInstance: putServiceInstanceKVM,
    deleteServiceInstance: deleteServiceInstanceKVM,
    saveBinding: putBindingKVM,
    getBinding: getBindingKVM,
    updateBinding: putBindingKVM,
    deleteBinding: deleteBindingKVM
}
