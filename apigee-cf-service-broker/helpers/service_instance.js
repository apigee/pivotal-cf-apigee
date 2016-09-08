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
 * Service instance provisioning
 * @module
 */

var saveServiceInstance = require('./datastore').saveServiceInstance
var getServiceInstance = require('./datastore').getServiceInstance
var deleteServiceInstance = require('./datastore').deleteServiceInstance
var mgmt_api = require('./mgmt_api')
var logger = require('./logger')


function createInstance (instance, callback) {
  // validate user has access to provided apigee org-guid-here
  mgmt_api.authenticate({org: instance.apigee_org, user: instance.apigee_user, pass: instance.apigee_pass}, function (err, data) {
    if (err) {
      // Don't return 401, which is reported as failure of basic-auth to the broker
      if (err.statusCode == 401) {
        var loggerError = logger.ERR_APIGEE_AUTH(err, 400)
        callback(loggerError)
      }
      else {
        callback(err, data)
      }
    } else {
      saveServiceInstance(instance, callback)
    }
  })
}

function getInstance (instance_id, callback) {
  getServiceInstance(instance_id, callback)
}

function deleteInstance (instance_id, callback) {
  deleteServiceInstance(instance_id, callback)
}

module.exports = {
  create: createInstance,
  fetch: getInstance,
  delete: deleteInstance
}
