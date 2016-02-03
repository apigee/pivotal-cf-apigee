'use strict'
/*
Authentication middleware: Usage example:
  var auth = require('../helpers/auth')(config.get('cf_broker').auth.method)
  router.use(auth)
*/

// CF sends basic auth with every request
var basicAuth = require('basic-auth')
var request = require('request')
var mgmt_api = require('./mgmt_api')

// hardcoded admin/password - testing only
var staticauth = function (req, res, next) {
  function unauthorized (res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
    return res.sendStatus(401)
  }

  var user = basicAuth(req)
  if (!user || !user.name || !user.pass) {
    return unauthorized(res)
  }
  console.log('user: ' + user.name)
  if (user.name === 'admin' && user.pass === 'password') {
    return next()
  } else {
    return unauthorized(res)
  }
}

// any user/pass as basic auth
// simply enforce basic auth header but not validate user/pass
// Not using below code anywhere
/* istanbul ignore next */
var anybasicauth = function (req, res, next) {
  function unauthorized (res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
    return res.sendStatus(401)
  }
  var user = basicAuth(req)
  if (!user || !user.name || !user.pass) {
    return unauthorized(res)
  } else {
    return next()
  }
}

// apigee user auth
// basic auth will be apigee user/pass to validate against target org
// Not using below code anywhere
/* istanbul ignore next */
var apigeeuserauth = function (req, res, next) {
  function unauthorized (res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
    return res.sendStatus(401)
  }
  var user = basicAuth(req)
  if (!user || !user.name || !user.pass) {
    return unauthorized(res)
  } else {
    // validate user and pass against target edge org
    mgmt_api.authenticate({org: 'needorg', user: user.name, pass: user.pass}, function (err, data) {
      if (err) {
        return unauthorized(res)
      } else {
        return next()
      }
    })
  }
}

// validate client_id/secret against edge (url dictates which org)
// Not using below code anywhere
/* istanbul ignore next */
var clientcredentials = function (req, res, next) {
  function unauthorized (res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
    return res.sendStatus(401)
  }

  if (!req.header('Authorization')) {
    return unauthorized(res)
  }
  var options = {
    url: 'https://amer-demo6-test.apigee.net/cf-clientcredentials',
    form: {grant_type: 'client_credentials'},
    headers: {Authorization: req.header('Authorization')}
  }
  request.post(options, function (err, httpResponse, body) {
    if (!err && httpResponse.statusCode === 200) {
      return next()
    } else {
      return unauthorized(res)
    }
  })
}
// basic auth proxy call
var basicauth = function (req, res, next) {
  function unauthorized (res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
    return res.sendStatus(401)
  }
  if (!req.header('Authorization')) {
    return unauthorized(res)
  }
  var options = {
    url: 'https://amer-demo6-test.apigee.net/cf-basicauth',
    headers: {Authorization: req.header('Authorization')}
  }
  request.post(options, function (err, httpResponse, body) {
    if (!err && httpResponse.statusCode === 200) {
      return next()
    } else {
      return unauthorized(res)
    }
  })
}

// internal call using apigee-access module (requires running in edge)
// Not using below code anywhere
/* istanbul ignore next */
var apigeeauth = function (req, res, next) {
  var apigee = require('apigee-access')
  if (apigee.getMode() === apigee.APIGEE_MODE) {
    var oauth = apigee.getOAuth()
  } else {
    throw new Error('Using internal apigee auth requires running in Apigee Edge.')
  }

  function unauthorized (res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
    return res.sendStatus(401)
  }
  if (!req.header('Authorization')) {
    return unauthorized(res)
  }
  var user = basicAuth(req)
  console.log('apikey: ' + user.name)
  if (!oauth) {
    return res.sendStatus(400)
  }
  // modify req to set correct patch

  oauth.verifyApiKey(req, {apiKey: user.name}, function (err, result) {
    if (err) {
      return res.status(500).json(err)
    } else {
      if (result.error) return unauthorized(res)
      if (result.attributes.client_secret === user.pass) {
        return next()
      } else {
        return unauthorized(res)
      }
    }
  })
}

module.exports = function (options) {
  var auths = {
    staticauth: staticauth,
    clientcredentials: clientcredentials,
    basicauth: basicauth,
    apigeeauth: apigeeauth,
    anybasicauth: anybasicauth,
    apigeeuserauth: apigeeuserauth
  }
  if (options === 'staticauth') console.log('WARNING: using static authentication.')
  return auths[options]
}
