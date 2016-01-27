'use strict'
/*
 CRUD datastore functions for provisioning and binding
*/
var mgmt_api = require('./mgmt_api')
var redis = require('redis')

// redis client
// parsing redis cloud credentials
var vcap_services = process.env.VCAP_SERVICES
var credentials = JSON.parse(vcap_services)['p-redis'][0].credentials
var options = {
  port: credentials.port,
  host: credentials.host,
  no_ready_check: true
}
var rclient = redis.createClient(options)
rclient.on('error', function (err) {
  console.error('redis error', err)
})
rclient.auth(credentials.password)

// KVM storage functions
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

function deleteServiceInstanceKVM (instance_id, callback) {
  var options = {
    key: instance_id
  }
  mgmt_api.deleteKVM(options, function (err, data) {
    if (err) {
      console.error('error deleting kvm', err)
      callback(err, null)
    } else {
      callback(null, data)
    }
  })
}

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

function getBindingKVM () {

}

function deleteBindingKVM (route, callback) {
  var options = {
    key: route.binding_id
  }
  mgmt_api.deleteKVM(options, function (err, data) {
    if (err) {
      console.error('error deleting kvm', err)
      callback(err, null)
    } else {
      callback(null, data)
    }
  })
}

// Redis storage
function putServiceInstanceRedis (instance, callback) {
  var key = 'serviceinstance:' + instance.instance_id
  rclient.hset(key, instance, function (err, result) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, result)
    }
  })
}

function getServiceInstanceRedis (instance_id, callback) {
  var key = 'serviceinstance:' + instance_id
  rclient.hgetall(key, function (err, result) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, result)
    }
  })
}

function deleteServiceInstanceRedis (instance_id, callback) {
  // delete from redis
  var key = 'serviceinstance:' + instance_id
  rclient.del(key, function (err, result) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, result)
    }
  })
}

function putBindingRedis (route, callback) {
  var key = 'routebinding:' + route.binding_id
  rclient.hset(key, route, function (err, result) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, result)
    }
  })
}

function getBindingRedis (binding_id, callback) {
  // get from redis
}

function deleteBindingRedis (route, callback) {
  var key = 'routebinding:' + route.binding_id
  rclient.del(key, function (err, result) {
    if (err) {
      callback(err, null)
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
      tags: ['api', 'api management', 'awesome'],
      metadata: {
        displayName: 'Apigee Edge API Platform',
        imageUrl: 'http://apigee.com/about/sites/all/themes/apigee_themes/apigee_bootstrap/ApigeeLogo@2x.png',
        longDescription: 'Apigee Edge longer description.',
        providerDisplayName: 'Apigee',
        documentationUrl: 'http://apigee.com/docs/',
        supportUrl: 'http://community.apigee.com/'
      },
      requires: ['route_forwarding'],
      plan_updateable: true,
      plans: [
        {
          id: 'D4D617E1-B4F9-49C7-91C8-52AB9DE8C18F',
          name: 'free',
          description: 'Free/Trial plan for Apigee Edge.',
          metadata: {
            displayName: 'Apigee Edge Free',
            bullets: ['Apigee Cloud deployment',
            '1 million API calls per quarter',
            'Community support',
            'One development developer portal']
          },
          free: true
        },
        {
          id: 'F443B68-E074-435D-87C4-5D69C6D6E901',
          name: 'startup',
          description: 'Startup Plan',
          metadata: {
            displayName: 'Apigee Edge Startup',
            bullets: ['Apigee Cloud deployment',
            '5 million API calls per quarter',
            'One support account',
            'One production developer portal'],
            costs: [
              {
                amount: {
                  'usd': 300.0
                },
                unit: 'MONTHLY'
              }
            ]
          },
          free: false
        },
        {
          id: 'EDF6AAB1-BE43-465E-B038-CDED0FB30A04',
          name: 'smb',
          description: 'Small Business Plan',
          metadata: {
            displayName: 'Apigee Edge SMB',
            bullets: ['Apigee Cloud deployment',
            '25 million API calls per quarter',
            'One support account',
            'One production developer portal'],
            costs: [
              {
                amount: {
                  'usd': 2250.0
                },
                unit: 'MONTHLY'
              }
            ]
          },
          free: false
        },
        {
          id: '3EFF38EB-0DB9-4CFB-AD74-7AA205FD3A2F',
          name: 'enterprise',
          description: 'Enterprise Plan',
          metadata: {
            displayName: 'Apigee Edge Enterprise',
            bullets: ['Apigee Cloud deployment',
            '250 million (and up) API calls per quarter',
            'Community support',
            'One developer portal'],
            costs: [{}]
          },
          free: false
        }
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
