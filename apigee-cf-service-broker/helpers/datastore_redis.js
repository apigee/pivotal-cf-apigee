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
var crypto = require('crypto')
var config = require('./config')
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
    retry_strategy: function (options) {
        if (options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.times_connected > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 3000);
    }
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
  var encrypted = cipher.update(JSON.stringify(instance), 'utf-8', 'hex')
  encrypted += cipher.final('hex')
  rclient.hset('serviceInstance', key, encrypted, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS_SERVICE_SAVE_FAIL(err)
      callback(loggerError)
    } else {
      callback(null, instance)
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
    } else if (result == null) {
      var loggerError = logger.ERR_REDIS_SERVICE_GET_KEY_MISSING({instance_id : key}, 404)
      callback(loggerError)
    } else {
      var decrypted = decipher.update(result, 'hex', 'utf-8')
      decrypted += decipher.final('utf-8')
      result = JSON.parse(decrypted)
      // logger.log.info({redis: result}, 'Service Instance Details in Redis')
      callback(null, result)
    }
  })
}

function deleteServiceInstanceRedis (instance_id, callback) {
  var key = instance_id
  rclient.hdel('serviceInstance', key, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS_SERVICE_DELETE_FAIL(err)
      callback(loggerError)
    } else if (result == 0) {
      var loggerError = logger.ERR_REDIS_DELETE_GET_KEY_MISSING({instance_id : key}, 410)
      callback(loggerError)
    } else {
      callback(null, {})
    }
  })
}

function putBindingRedis (bindRes, callback) {
  var key = bindRes.binding_id
  rclient.hset('routeBinding', key, JSON.stringify(bindRes), function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS_BINDING_SAVE_FAIL(err)
      callback(loggerError)
    } else {
      callback(null, bindRes)
    }
  })
}

function getBindingRedis (binding_id, callback) {
  var key = binding_id
  rclient.hget('routeBinding', key, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS(err)
      callback(loggerError)
    } else if (result == null) {
      var loggerError = logger.ERR_REDIS_BINDING_GET_KEY_MISSING({binding_id : key}, 404)
      callback(loggerError)
    } else {
      callback(null, JSON.parse(result))
    }
  })
}

function deleteBindingRedis (binding_id, callback) {
  var key = binding_id
  rclient.hdel('routeBinding', key, function (err, result) {
    if (err) {
      var loggerError = logger.ERR_REDIS_BINDING_DELETE_FAIL(err)
      callback(loggerError)
    } else if (result == 0) {
      var loggerError = logger.ERR_REDIS_DELETE_GET_KEY_MISSING({binding_id : key}, 410)
      callback(loggerError)
    } else {
      callback(null, {})
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
