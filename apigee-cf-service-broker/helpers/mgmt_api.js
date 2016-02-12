'use strict'
/*
Edge management API calls
*/
var request = require('request')
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var logger = require('./logger')

function getProxyRevision (proxyData, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var adminUser = proxyData.user
  var adminPass = proxyData.pass
  var options = {
    url: mgmtUrl + '/organizations/' + proxyData.org + '/apis/' + proxyData.proxyname,
    auth: {
      user: adminUser,
      pass: adminPass
    }
  }
  log.debug('get proxy details: ', options.url)
  request.get(options, function (err, res, body) {
    if (err) {
      callback('retrieving proxy revision failed: ' + err)
    } else if (res.statusCode !== 200) {
      callback('proxy does not exist: ' + err)
    } else {
      body = JSON.parse(body)
      var revision = body.revision.slice(-1).pop()
      callback(null, revision)
    }
  })
}

function importProxy (proxyData, data, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var adminUser = proxyData.user
  var adminPass = proxyData.pass
  var formData = {
    // Pass data via Buffers
    file: data
  }
  var options = {
    url: mgmtUrl + '/organizations/' + proxyData.org + '/apis', // TODO: unbrittle this
    formData: formData,
    auth: {
      user: adminUser,
      pass: adminPass
    },
    qs: {action: 'import',
        name: proxyData.proxyname}
  }
  request.post(options, function (err, httpResponse, body) {
    if (err) {
      log.error({err: err}, 'Management API Error')
      callback('API error. Upload failed.', err)
    } else if (httpResponse.statusCode !== 201) {
      log.debug({response: {statusCode: httpResponse.statusCode, statusMessage: httpResponse.statusMessage, body: httpResponse.body}}, 'API Response')
      callback('Proxy upload failed.', {statusCode: httpResponse.statusCode, statusMessage: httpResponse.statusMessage, body: httpResponse.body})
    } else {
      // deploy proxy
      deployProxy(proxyData, function (err, result) {
        if (err) {
          callback('proxy deployment failed.', result)
        } else {
          callback(null, result)
        }
      })
    }
  })
}

function deployProxy (proxyData, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var adminUser = proxyData.user
  var adminPass = proxyData.pass
  // should get latest version and deploy that
  getProxyRevision(proxyData, function (err, revision) {
    if (err) {
      callback('getting revision info failed.', err)
    } else {
      var options = {
        url: mgmtUrl + '/organizations/' + proxyData.org + '/environments/' + proxyData.env + '/apis/' + proxyData.proxyname + '/revisions/' + revision + '/deployments', // TODO: unbrittle this
        auth: {
          user: adminUser,
          pass: adminPass
        }
      }
      request.post(options, function (err, res, body) {
        if (err) {
          callback('proxy deployment failed.', err)
        } else {
          callback(null, res)
        }
      })
    }
  })
}

function undeployProxy (proxyData, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var adminUser = proxyData.user
  var adminPass = proxyData.pass
  // should get latest version and undeploy that
  getProxyRevision(proxyData, function (err, revision) {
    if (err) {
      callback('getting revision info failed.', err)
    } else {
      var options = {
        url: mgmtUrl + '/organizations/' + proxyData.org + '/environments/' + proxyData.env + '/apis/' + proxyData.proxyname + '/revisions/' + revision + '/deployments',
        auth: {
          user: adminUser,
          pass: adminPass
        }
      }
      request.del(options, function (err, res, body) {
        if (err) {
          callback('proxy un-deployment failed.', err)
        } else {
          callback(null, res)
        }
      })
    }
  })
}

function getVirtualHosts (proxyData, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var adminUser = proxyData.user
  var adminPass = proxyData.pass
  var options = {
    url: mgmtUrl + '/organizations/' + proxyData.org + '/environments/' + proxyData.env + '/virtualhosts',
    auth: {
      user: adminUser,
      pass: adminPass
    }
  }
  log.debug('get virtual hosts url: ', options.url)
  request.get(options, function (err, res, body) {
    if (err) {
      callback('retrieving vhosts failed: ' + err)
    } else if (res.statusCode !== 200) {
      callback('retrieving vhosts failed. HTTP ' + res.statusCode + ': ' + res.statusMessage)
    } else {
      callback(null, body)
    }
  })
}

