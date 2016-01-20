'use strict'
/*
Implementation of catalog API for CF
http://docs.cloudfoundry.org/services/api.html

*/

var config = require('../helpers/config')
var express = require('express')
var router = express.Router()
var auth = require('../helpers/auth')(config.get('cf_broker').auth.method)
var getServiceCatalog = require('../helpers/datastore')[config.get('cf_broker').datastore].getServiceCatalog

// TODO - populate services object from a data store.. CPS?
// TODO - this catalog will be different for private cloud

var services = getServiceCatalog()

// basic auth on this
router.use(auth)

router.get('/', function (req, res) {
  res.json({services: services})
})

module.exports = router
