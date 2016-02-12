'use strict'
// TODO: refactor
// TODO: provide options for persistence? KVM?

var config = require('../helpers/config')
var service_instance = require('./service_instance')
var async = require('async')
var proxy = require('./edge_proxy')
var template = require('es6-template-strings')
var mgmt_api = require('./mgmt_api')
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var saveBinding = require('./datastore')['redis'].saveBinding
var deleteBinding = require('./datastore')['redis'].deleteBinding
var getBinding = require('./datastore')['redis'].getBinding

function create (route, callback) {
  async.waterfall([ function (cb) {
    // retrieve service instance details
    getServiceInstanceOrg(route, function (err, data) {
      if (err) {
        cb(new Error('Failed to retrieve service instance details.'))
        return
      } else {
        // data is {org: 'orgname', env: 'envname'}
        data.route = route
        log.info({data: data}, 'service binding get org')
        cb(null, data)
      }
    }) },
    // create proxy
    function (data, cb) {
      createProxy(data, function (err, result) {
        if (err) {
          log.error({err: err}, 'create proxy error')
          cb(new Error('Failed creating proxy in org.'))
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
          cb(new Error('Failed saving binding details.'))
          return
        } else {
          log.info({result: result}, 'Service Binding Save Binding')
          cb(null, result)
        }
      })
    }],
    function (err, result) {
      if (err) {
        callback(new Error('Route Binding Failure: ' + err.message), null)
      } else {
        // need to call back with URL details for forwarding
        callback(null, result)
      }
    })
}

// create proxy in edge org
function createProxy (data, cb) {
  var org = data.org
  var env = data.env
  var route = data.route
  // TODO: this is brittle. Refactor. Goal is to support some configurability, but the code needs to match the template, or the avaliable variables need to be documented
  var routeName = route.bind_resource.route
  var proxyNameTemplate = config.get('APIGEE_PROXY_NAME_PATTERN')
  proxyNameTemplate = proxyNameTemplate.replace(/#/g, '$')
  var proxyHostTemplate = config.get('APIGEE_PROXY_HOST_PATTERN')
  proxyHostTemplate = proxyHostTemplate.replace(/#/g, '$')
  var proxyName = template(proxyNameTemplate, { routeName: routeName })
  proxy.upload({user: data.user, pass: data.pass, org: org, env: env, proxyname: proxyName, basepath: '/' + route.binding_id}, function (err, data) {
    if (err) {
      cb('proxy failure.', err)
    } else {
      var proxyHost = config.get('APIGEE_PROXY_HOST')
      var proxyUrlRoot = template(proxyHostTemplate, { apigeeOrganization: org, apigeeEnvironment: env, proxyHost: proxyHost })
      route.proxyURL = 'https://' + proxyUrlRoot + '/' + route.binding_id
      route.proxyname = proxyName
      log.info('route proxy url: ', route.proxyURL)
      cb(null, route)
    }
  })
}

// retrieve org/environment
function getServiceInstanceOrg (route, cb) {
  service_instance.get(route.instance_id, function (err, data) {
    if (err) {
      // error retrieving details of service instance
      log.error({err: err}, 'Service Binding Get Service Instance ORg')
      cb(err, data)
    } else {
      // get org and environment and continue
      log.info({data: data}, 'Service Binding get service instance org')
      cb(null, {org: data.apigee_org, env: data.apigee_env, user: data.apigee_user, pass: data.apigee_pass})
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
    getServiceInstanceOrg(route, function (err, data) {
      if (err) {
        cb(new Error('Failed to retrieve service instance details.'))
      } else {
        // data is {org: 'orgname', env: 'envname'}
        data.route = route
        log.info({data: data}, 'service bidning get org')
        cb(null, data)
      }
    }) },
  function (data, cb) {
    getBinding(data.route.binding_id, function (err, binding) {
      if (err) {
        cb(new Error('Failed to retrieve binding details.'))
      } else {
        data.proxyname = binding.proxyname
        log.info({data: data}, 'delete binding getBinding')
        cb(null, {org: data.org, env: data.env, proxyname: binding.proxyname, route: data.route, user: data.user, pass: data.pass})
      }
    })
  },
  function (data, cb) {
    mgmt_api.undeployProxy(data, function (err, result) {
      if (err) {
        cb(err, null)
      } else {
        cb(null, data)
      }
    })
  }, function (data, cb) {
    // delete data
    deleteBinding(data.route, function (err, result) {
      if (err) {
        cb(err)
      } else {
        cb(null, {})
      }
    })
  }], function (err, result) {
    if (err) {
      callback(new Error('Route Un-binding Failure: ' + err.message), null)
    } else {
      // need to call back with URL details for forwarding
      callback(null, result)
    }
  })
}

module.exports = {
  create: create,
  delete: deleteServiceBinding
}
