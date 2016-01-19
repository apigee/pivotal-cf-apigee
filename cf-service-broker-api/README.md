# cf-service-broker-api
Service broker API implementation. To be deployed to Edge.

# sample cf console usage
// register service broker
cf create-service-broker apigee 5zbjHdfw9fJzAMnN3xY0xJMacHX63UKA 6JnPeXyR7FljuPDb http://amer-demo6-test.apigee.net/cf-apigee-broker

// publish in marketplace
cf enable-service-access apigee-edge
cf marketplace
cf marketplace -s apigee-edge

// create service instance in cf org/space
cf create-service apigee-edge free myapigee -c '{"org":"amer-demo6"}' // FAIL
cf create-service apigee-edge free myapigee -c '{"org":"amer-demo6", "env":"test"}'

// list routes
cf routes

// get route id for app
cf curl /v2/routes?q=host:rot13
// copy the guid from metadata.guid

// get service instance details
cf curl /v2/service_instances
// get apigee service instance details
cf curl /v2/service_instances/<guid>
// copy the routes_url

// create route Binding

cf curl /v2/service_instances/<instanced id>/routes/<app route guid> -X PUT

cf curl /v2/service_instances/5a76d1c5-4bc3-455a-98b1-e3c079dc5cb2/routes/a8e387be-68d6-470b-917b-d2429b10507f -X PUT
