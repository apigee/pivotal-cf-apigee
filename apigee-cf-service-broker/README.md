# cf apigee service broker
Service broker that provides integration between Apigee Edge and Cloud Foundry.

## pre-requisites

### node.js
instructions for downloading and installing can be found [here](https://nodejs.org/en/).

### Redis service
Used for data persistence for service broker
```bash
cf create-service p-redis shared-vm apigee-redis
```

### Elastic Runtime v 1.7
[Route-Services](http://docs.cloudfoundry.org/services/route-services.html) is required by the Apigee service broker, and is available starting in version 1.7 of Elastic Runtime (beta at time of the POC).

### CF CLI
"Edge" version of the CF [command line interface](https://cli.run.pivotal.io/edge?arch=macosx64&source=github). This version includes required support for route-services operations.

### An active account on the Apigee Edge site.
TODO: instructions for doing this....

## usage
1. check out the project
 ```bash
 cd <your working directory>
 git clone https://github.com/apigee/pivotal-cf-apigee.git
 cd pivotal-cf-apigee/apigee-cf-service-broker
 ```

1. load dependencies and test
 ```bash
 npm install
 npm test
 ```

1. edit manifest to set env variables to appropriate values for your environment and Edge account.

1. Deploy the broker to cloud foundry.
 ```bash
 cf push
 ```

1. During deployment, the service broker will create a random unique password and output it to its logs. This password must be used when interacting with the service broker via the cf CLI. Note that it will change each time the service broker restarted or re-deployed.
 ```bash
 cf logs apigee-cf-service-broker --recent |grep "Using default"
 ```

1. determine the url of your service broker
 ```bash
 cf a |grep apigee-cf-service-broker
 ```
 
1. register service broker
 ```bash
 cf create-service-broker apigee-edge admin <password from previous step> <url of your service broker>
 ```

1. publish in marketplace
 ```bash
 cf enable-service-access apigee-edge
 cf marketplace
 cf marketplace -s apigee-edge
 ```

1. create service instance in cf org/space
 ```bash
 cf create-service apigee-edge free myapigee -c '{"org":"<your edge org>","env":",your edge env>","user":"<your edge user id>","pass":"<your edge password>"}'
 ```

1. push an application that you wish to register an Edge route for, and note its url.

1. use route-services and the broker to bind a route to this application
 ```bash
 cf bind-route-service <your domain> myapigee --hostname <hostname of the app you are creating route for>
 ```
 
1. Log into Edge and not that the route has been created, and that requests to your app are being routed thorugh Edge. TODO: need instructions for this part.

## teardown
```bash
cf unbind-route-service <your domain> myapigee --hostname <hostname of the app>
cf delete-service myapigee 
delete-service-broker apigee-edge
```
