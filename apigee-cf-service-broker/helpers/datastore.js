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

/**
 * CRUD datastore functions for provisioning and binding
 * @module
 */

var config = require('../helpers/config')
var datastoreImpl = require('./datastore_' + config.get('datastore'))



// service catalog - TODO: this should be configurable
function getServiceCatalog () {
  return [
    {
      id: '5E3F917B-9225-4BE4-802F-8F1491F714C0',
      name: 'apigee-edge',
      description: 'Apigee Edge API Platform',
      bindable: true,
      tags: ['api', 'api management', 'api platform'],
      metadata: {
        displayName: 'Apigee Edge API Platform',
        imageUrl: 'http://apigee.com/about/sites/all/themes/apigee_themes/apigee_bootstrap/ApigeeLogo@2x.png',
        longDescription: 'Apigee Edge enables digital business acceleration with a unified and complete platform, purpose-built for the digital economy. Edge simplifies managing the entire digital value chain with API Services, Developer Services, and Analytics Services.',
        providerDisplayName: 'Apigee',
        documentationUrl: 'http://apigee.com/docs/',
        supportUrl: 'http://community.apigee.com/'
      },
      requires: ['route_forwarding'],
      plan_updateable: true,
      plans: [
        {
          id: 'A98CCB00-549B-458F-A627-D54C5E860519',
          name: 'org',
          description: 'Apigee Edge for Route Services',
          metadata: {
            displayName: 'Apigee Edge for Route Services',
          },
          free: true
        }
        // ,{
        //   id: 'D4D617E1-B4F9-49C7-91C8-52AB9DE8C18F',
        //   name: 'free',
        //   description: 'Free/Trial plan for Apigee Edge.',
        //   metadata: {
        //     displayName: 'Apigee Edge Free',
        //     bullets: ['Apigee Cloud deployment',
        //     '1 million API calls per quarter',
        //     'Community support',
        //     'One development developer portal']
        //   },
        //   free: true
        // },
        // {
        //   id: 'F443B68-E074-435D-87C4-5D69C6D6E901',
        //   name: 'startup',
        //   description: 'Startup Plan',
        //   metadata: {
        //     displayName: 'Apigee Edge Startup',
        //     bullets: ['Apigee Cloud deployment',
        //     '5 million API calls per quarter',
        //     'One support account',
        //     'One production developer portal'],
        //     costs: [
        //       {
        //         amount: {
        //           'usd': 300.0
        //         },
        //         unit: 'MONTHLY'
        //       }
        //     ]
        //   },
        //   free: false
        // },
        // {
        //   id: 'EDF6AAB1-BE43-465E-B038-CDED0FB30A04',
        //   name: 'smb',
        //   description: 'Small Business Plan',
        //   metadata: {
        //     displayName: 'Apigee Edge SMB',
        //     bullets: ['Apigee Cloud deployment',
        //     '25 million API calls per quarter',
        //     'One support account',
        //     'One production developer portal'],
        //     costs: [
        //       {
        //         amount: {
        //           'usd': 2250.0
        //         },
        //         unit: 'MONTHLY'
        //       }
        //     ]
        //   },
        //   free: false
        // },
        // {
        //   id: '3EFF38EB-0DB9-4CFB-AD74-7AA205FD3A2F',
        //   name: 'enterprise',
        //   description: 'Enterprise Plan',
        //   metadata: {
        //     displayName: 'Apigee Edge Enterprise',
        //     bullets: ['Apigee Cloud deployment',
        //     '250 million (and up) API calls per quarter',
        //     'Community support',
        //     'One developer portal'],
        //     costs: [{}]
        //   },
        //   free: false
        // }
      ],
      dashboard_client: {
        id: 'apigee-dashboard-client-id',
        secret: 'secret code phrase',
        redirect_uri: 'https://enterprise.apigee.com'
      }
    }
  ]
}

module.exports = Object.assign({
    getServiceCatalog: getServiceCatalog
}, datastoreImpl)
