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
 * Schema sent from CF when a user selects a service plan
 * @module
 */

var createServiceInstance = {
  type: 'object',
  properties: {
    organization_guid: {
      type: 'string',
      required: true
    },
    plan_id: {
      type: 'string',
      required: true
    },
    service_id: {
      type: 'string',
      required: true
    },
    space_guid: {
      type: 'string',
      required: true
    },
    parameters: {
      type: 'object',
      required: true,
      properties: {
        org: {type: 'string', required: true},
        env: {type: 'string', required: true}
      }
    },
    accepts_incomplete: {
      type: 'boolean',
      required: false
    }
  }
}

// schema sent from CF when a user wants to upgrade service plan
var updateServiceInstance = {
  type: 'object',
  properties: {
  }
}

module.exports = {
  create: createServiceInstance,
  update: updateServiceInstance
}
