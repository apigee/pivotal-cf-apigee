'use strict'
/**
 * Copyright (C) 2016 Apigee Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
Implementation of catalog API for CF
http://docs.cloudfoundry.org/services/api.html
*/

var config = require('../helpers/config')
var express = require('express')
var router = express.Router()
// we only validate that user/pass was supplied
var auth = require('../helpers/auth')('staticauth')
var getServiceCatalog = require('../helpers/datastore')['redis'].getServiceCatalog

// TODO - populate services object from a data store.. CPS?
// TODO - this catalog will be different for private cloud

var services = getServiceCatalog()

// basic auth on this
router.use(auth)

router.get('/', function (req, res) {
  res.json({services: services})
})

module.exports = router
