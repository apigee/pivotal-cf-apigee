'use strict'
// TODO: write tests!
var chai = require('chai')
chai.use(require('chai-things'))
var expect = chai.expect
var should = require('should')  // eslint-disable-line
var supertest = require('supertest')
var server = require('../server')
var nock = require('nock')
// Using Port 8000 to start test server
var port = 8000
var api = supertest('http://localhost:' + port)
var app
var config = require('../helpers/config')

/* Mock Apigee API Calls using NOCK for testing */
/* As per NOCK - works only once per API call */

// Auth Fail Apigee - Nock Interceptor
nock(config.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/org-name-here')
  .reply(401)
// Auth Success Apigee - Nock Interceptor
nock(config.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo')
  .reply(200, {
    createdAt: '1416395731939',
    createdBy: 'noreply_admin@apigee.com',
    displayName: 'cdmo',
    environments: [
      'test',
      'prod'
    ],
    lastModifiedAt: 1454446553950,
    lastModifiedBy: 'noreply_cpsadmin@apigee.com',
    name: 'cdmo',
    properties: {
      property: [
        {
          name: 'features.isCpsEnabled',
          value: 'true'
        }
      ]
    },
    type: 'trial'
  })
// Apigee Get VirtiaHosts Nock
nock(config.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/environments/test/virtualhosts')
  .reply(200, [
    'default',
    'secure'
  ])

// Apigee Upload Proxy nock
nock(config.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/apis?action=import&name=cf-route-url-here', /.*/)
  .reply(201, [
    'default',
    'secure'
  ])
// Apigee Get Proxy Details Nock
nock(config.get('APIGEE_MGMT_API_URL'))
  .get('/organizations/cdmo/apis/cf-route-url-here')
  .times(2)
  .reply(200, {
    metaData: {
      createdAt: 1453098892108,
      createdBy: 'xx@xx.com',
      lastModifiedAt: 1453099158391,
      lastModifiedBy: 'xx@xx.com'
    },
    name: 'cf-route-url-here',
    revision: [
      '1'
    ]
  })
// Apigee Deploy Proxy Details Nock
nock(config.get('APIGEE_MGMT_API_URL'))
  .post('/organizations/cdmo/environments/test/apis/cf-route-url-here/revisions/1/deployments')
  .reply(200)
// Apigee UnDeploy Proxy Details Nock
nock(config.get('APIGEE_MGMT_API_URL'))
  .delete('/organizations/cdmo/environments/test/apis/cf-route-url-here/revisions/1/deployments')
  .reply(200)

describe('Starting Tests..', function () {
  this.timeout(0)
  var authHeader = 'Basic ' + new Buffer('admin:' + config.get('APIGEE_BROKER_PASSWORD')).toString('base64')
  var badAuthHeader = 'Basic ' + new Buffer('admin:' + 'wrong-password').toString('base64')
  before(function () {  // eslint-disable-line
    app = server.listen(8000)
  })
  describe('EndPoint', function () {
    it('should return 200', function (done) {
      api.get('/')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('message')
          done()
        })
    })
    it('Invalid Auth should return 401', function (done) {
      api.get('/')
        .set('Accept', 'application/json')
        .set('Authorization', badAuthHeader)
        .expect(401, done)
    })
  })
  describe('Catalog', function () {
    it('should require basic auth', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('should return a 200 response', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200, done)
    })
    it('should be an array of objects', function (done) {
      api.get('/v2/catalog')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
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
    it('patch should return 422', function (done) {
      api.patch('/v2/service_instances/:instance_id')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(422, done)
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
        .set('Authorization', authHeader)
        .expect(401, done)
    })
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
            user: 'XXXXX',
            pass: 'XXXXXXX'
          }
        }
      }
      api.put('/v2/service_instances/' + serviceInstance.instance_id)
        .send(serviceInstance.payload)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
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
    it('should return validation failed - JSON Schema Validation', function (done) {
      api.put('/v2/service_instances/12345')
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .send("{'invalidJSON")
        .expect(400)
        .end(function (err, res) {
          expect(err).equal(null)
          expect(res.body).to.have.property('jsonSchemaValidation')
          expect(res.body.jsonSchemaValidation).to.equal(true)
          done()
        })
    })
    it('should return a 201 response', function (done) {
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
        .set('Authorization', authHeader)
        .expect(201, done)
    })
  })
  describe('Delete Binding & Delete Service', function () {
    it('should require basic auth', function (done) {
      api.put('/v2/service_instances/:instance_id/service_bindings/:binding_id')
        .set('Accept', 'application/json')
        .expect(401, done)
    })
    it('should delete the binding and return 200', function (done) {
      var bindingInstance = {
        instance_id: 'instance-guid-here',
        binding_id: 'binding-guid-here'
      }
      api.del('/v2/service_instances/' + bindingInstance.instance_id + '/service_bindings/' + bindingInstance.binding_id)
        .set('Accept', 'application/json')
        .set('Authorization', authHeader)
        .expect(200, done)
    })
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
    //   .set('Authorization', authHeader)
    //   .expect(410, done)
    // })
    it('should delete the instance and return 200', function (done) {
      var serviceInstance = 'instance-guid-here'
      api.del('/v2/service_instances/' + serviceInstance)
        .set('Authorization', authHeader)
        .expect(200, done)
    })
    // TODO: figure out how to validate data deletion
  })
  after(function (done) {   // eslint-disable-line
    this.timeout(0)
    app.close()
    done()
  })
})
