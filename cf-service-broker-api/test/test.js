'use strict'
// TODO: write tests!
var chai = require('chai')
chai.use(require('chai-things'))
var should = chai.should()
var expect = chai.expect
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
      expect(res.body).to.have.property('services')
      res.body.services.should.all.have.property('id')
      res.body.services.should.all.have.property('name')
      res.body.services.should.all.have.property('description')
      res.body.services.should.all.have.property('bindable')
      res.body.services.should.all.have.property('plans')
      res.body.services.forEach(function (service) {
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

// describe('Service Instance', function() {
//   it('should return a 200 response', function (done) {
//     api.get('/v2/service_instances')
//     .set('Accept', 'application/json')
//     .expect(200, done)
//   })
// })
