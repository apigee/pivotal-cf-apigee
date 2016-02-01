'use strict'
// TODO: write tests!
var chai = require('chai')
chai.use(require('chai-things'))
var expect = chai.expect
var should = require('should')
var supertest = require('supertest')

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
