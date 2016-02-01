'use strict'
/*
Edge management API calls
*/
var request = require('request')

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
  console.log('get proxy details: ' + options.url)
  request.get(options, function (err, res, body) {
    if (err) {
      // console.log(err)
      callback('retrieving proxy revision failed: ' + err)
    } else if (res.statusCode !== 200) {
      // console.log('getProxyRevision statusCode: ' + res.statusCode)
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
  // console.log(require('util').inspect(options, { depth: null }))
  request.post(options, function (err, httpResponse, body) {
    if (err) {
      console.log('Mgmt API error: ' + err)
      callback('API error. Upload failed.', err)
    } else if (httpResponse.statusCode !== 201) {
      console.log('API response ' + JSON.stringify({statusCode: httpResponse.statusCode, statusMessage: httpResponse.statusMessage, body: httpResponse.body}))
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
  var adminUser = config.get('apigee_edge').username
  var adminPass = config.get('apigee_edge').password
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
  console.log('get virtual hosts url: ' + options.url)
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
      console.error('deleting kvm key failed.', err)
      callback(err)
    } else if (res.statusCode !== 200) {
      console.error('deleting kvm key failed.', res.statusCode + ': ' + res.statusMessage)
      callback('deleting KVM key failed: ' + res.statusCode + ' - ' + res.statusMessage)
    } else {
      callback(null, body)
    }
  })
}

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
  console.log('set kvm options: ' + JSON.stringify(options))
  request.post(options, function (err, res, body) {
    if (err) {
      console.error('setting KVM key failed.', err)
      callback('setting KVM key failed: ' + err.toString())
    } else if (res.statusCode === 404) {
      // create KVM, try once more.
      console.log('KVM not found')
    } else if (res.statusCode !== 200 && res.statusCode !== 201) {
      console.error('setting KVM key returned non-200.', res.statusCode + ': ' + res.statusMessage)
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
      console.error('mgmt_api.authenticate error', err)
      callback(err)
    } else if (res.statusCode !== 200) {
      console.error('mgmt_api.authenticate non-200', res.body)
      callback('mgmt_api.authenticate returned non-200. ' + res.statusCode + ': ' + res.statusMessage)
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
