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
 * Redis implementation
 * @module
 */

var redis = require('redis')
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var crypto = require('crypto')
var config = require('../helpers/config')
var logger = require('./logger')
var cfenv = require('cfenv')

var rclient
/* istanbul ignore else */
if (process.env.NODE_ENV === 'TEST') {
  rclient = require('redis-mock').createClient()
} else {
  var appEnv = cfenv.getAppEnv()
  var credentials = appEnv.getServiceCreds('apigee_cf_service_broker-p-redis')
  var options = {
    port: credentials.port,
    host: credentials.host,
    no_ready_check: true,
    max_attempts: 2,
    connect_timeout: 3000
  }
  rclient = redis.createClient(options)
  rclient.on('error', function (err) {
    logger.ERR_REDIS(err)
  })
  rclient.auth(credentials.password)
}


function putServiceInstanceRedis (instance, callback) {
  var cipher = crypto.createCipher('aes192', config.get('APIGEE_REDIS_PASSPHRASE'))
  var key = instance.instance_id
  instance = cipher.update(JSON.stringify(instance), 'utf-8', 'hex')
  instance += cipher.final('hex')
  rclient.hset('serviceInstance', key, instance, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS_SERVICE_SAVE_FAIL(err)
      callback(loggerError)
    } else {
      callback(null, result)
    }
  })
}

function getServiceInstanceRedis (instance_id, callback) {
  var decipher = crypto.createDecipher('aes192', config.get('APIGEE_REDIS_PASSPHRASE'))
  var key = instance_id
  rclient.hget('serviceInstance', key, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS(err)
      callback(loggerError)
    }
    else if (result == null) {
      var loggerError = logger.ERR_REDIS_SERVICE_GET_KEY_MISSING({instance_id : key}, 404)
      callback(loggerError)
    }
    else {
      logger.log.info({redis: result}, 'Service Instance Details in Redis')
      var decrypted = decipher.update(result, 'hex', 'utf-8')
      decrypted += decipher.final('utf-8')
      callback(null, JSON.parse(decrypted))
    }
  })
}

function deleteServiceInstanceRedis (instance_id, callback) {
  // delete from redis
  var key = instance_id
  rclient.hdel('serviceInstance', key, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS_SERVICE_DELETE_FAIL(err)
      callback(loggerError)
    } else if (result == 0) {
      var loggerError = logger.ERR_REDIS_DELETE_GET_KEY_MISSING({instance_id : key}, 410)
      callback(loggerError)
    }
    else {
      callback(null, result)
    }
  })
}

function putBindingRedis (route, callback) {
  var key = route.binding_id
  route = JSON.stringify(route)
  rclient.hset('routeBinding', key, route, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS_BINDING_SAVE_FAIL(err)
      callback(loggerError)
    } else {
      callback(null, JSON.parse(this.route))
    }
  }.bind({ route: route }))
}

function getBindingRedis (binding_id, callback) {
  // get from redis
  var key = binding_id
  rclient.hget('routeBinding', key, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS(err)
      callback(loggerError)
    }
    else if (result == null) {
      var loggerError = logger.ERR_REDIS_BINDING_GET_KEY_MISSING({binding_id : key}, 404)
      callback(loggerError)
    } else {
      callback(null, JSON.parse(result))
    }
  })
}

function deleteBindingRedis (route, callback) {
  var key = route.binding_id
  rclient.hdel('routeBinding', key, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS_BINDING_DELETE_FAIL(err)
      callback(loggerError)
    }
    else if (result == 0) {
      var loggerError = logger.ERR_REDIS_DELETE_GET_KEY_MISSING({binding_id : key}, 410)
      callback(loggerError)
    } else {
      callback(null, result)
    }
  })
}


module.exports = {
    saveServiceInstance: putServiceInstanceRedis,
    getServiceInstance: getServiceInstanceRedis,
    updateServiceInstance: putServiceInstanceRedis,
    deleteServiceInstance: deleteServiceInstanceRedis,
    saveBinding: putBindingRedis,
    getBinding: getBindingRedis,
    updateBinding: putBindingRedis,
    deleteBinding: deleteBindingRedis
}
