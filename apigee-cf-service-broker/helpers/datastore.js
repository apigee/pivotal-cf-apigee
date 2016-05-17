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
 CRUD datastore functions for provisioning and binding
*/
var mgmt_api = require('./mgmt_api')
var redis = require('redis')
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var crypto = require('crypto')
var config = require('../helpers/config')
var logger = require('./logger')
var cfenv = require('cfenv')

// redis client
// parsing redis cloud credentials
var appEnv = cfenv.getAppEnv()
var rclient
var options
if (process.env.NODE_ENV === 'TEST') {
  rclient = require('redis-mock').createClient()
} else {
  var credentials = appEnv.getServiceCreds('apigee_cf_service_broker-p-redis')
  options = {
    port: credentials.port,
    host: credentials.host,
    no_ready_check: true,
    max_attempts: 2,
    connect_timeout: 3000
  }
  rclient = redis.createClient(options)
  rclient.on('error', function (err) {
    logger.handle_error(logger.codes.ERR_REDIS, err)
  })
  rclient.auth(credentials.password)
}

// KVM storage functions - We are not using
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
      var loggerError = logger.handle_error(logger.codes.ERR_KVM_SERVICE_DELETE_FAIL, err)
      callback(true, loggerError)
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
      var loggerError = logger.handle_error(logger.codes.ERR_KVM_BINDING_DELETE_FAIL, err)
      callback(true, loggerError)
    } else {
      callback(null, data)
    }
  })
}

// Redis storage
function putServiceInstanceRedis (instance, callback) {
  var cipher = crypto.createCipher('aes192', config.get('APIGEE_REDIS_PASSPHRASE'))
  var key = instance.instance_id
  instance = cipher.update(JSON.stringify(instance), 'utf-8', 'hex')
  instance += cipher.final('hex')
  rclient.hset('serviceInstance', key, instance, function (err, result) {
    if (err) {
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS_SERVICE_SAVE_FAIL, err)
      callback(true, loggerError)
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
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS, err)
      callback(true, loggerError)
    }
    else if (result == null) {
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS_SERVICE_GET_KEY_MISSING, err)
      callback(true, loggerError)
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
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS_SERVICE_DELETE_FAIL, err)
      callback(500, loggerError)
    } else if (result == 0) {
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS_DELETE_GET_KEY_MISSING, err)
      callback(410, loggerError)
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
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS_BINDING_SAVE_FAIL, err)
      callback(true, loggerError)
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
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS, err)
      callback(true, loggerError)
    }
    else if (result == null) {
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS_BINDING_GET_KEY_MISSING, err)
      callback(true, loggerError)
    } else {
      callback(null, JSON.parse(result))
    }
  })
}

function deleteBindingRedis (route, callback) {
  var key = route.binding_id
  rclient.hdel('routeBinding', key, function (err, result) {
    if (err) {
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS_BINDING_DELETE_FAIL, err)
      callback(true, loggerError)
    }
    else if (result == 0) {
      var loggerError = logger.handle_error(logger.codes.ERR_REDIS_DELETE_GET_KEY_MISSING, err)
      callback(410, loggerError)
    } else {
      callback(null, result)
    }
  })
}

