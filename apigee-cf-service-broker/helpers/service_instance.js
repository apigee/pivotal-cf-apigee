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

/*
service instance provisioning
*/

var saveServiceInstance = require('./datastore')['redis'].saveServiceInstance
var getServiceInstance = require('./datastore')['redis'].getServiceInstance
var deleteServiceInstance = require('./datastore')['redis'].deleteServiceInstance
var mgmt_api = require('./mgmt_api')
var logger = require('./logger')


function createInstance (instance, callback) {
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

function getInstance (instance_id, callback) {
  getServiceInstance(instance_id, function (err, data) {
    if (err) {
      callback(true, data)
    } else {
      callback(null, data)
    }
  })
}

function deleteInstance (instance_id, callback) {
  deleteServiceInstance(instance_id, function (err, data) {
    if (err) {
      callback(err, data)
    } else {
      callback(null, data)
    }
  })
}

module.exports = {
  create: createInstance,
  fetch: getInstance,
  delete: deleteInstance
}
