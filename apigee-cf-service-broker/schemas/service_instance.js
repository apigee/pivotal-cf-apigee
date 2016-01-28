'use strict'
// schema sent from CF when a user selects a service plan
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
