'use strict'
/*
 CRUD datastore functions for provisioning and binding
*/
var config = require('./config')
var usergrid = require('usergrid')
var mgmt_api = require('./mgmt_api')

// this is susceptible to 'require' caching issue if config is dynamically changed
var client = new usergrid.client(
  {
    orgName: config.get('usergrid').orgId, // required
    appName: config.get('usergrid').appId, // required
    URI: config.get('usergrid').baseUrl,
    logging: true,
    buildCurl: true
  }
)

// BaaS storage functions
function saveServiceInstanceBaaS (instance, callback) {
  var options = {
    type: 'cf-service',
    name: instance.instance_id
  }
  client.createEntity(options, function (err, service) {
    if (err) {
      callback('error', err)
    } else {
      service.set(instance)
      service.save(function (err) {
        if (err) {
          callback('error', err)
        } else {
          callback(null, instance)
        }
      })
    }
  })
}

function getServiceInstanceBaaS (instance_id, cb) {
  var options = {
    type: 'cf-service',
    qs: { ql: "select * where name='" + instance_id + "'" }
  }
  client.createCollection(options, function (err, instances) {
    if (err) {
      cb(err, null)
    } else {
      var serviceInstance = instances.getFirstEntity()
      cb(null, serviceInstance.get())
    }
  })
  // provisioning.get(route.instance_id, function (err, data) {
  //   if (err) {
  //     // error retrieving details of service instance
  //     cb(err, data)
  //   } else {
  //     // data should be ug record for service instance
  //     // get org and environment and continue
  //     var org = data.get('apigee_org')
  //     var env = data.get('apigee_env')
  //     cb(null, {org: org, env: env})
  //   }
  // })
}

function deleteBindingBaaS (route, cb) {
  var options = {
    type: 'cf-binding',
    qs: { ql: "select * where name='" + route.binding_id + "'" }
  }
  client.createCollection(options, function (err, bindings) {
    if (err) {
      cb('error', err)
    } else {
      var binding = bindings.getFirstEntity()
      binding.destroy(function (err) {
        if (err) {
          cb('error', err)
        } else {
          cb(null, {})
        }
      })
    }
  })
}

function saveBindingBaaS (route, cb) {
  var options = {
    type: 'cf-binding',
    name: route.binding_id
  }
  client.createEntity(options, function (err, service) {
    if (err) {
      cb('error', err)
    } else {
      service.set(route)
      service.save(function (err) {
        if (err) {
          cb('error', err)
        } else {
          cb(null, route)
        }
      })
    }
  })
}

function updateBindingBaaS (route, cb) {
  // noop
  cb(null)
}

function getBindingBaaS (route, cb) {
  var options = {
    type: 'cf-binding',
    qs: { ql: "select * where name='" + route.binding_id + "'" }
  }
  client.createCollection(options, function (err, bindings) {
    if (err) {
      cb('error', err)
    } else {
      var bindingInstance = bindings.getFirstEntity()
      cb(null, bindingInstance.get())
    }
  })
}

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

function deleteServiceInstanceKVM () {
  var options = {
    key: 'thing'
  }
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
      console.err('error deleting kvm', err)
      callback(err, null)
    } else {
      callback(null, data)
    }
  })
}

module.exports = {
  baas: {
    saveServiceInstance: saveServiceInstanceBaaS,
    getServiceInstance: getServiceInstanceBaaS,
    // updateServiceInstance: updateServiceInstanceBaaS,
    // deleteServiceInstance: deleteServiceInstanceBaaS,
    saveBinding: saveBindingBaaS,
    getBinding: getBindingBaaS,
    updateBinding: updateBindingBaaS,
    deleteBinding: deleteBindingBaaS
  },
  kvm: {
    saveServiceInstance: putServiceInstanceKVM,
    getServiceInstance: getServiceInstanceKVM,
    updateServiceInstance: putServiceInstanceKVM,
    deleteServiceInstance: deleteServiceInstanceKVM,
    saveBinding: putBindingKVM,
    getBinding: getBindingKVM,
    updateBinding: putBindingKVM,
    deleteBinding: deleteBindingKVM
  }
}
