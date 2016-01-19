'use strict'

// TODO: refactor

var JSZip = require('jszip')
var fs = require('fs')
// var request = require('request')
var importProxy = require('./mgmt_api').importProxy
var getVirtualHosts = require('./mgmt_api').getVirtualHosts

// proxyData is {org: org, env: env, proxyname: name, basepath: path}
// should just get route details here, so we have access to parameters (add features)
function uploadProxy (proxyData, callback) {
  getZip(proxyData, function (err, data) {
    if (err) {
      console.log('getZip error: ' + err)
      callback(err)
    } else {
      importProxy(proxyData, data, function (err, result) {
        if (err) {
          callback(err, result)
        } else {
          callback(null, result)
        }
      })
    }
  })
}

// TODO: this only works in edge (due to readFile path below.. fix this)
// TODO: this assumes default and secure virtual hosts. If they are not so, proxy will not deploy.
// TODO: cf route services requires TLS. This needs to be documented somewhere for users.
// TODO: jsZIP doesn't work in certain opdk environment. confirm version. Uint8Array issue. Possible to monkeypatch jsZIP
function getZip (proxyData, callback) {
  console.log('dir: ' + __dirname)
  // from file - TODO: this path should be able to be ../proxy-resources/apiproxy.zip
  fs.readFile('/organization/environment/api/proxy-resources/apiproxy.zip', function (err, data) {
    if (err) {
      console.log('readFile error: ' + err)
      callback(err, null)
    } else {
      var zip = new JSZip(data)
      var re1 = /%BASEPATH%/g
      var re2 = /%PROXYNAME%/g
      var re3 = /%VIRTUALHOSTS%/g
      // get virtual hosts for org/env
      getVirtualHosts(proxyData, function (err, data) {
        if (err) {
          callback(err, data)
        } else {
          var vHostString = JSON.parse(data).map(function (val) { return '<VirtualHost>' + val + '</VirtualHost>' }).join('\n')
          var proxyDefTemplate = zip.folder('apiproxy/proxies').file('default.xml')
          var proxyDefValue = proxyDefTemplate.asText().replace(re1, proxyData.basepath)
          proxyDefValue = proxyDefValue.replace(re3, vHostString)
          zip.folder('apiproxy/proxies').file('default.xml', proxyDefValue)
          var proxyNameTemplate = zip.file('apiproxy/cf-proxy.xml').asText()
          zip.file('apiproxy/cf-proxy.xml', proxyNameTemplate.replace(re2, proxyData.proxyname))
          callback(null, zip.generate({type: 'nodebuffer'}))
        }
      })
    }
  })
}

module.exports = {
  upload: uploadProxy
}
