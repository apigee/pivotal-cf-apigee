'use strict'
/*
 Dump out version info, hosting location, etc.
*/

var config = require('../helpers/config')
var express = require('express')
var router = express.Router()

var auth = require('../helpers/auth')(config.get('APIGEE_AUTH_METHOD'))

router.use(auth)
router.get('/', function (req, res) {
  res.json({ message: 'This is the cf-apigee-broker CF Service Broker API.', configuration: 'blocked' })
})

module.exports = router