/* istanbul ignore next */
function getKVM (keyOptions, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var adminUser = config.get('apigee_edge').username
  var adminPass = config.get('apigee_edge').password
  var kvmName = config.get('apigee_edge').key_value_map
  var org = config.get('apigee_edge').org
  var options = {
    url: mgmtUrl + '/organizations/' + org + '/keyvaluemaps/' + kvmName + '/entries/' + keyOptions.key,
    auth: {
      user: adminUser,
      pass: adminPass
    }
  }
  request.get(options, function (err, res, body) {
    if (err) {
      callback('retrieving KVM key failed.', err)
    } else if (res.statusCode !== 200) {
      callback('retrieving KVM key failed.', res.statusCode + ': ' + res.statusMessage)
    } else {
      callback(null, JSON.parse(body))
    }
  })
}

/* istanbul ignore next */
function deleteKVM (keyOptions, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var adminUser = config.get('apigee_edge').username
  var adminPass = config.get('apigee_edge').password
  var kvmName = config.get('apigee_edge').key_value_map
  var org = config.get('apigee_edge').org
  var options = {
    url: mgmtUrl + '/organizations/' + org + '/keyvaluemaps/' + kvmName + '/entries/' + keyOptions.key,
    auth: {
      user: adminUser,
      pass: adminPass
    }
  }
  request.del(options, function (err, res, body) {
    if (err) {
      log.error({err: err}, 'deleting kvm key failed')
      callback(err)
    } else if (res.statusCode !== 200) {
      log.error({err: res.statusMessage}, 'deleting kvm key failed')
      callback('deleting KVM key failed: ' + res.statusCode + ' - ' + res.statusMessage)
    } else {
      callback(null, body)
    }
  })
}

/* istanbul ignore next */
function setKVM (keyOptions, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var adminUser = config.get('apigee_edge').username
  var adminPass = config.get('apigee_edge').password
  var kvmName = config.get('apigee_edge').key_value_map
  var org = config.get('apigee_edge').org
  var options = {
    url: mgmtUrl + '/organizations/' + org + '/keyvaluemaps/' + kvmName,
    auth: {
      user: adminUser,
      pass: adminPass
    },
    body: {'name': kvmName, 'entry': [{'name': keyOptions.key, 'value': JSON.stringify(keyOptions.value)}]},
    json: true
  }
  request.post(options, function (err, res, body) {
    if (err) {
      log.error({err: err}, 'setting KVM key failed')
      callback('setting KVM key failed: ' + err.toString())
    } else if (res.statusCode === 404) {
      // create KVM, try once more.
      log.error('KVM not found')
    } else if (res.statusCode !== 200 && res.statusCode !== 201) {
      log.error('setting KVM key returned non-200.', res.statusCode + ': ' + res.statusMessage)
      callback('setting KVM key returned non-200. HTTP ' + res.statusCode + ': ' + res.statusMessage)
    } else {
      callback(null, body)
    }
  })
}

function authenticate (authOptions, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('apigee_edge').mgmt_api_url
  var options = {
    url: mgmtUrl + '/organizations/' + authOptions.org,
    auth: {
      user: authOptions.user,
      pass: authOptions.pass
    }
  }
  request.get(options, function (err, res, body) {
    if (err) {
      var loggerError = logger.handle_error('ERR_APIGEE_REQ_FAILED', err)
      callback(true, loggerError)
    } else if (res.statusCode !== 200) {
      var loggerError = logger.handle_error('ERR_APIGEE_AUTH', err)
      callback(true, loggerError)
    } else {
      callback(null, body)
    }
  })
}

module.exports = {
  importProxy: importProxy,
  getVirtualHosts: getVirtualHosts,
  deployProxy: deployProxy,
  undeployProxy: undeployProxy,
  setKVM: setKVM,
  getKVM: getKVM,
  deleteKVM: deleteKVM,
  authenticate: authenticate
}
