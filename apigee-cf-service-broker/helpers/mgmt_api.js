'use strict'
/*
Edge management API calls
*/
var request = require('request')
var log = require('bunyan').createLogger({name: 'apigee', src: true})
var logger = require('./logger')

function getProxyRevision (proxyData, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
  var adminUser = proxyData.user
  var adminPass = proxyData.pass
  var options = {
    url: mgmtUrl + '/organizations/' + proxyData.org + '/apis/' + proxyData.proxyname,
    auth: {
      user: adminUser,
      pass: adminPass
    }
  }
  request.get(options, function (err, res, body) {
    if (err) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_REQ_FAILED, err)
      callback(true, loggerError)
    }
    else if (res.statusCode == 401) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_AUTH, err)
      callback(true, loggerError)
    }
    else if (res.statusCode == 404) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_PROXY_NOT_FOUND, err)
      callback(404, loggerError)
    }
    else if (res.statusCode !== 200) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_GET_PROXY_REV_FAILED, err)
      callback(true, loggerError)
    } else {
      body = JSON.parse(body)
      var revision = body.revision.slice(-1).pop()
      callback(null, revision)
    }
  })
}

function importProxy (proxyData, data, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
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
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_REQ_FAILED, err)
      callback(true, loggerError)
    } else if (httpResponse.statusCode !== 201) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_PROXY_UPLOAD, err)
      callback(true, loggerError)
    } else {
      // deploy proxy
      deployProxy(proxyData, function (err, result) {
        if (err) {
          callback(true, result)
        } else {
          callback(null, result)
        }
      })
    }
  })
}

function deployProxy (proxyData, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
  var adminUser = proxyData.user
  var adminPass = proxyData.pass
  // should get latest version and deploy that
  getProxyRevision(proxyData, function (err, result) {
    if (err) {
      callback(true, result)
    } else {
      var options = {
        url: mgmtUrl + '/organizations/' + proxyData.org + '/environments/' + proxyData.env + '/apis/' + proxyData.proxyname + '/revisions/' + result + '/deployments', // TODO: unbrittle this
        auth: {
          user: adminUser,
          pass: adminPass
        }
      }
      request.post(options, function (err, res, body) {
        if (err) {
          var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_DEPLOY_PROXY, err)
          callback(true, loggerError)
        } else {
          callback(null, res)
        }
      })
    }
  })
}

function undeployProxy (proxyData, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
  var adminUser = proxyData.user
  var adminPass = proxyData.pass
  // should get latest version and undeploy that
  getProxyRevision(proxyData, function (err, revision) {
    if (err == 404) {
      // Proxy not found, It's manually deleted
      callback(404, err)
    }
    else if (err) {
      callback(true, err)
    }
    else {
      var options = {
        url: mgmtUrl + '/organizations/' + proxyData.org + '/environments/' + proxyData.env + '/apis/' + proxyData.proxyname + '/revisions/' + revision + '/deployments',
        auth: {
          user: adminUser,
          pass: adminPass
        }
      }
      request.del(options, function (err, res, body) {
        if (err) {
          var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_UNDEPLOY_PROXY_FAILED, err)
          callback(true, loggerError)
        } else {
          callback(null, res)
        }
      })
    }
  })
}

function getVirtualHosts (proxyData, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
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
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_REQ_FAILED, err)
      callback(true, loggerError)
    } else if (res.statusCode !== 200) {
      var loggerError = logger.handle_error(logger.codes.ERR_PROXY_VHOSTS_NON200_RES, err)
      callback(true, loggerError)
    } else {
      callback(null, body)
    }
  })
}

/* istanbul ignore next */
function getKVM (keyOptions, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
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
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_REQ_FAILED, err)
      callback(true, loggerError)
    } else if (res.statusCode !== 200) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_GET_KVM, res)
      callback(true, loggerError)
    } else {
      callback(null, JSON.parse(body))
    }
  })
}

/* istanbul ignore next */
function deleteKVM (keyOptions, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
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
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_REQ_FAILED, err)
      callback(true, loggerError)
    } else if (res.statusCode !== 200) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_DELETE_KVM, res)
      callback(true, loggerError)
    } else {
      callback(null, body)
    }
  })
}

/* istanbul ignore next */
function setKVM (keyOptions, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
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
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_REQ_FAILED, err)
      callback(true, loggerError)
    } else if (res.statusCode === 404) {
      // create KVM, try once more.
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_KVM_NOT_FOUND, res)
    } else if (res.statusCode !== 200 && res.statusCode !== 201) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_KVM_SET_ERROR, res)
      callback(true, loggerError)
    } else {
      callback(null, body)
    }
  })
}

function authenticate (authOptions, callback) {
  var config = require('../helpers/config')
  var mgmtUrl = config.get('APIGEE_MGMT_API_URL')
  var options = {
    url: mgmtUrl + '/organizations/' + authOptions.org,
    auth: {
      user: authOptions.user,
      pass: authOptions.pass
    }
  }
  request.get(options, function (err, res, body) {
    if (err) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_REQ_FAILED, err)
      callback(true, loggerError)
    } else if (res.statusCode !== 200) {
      var loggerError = logger.handle_error(logger.codes.ERR_APIGEE_AUTH, err)
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