// service catalog - TODO: this should be configurable
function getServiceCatalog () {
  return [
    {
      id: '5E3F917B-9225-4BE4-802F-8F1491F714C0',
      name: 'apigee-edge',
      description: 'Apigee Edge API Platform',
      bindable: true,
      tags: ['api', 'api management', 'api platform'],
      metadata: {
        displayName: 'Apigee Edge API Platform',
        imageUrl: 'http://apigee.com/about/sites/all/themes/apigee_themes/apigee_bootstrap/ApigeeLogo@2x.png',
        longDescription: 'Apigee Edge enables digital business acceleration with a unified and complete platform, purpose-built for the digital economy. Edge simplifies managing the entire digital value chain with API Services, Developer Services, and Analytics Services.',
        providerDisplayName: 'Apigee',
        documentationUrl: 'http://apigee.com/docs/',
        supportUrl: 'http://community.apigee.com/'
      },
      requires: ['route_forwarding'],
      plan_updateable: true,
      plans: [
        {
          id: 'A98CCB00-549B-458F-A627-D54C5E860519',
          name: 'org',
          description: 'Apigee Edge for Route Services',
          metadata: {
            displayName: 'Apigee Edge for Route Services',
          },
          free: true
        }
        // ,{
        //   id: 'D4D617E1-B4F9-49C7-91C8-52AB9DE8C18F',
        //   name: 'free',
        //   description: 'Free/Trial plan for Apigee Edge.',
        //   metadata: {
        //     displayName: 'Apigee Edge Free',
        //     bullets: ['Apigee Cloud deployment',
        //     '1 million API calls per quarter',
        //     'Community support',
        //     'One development developer portal']
        //   },
        //   free: true
        // },
        // {
        //   id: 'F443B68-E074-435D-87C4-5D69C6D6E901',
        //   name: 'startup',
        //   description: 'Startup Plan',
        //   metadata: {
        //     displayName: 'Apigee Edge Startup',
        //     bullets: ['Apigee Cloud deployment',
        //     '5 million API calls per quarter',
        //     'One support account',
        //     'One production developer portal'],
        //     costs: [
        //       {
        //         amount: {
        //           'usd': 300.0
        //         },
        //         unit: 'MONTHLY'
        //       }
        //     ]
        //   },
        //   free: false
        // },
        // {
        //   id: 'EDF6AAB1-BE43-465E-B038-CDED0FB30A04',
        //   name: 'smb',
        //   description: 'Small Business Plan',
        //   metadata: {
        //     displayName: 'Apigee Edge SMB',
        //     bullets: ['Apigee Cloud deployment',
        //     '25 million API calls per quarter',
        //     'One support account',
        //     'One production developer portal'],
        //     costs: [
        //       {
        //         amount: {
        //           'usd': 2250.0
        //         },
        //         unit: 'MONTHLY'
        //       }
        //     ]
        //   },
        //   free: false
        // },
        // {
        //   id: '3EFF38EB-0DB9-4CFB-AD74-7AA205FD3A2F',
        //   name: 'enterprise',
        //   description: 'Enterprise Plan',
        //   metadata: {
        //     displayName: 'Apigee Edge Enterprise',
        //     bullets: ['Apigee Cloud deployment',
        //     '250 million (and up) API calls per quarter',
        //     'Community support',
        //     'One developer portal'],
        //     costs: [{}]
        //   },
        //   free: false
        // }
      ],
      dashboard_client: {
        id: 'apigee-dashboard-client-id',
        secret: 'secret code phrase',
        redirect_uri: 'https://enterprise.apigee.com'
      }
    }
  ]
}

module.exports = {
  kvm: {
    saveServiceInstance: putServiceInstanceKVM,
    getServiceInstance: getServiceInstanceKVM,
    updateServiceInstance: putServiceInstanceKVM,
    deleteServiceInstance: deleteServiceInstanceKVM,
    saveBinding: putBindingKVM,
    getBinding: getBindingKVM,
    updateBinding: putBindingKVM,
    deleteBinding: deleteBindingKVM,
    getServiceCatalog: getServiceCatalog
  },
  redis: {
    saveServiceInstance: putServiceInstanceRedis,
    getServiceInstance: getServiceInstanceRedis,
    updateServiceInstance: putServiceInstanceRedis,
    deleteServiceInstance: deleteServiceInstanceRedis,
    saveBinding: putBindingRedis,
    getBinding: getBindingRedis,
    updateBinding: putBindingRedis,
    deleteBinding: deleteBindingRedis,
    getServiceCatalog: getServiceCatalog
  }
}
