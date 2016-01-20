'use strict'
/*
 Dump out version info, hosting location, etc.
*/

var config = require('../helpers/config')
var express = require('express')
var router = express.Router()

var auth = require('../helpers/auth')(config.get('cf_broker').auth.method)

router.use(auth)
router.get('/', function (req, res) {
  // var conf = config.get()
  // conf.apigee_edge.password = '********' TODO: mask the password. Can't do it this way.
  res.json({ message: 'This is the cf-apigee-broker CF Service Broker API.', configuration: 'blocked' })
})

module.exports = router
