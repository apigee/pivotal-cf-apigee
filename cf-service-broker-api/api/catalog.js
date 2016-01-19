'use strict'
/*
Implementation of catalog API for CF
http://docs.cloudfoundry.org/services/api.html

*/

var config = require('../helpers/config')
var express = require('express')
var router = express.Router()
var auth = require('../helpers/auth')(config.get('cf_broker').auth.method)

// TODO - populate services object from a data store.. CPS?
// TODO - this catalog will be different for private cloud

var services = [
  {
    id: '5E3F917B-9225-4BE4-802F-8F1491F714C0',
    name: 'apigee-edge',
    description: 'Apigee Edge API Platform',
    bindable: true,
    tags: ['api', 'api management', 'awesome'],
    metadata: {
      displayName: 'Apigee Edge API Platform',
      imageUrl: 'http://apigee.com/about/sites/all/themes/apigee_themes/apigee_bootstrap/ApigeeLogo@2x.png',
      longDescription: 'Apigee Edge longer description.',
      providerDisplayName: 'Apigee',
      documentationUrl: 'http://apigee.com/docs/',
      supportUrl: 'http://community.apigee.com/'
    },
    requires: ['route_forwarding'],
    plan_updateable: true,
    plans: [
      {
        id: 'D4D617E1-B4F9-49C7-91C8-52AB9DE8C18F',
        name: 'free',
        description: 'Free/Trial plan for Apigee Edge.',
        metadata: {
          displayName: 'Apigee Edge Free',
          bullets: ['Apigee Cloud deployment',
          '1 million API calls per quarter',
          'Community support',
          'One development developer portal']
        },
        free: true
      },
      {
        id: 'F443B68-E074-435D-87C4-5D69C6D6E901',
        name: 'startup',
        description: 'Startup Plan',
        metadata: {
          displayName: 'Apigee Edge Startup',
          bullets: ['Apigee Cloud deployment',
          '5 million API calls per quarter',
          'One support account',
          'One production developer portal'],
          costs: [
            {
              amount: {
                'usd': 300.0
              },
              unit: 'MONTHLY'
            }
          ]
        },
        free: false
      },
      {
        id: 'EDF6AAB1-BE43-465E-B038-CDED0FB30A04',
        name: 'smb',
        description: 'Small Business Plan',
        metadata: {
          displayName: 'Apigee Edge SMB',
          bullets: ['Apigee Cloud deployment',
          '25 million API calls per quarter',
          'One support account',
          'One production developer portal'],
          costs: [
            {
              amount: {
                'usd': 2250.0
              },
              unit: 'MONTHLY'
            }
          ]
        },
        free: false
      },
      {
        id: '3EFF38EB-0DB9-4CFB-AD74-7AA205FD3A2F',
        name: 'enterprise',
        description: 'Enterprise Plan',
        metadata: {
          displayName: 'Apigee Edge Enterprise',
          bullets: ['Apigee Cloud deployment',
          '250 million (and up) API calls per quarter',
          'Community support',
          'One developer portal'],
          costs: [{}]
        },
        free: false
      }
    ],
    dashboard_client: {
      id: 'apigee-dashboard-client-id',
      secret: 'secret code phrase',
      redirect_uri: 'https://enterprise.apigee.com'
    }
  }
]

// basic auth on this
router.use(auth)

router.get('/', function (req, res) {
  res.json({services: services})
})

module.exports = router
