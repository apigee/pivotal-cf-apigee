# cf apigee service broker
A service broker that provides integration between Apigee Edge and Cloud Foundry.

## pre-requisites

### node.js
instructions for downloading and installing node.js can be found [here](https://nodejs.org/en/).

### Redis service
Redis is used for data persistence by the service broker.
```bash
cf create-service p-redis shared-vm apigee_cf_service_broker-p-redis
```

### Elastic Runtime v 1.7
[Route-Services](http://docs.cloudfoundry.org/services/route-services.html) is required by the Apigee service broker, and is available starting in version 1.7 of Elastic Runtime (in beta at the time of the POC).

### CF CLI
"Edge" version of the CF [command line interface](https://cli.run.pivotal.io/edge?arch=macosx64&source=github). This version includes required support for route-services operations.

### An active Apigee Edge account.
This broker works with both private cloud (OPDK) and SaaS Edge. If you are not an existing Apigee Edge customer you can register for a free SaaS account at [https://accounts.apigee.com/accounts/sign_up](https://accounts.apigee.com/accounts/sign_up).

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

1. edit the manifest to set the listed variables to appropriate values for your environment and Edge account.
The sample values are appropriate for a SaaS Edge account. For a private cloud (OPDK) Edge installation you will need to adjust the APIGEE_PROXY_HOST, APIGEE_PROXY_HOST_PATTERN, and APIGEE_MGMT_API_URL values.

Item | Purpose | Example
---- | ---- | ----
APIGEE_REDIS_PASSPHRASE | passphrase used to encrypt data in Redis store | `correct horse battery staple`
APIGEE_DASHBOARD_URL | URL for Apigee Edge management UI | `https://enterprise.apigee.com/platform/#/` for SaaS Edge.
APIGEE_MGMT_API_URL | Apigee Edge Management API endpoint. | `https://api.enterprise.apigee.com/v1` for SaaS Edge.

1. Deploy the broker to cloud foundry.
 ```bash
 cf push
 ```

1. Create environment variables for the broker authentication.
```bash
cf set-env apigee-cf-service-broker SECURITY_USER_NAME <pick a username>
cf set-env apigee-cf-service-broker SECURITY_USER_PASSWORD <pick a password>
​
# restage the broker
cf restage apigee-cf-service-broker
```

1. determine the url of your service broker
 ```bash
 cf a |grep apigee-cf-service-broker
 ```

1. register service broker
 ```bash
 cf create-service-broker apigee-edge <username specified above> <password specified above> <url of your service broker>
 ```

1. publish in marketplace
 ```bash
 cf enable-service-access apigee-edge
 cf marketplace
 cf marketplace -s apigee-edge
 ```

1. create service instance in cf org/space
 ```bash
 cf create-service apigee-edge free myapigee -c '{"org":"<your edge org>","env":"<your edge env>","user":"<your edge user id>","pass":"<your edge password>", "host":"<apigee host>", "hostPattern":"<pattern to generate url>"}'
 ```
 Where 
 * `host` is the hostname for your Edge proxies. E.g. "apigee.net" if you are using the Apigee Trial. 
 * `hostPattern` is the pattern to determine a proxy url. E.g. "${apigeeOrganization}-${apigeeEnvironment}.${proxyHost}" if you are using the Apigee Trial, or just "${proxyHost}" for a simple on-premises installation.

1. push an application that you wish to register an Edge route for, and note its url.

1. use route-services and the broker to bind a route to this application
 ```bash
 cf bind-route-service <your domain> myapigee --hostname <hostname of the app you are creating route for>
 ```

1. Log into Edge and note that the route has been created, and that requests to your app are being routed through Edge. You will find a proxy named using the pattern specified in the APIGEE_PROXY_NAME_PATTERN variable in the manifest.yml and deployed to the environment specified when you created your service instance. Entering trace on that proxy and sending requests to your app will show the traffic routing through the proxy. You can now configure standard Apigee Edge policies on that proxy.

## teardown
```bash
cf unbind-route-service <your domain> myapigee --hostname <hostname of the app>
cf delete-service myapigee
delete-service-broker apigee-edge
```
