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
  // it('should return a 201 response', function (done) {
  //   var serviceInstance = {
  //     instance_id: 'instance-guid-here',
  //     payload: {
  //       organization_guid: 'org-guid-here',
  //       plan_id: 'plan-guid-here',
  //       service_id: 'service-guid-here',
  //       space_guid: 'space-guid-here',
  //       parameters: {
  //         org: 'cdmo',
  //         env: 'test',
  //         user: 'carlos@apigee.com',
  //         pass: ''
  //       }
  //     }
  //   }
  //   api.put('/v2/service_instances/' + serviceInstance.instance_id)
  //   .send(serviceInstance.payload)
  //   .set('Accept', 'application/json')
  //   .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
  //   .expect(201, done)
  // })
})
