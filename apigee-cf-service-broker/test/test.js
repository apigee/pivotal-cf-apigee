'use strict'
// TODO: write tests!
var chai = require('chai')
chai.use(require('chai-things'))
var expect = chai.expect
var should = require('should')
var supertest = require('supertest')

// TODO: determine way to launch server.js for testing.
var port = process.env.PORT || 8888
var api = supertest('http://localhost:' + port)

describe('Catalog', function () {
  it('should require basic auth', function (done) {
    api.get('/v2/catalog')
    .set('Accept', 'application/json')
    .expect(401, done)
  })
  it('should return a 200 response', function (done) {
    api.get('/v2/catalog')
    .set('Accept', 'application/json')
    .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
    .expect(200, done)
  })
  it('should be an array of objects', function (done) {
    api.get('/v2/catalog')
    .set('Accept', 'application/json')
    .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
    .expect(200)
    .end(function (err, res) {
      expect(err).equal(null)
      expect(res.body).to.have.property('services')
      res.body.services.forEach(function (service) {
        service.should.have.property('name')
        service.should.have.property('id')
        service.should.have.property('description')
        service.should.have.property('bindable')
        service.should.have.property('plans')
        service.plans.forEach(function (plan) {
          plan.should.have.property('id')
          plan.should.have.property('name')
          plan.should.have.property('description')
        })
      })
      done()
    })
  })
})
describe('Create Service', function () {
  it('should require basic auth', function (done) {
    api.put('/v2/service_instances/:instance_id')
    .set('Accept', 'application/json')
    .expect(401, done)
  })
  it('should return a 401 response', function (done) {
    var serviceInstance = {
      instance_id: 'instance-guid-here',
      payload: {
        organization_guid: 'org-guid-here',
        plan_id: 'plan-guid-here',
        service_id: 'service-guid-here',
        space_guid: 'space-guid-here',
        parameters: {
          org: 'org-name-here',
          env: 'env-name-here',
          user: 'apigee-user-here',
          pass: 'apigee-pass-here'
        }
      }
    }
    api.put('/v2/service_instances/' + serviceInstance.instance_id)
    .send(serviceInstance.payload)
    .set('Accept', 'application/json')
    .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
    .expect(401, done)
  })
  // TODO: figure out this without revealing any real credentials
  it('should return a 201 response', function (done) {
    var serviceInstance = {
      instance_id: 'instance-guid-here',
      payload: {
        organization_guid: 'org-guid-here',
        plan_id: 'plan-guid-here',
        service_id: 'service-guid-here',
        space_guid: 'space-guid-here',
        parameters: {
          org: 'cdmo',
          env: 'test',
          user: 'carlos@apigee.com',
          pass: '***REMOVED***'
        }
      }
    }
    api.put('/v2/service_instances/' + serviceInstance.instance_id)
    .send(serviceInstance.payload)
    .set('Accept', 'application/json')
    .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
    .expect(201, done)
  })
})
// create binding
// sample request to PUT /cf-apigee-broker/v2/service_instances/5a76d1c5-4bc3-455a-98b1-e3c079dc5cb2/service_bindings/7ed4c3d3-c3a4-41b6-9acc-72b3a7fa2f39
// payload {"service_id":"5E3F917B-9225-4BE4-802F-8F1491F714C0","plan_id":"D4D617E1-B4F9-49C7-91C8-52AB9DE8C18F","bind_resource":{"route":"rot13.apigee-cloudfoundry.com"}}
// response should be route_service_url	string	A URL to which Cloud Foundry should proxy requests for the bound route.
// router.put('/:instance_id/service_bindings/:binding_id', function (req, res) {
describe('Create Binding', function () {
  it('should require basic auth', function (done) {
    api.put('/v2/service_instances/:instance_id/service_bindings/:binding_id')
    .set('Accept', 'application/json')
    .expect(401, done)
  })
  it('should return a 201 response', function (done) {
    this.timeout(10000)
    var bindingInstance = {
      instance_id: 'instance-guid-here',
      binding_id: 'binding-guid-here',
      payload: {
        plan_id: 'plan-guid-here',
        service_id: 'service-guid-here',
        bind_resource: {
          route: 'route-url-here'
        }
      }
    }
    api.put('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
    .send(bindingInstance.payload)
    .set('Accept', 'application/json')
    .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
    .expect(201, done)
  })
})
describe('Delete Binding', function () {
  it('should require basic auth', function (done) {
    api.put('/v2/service_instances/:instance_id/service_bindings/:binding_id')
    .set('Accept', 'application/json')
    .expect(401, done)
  })
  it('should delete the instance and return 200', function (done) {
    var bindingInstance = {
      instance_id: 'instance-guid-here',
      binding_id: 'binding-guid-here'
    }
    api.del('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
    .set('Accept', 'application/json')
    .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
    .expect(200, done)
  })
  // TODO: figure out how to validate data deletion
})
describe('Delete Service', function () {
  it('should require basic auth', function (done) {
    api.del('/v2/service_instances/:instance_id')
    .set('Accept', 'application/json')
    .expect(401, done)
  })
  // TODO: should we worry about this?
  // it('should return a 410 response', function (done) {
  //   var serviceInstance = 'Non-Exist'
  //   api.del('/v2/service_instances/' + serviceInstance.instance_id)
  //   .set('Accept', 'application/json')
  //   .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
  //   .expect(410, done)
  // })
  it('should delete the instance and return 200', function (done) {
    var serviceInstance = 'instance_guid_here'
    api.del('/v2/service_instances/' + serviceInstance)
    .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
    .expect(200, done)
  })
  // TODO: figure out how to validate data deletion
})
