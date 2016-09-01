# cf apigee service broker
A service broker that provides integration between Apigee Edge and Cloud Foundry.

## Prerequisites

Route services requires TLS. For SaaS Edge, the environment must have an secure Virtual Host, which is provided by default. Edge Microgateway can be configured with SSL; running it inside Cloud Foundry as an app automatically provides that layer.

### Node.js
Node v4.x: instructions for downloading and installing node.js can be found [here](https://nodejs.org/en/).

### Redis service
Redis is used for data persistence by the service broker. The service instance name is specified in the manifest.yml.
```bash
cf create-service p-redis shared-vm apigee_cf_service_broker-p-redis
```

### Elastic Runtime v 1.7
[Route-Services](http://docs.cloudfoundry.org/services/route-services.html) is required by the Apigee service broker, and is available starting in version 1.7 of Elastic Runtime (in beta at the time of the POC).

### CF CLI
A recent version of the CF [command line interface](https://github.com/cloudfoundry/cli) that includes required support for route-services operations. Confirmed working with v6.20.0.

### An active Apigee Edge account.
This broker works with both private cloud (OPDK) and SaaS Edge. If you are not an existing Apigee Edge customer you can register for a free SaaS account at [https://accounts.apigee.com/accounts/sign_up](https://accounts.apigee.com/accounts/sign_up).

## Usage
1. Check out the project
 ```bash
 cd <your working directory>
 git clone https://github.com/apigee/pivotal-cf-apigee.git
 cd pivotal-cf-apigee/apigee-cf-service-broker
 ```

1. Load dependencies and test
 ```bash
 npm install
 npm test
 ```

1. Edit the manifest to set required variables and override defaults as appropriate for your environment and Edge account.
The default values are for a SaaS Edge account.

Item | Purpose | Default
---- | ---- | ----
APIGEE_REDIS_PASSPHRASE | passphrase used to encrypt data in Redis store | *no default value*, must be in manifest
APIGEE_DASHBOARD_URL | URL for Apigee Edge management UI | `https://enterprise.apigee.com/platform/#/` for SaaS Edge.
APIGEE_MGMT_API_URL | Apigee Edge Management API endpoint | `https://api.enterprise.apigee.com/v1` for SaaS Edge.
APIGEE_PROXY_DOMAIN | Domain for API Proxies | `apigee.net` for Free SaaS accounts.
APIGEE_PROXY_HOST_TEMPLATE | Template for generating proxy URL | `${org}-${env}.${domain}` for Free SaaS accounts.
APIGEE_PROXY_NAME_TEMPLATE | Template for naming API Proxies in Edge | `cf-${routeName}`

1. Deploy the broker to cloud foundry.
 ```bash
 cf push
 ```
   Note the resulting URL of the broker app, for example
 ```
 urls: apigee-cf-service-broker.local.pcfdev.io
 ```

1. Communication with the broker is protected with a user name and password (to prevent unauthorized access to the broker app from other sources). These credentials are specified when the broker is created, and then used for each call. However, validating those credentials is the responsibility of the broker app, which does not have those credentials provided by the runtime.

   Choose a user name and password and store then as the following environment variables for the broker app. Then restage the broker app to load those variables.
 ```bash
 cf set-env apigee-cf-service-broker SECURITY_USER_NAME <pick a username>
 cf set-env apigee-cf-service-broker SECURITY_USER_PASSWORD <pick a password>
 cf restage apigee-cf-service-broker
 ```

1. Use those credentials and the URL for the broker app to create the service broker
 ```bash
 cf create-service-broker apigee-edge <user from above> <password from above> https://apigee-cf-service-broker.<rest of url where broker is running>
 ```

1. Publish in marketplace
 ```bash
 cf enable-service-access apigee-edge
 cf marketplace
 cf marketplace -s apigee-edge
 ```

1. Create service instance in cf org/space
 ```bash
 cf create-service apigee-edge org myapigee -c '{"org":"<your edge org>","env":"<your edge env>","user":"<your edge user id>","pass":"<your edge password>"}'
 ```

1. Push an application that you wish to register an Edge route for, and note its url.

1. Use route-services and the broker to bind a route to this application
 ```bash
 cf bind-route-service <your domain> myapigee --hostname <hostname of the app you are creating route for>
 ```

1. Log into Edge and note that the route has been created, and that requests to your app are being routed through Edge. You will find a proxy named using the pattern specified by the APIGEE_PROXY_NAME_TEMPLATE variable and deployed to the environment specified when you created your service instance. Entering trace on that proxy and sending requests to your app will show the traffic routing through the proxy. You can now configure standard Apigee Edge policies on that proxy.

### Microgateway

To use Edge Microgateway, specify its FQDN/host as `micro` in the `create-service` parameters. This overrides the APIGEE_PROXY_HOST_TEMPLATE, which then obviates APIGEE_PROXY_DOMAIN. For example, if it is running in Cloud Foundry as an app, it might be something like:

```bash
cf create-service apigee-edge org myapigee -c '{"org":"<your edge org>","env":"<your edge env>","user":"<your edge user id>","pass":"<your edge password>","micro":"edgemicro-app.local.pcfdev.io"}'
```

## Teardown
```bash
cf unbind-route-service <your domain> myapigee --hostname <hostname of the app>
cf delete-service myapigee
delete-service-broker apigee-edge
```
