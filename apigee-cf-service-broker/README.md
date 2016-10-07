# Cloud Foundry Service Broker for Apigee
A service broker that provides integration between Apigee Edge and Cloud Foundry.

## Prerequisites

Route services requires TLS. For SaaS Edge, the environment must have an secure Virtual Host, which is provided by default. Edge Microgateway can be configured with SSL; running it inside Cloud Foundry as an app automatically provides that layer.

### Node.js
[Node v4.x or later](https://nodejs.org/en/).
Cloud Foundry includes Node.js as a system buildpack, so you can install and run the service broker without
Node installed locally, if necessary.

### Elastic Runtime v 1.7
[Route-Services](http://docs.cloudfoundry.org/services/route-services.html) is required by the Apigee service broker, and is available starting in version 1.7 of Elastic Runtime.

### CF CLI
A recent version of the [CF command line interface](https://github.com/cloudfoundry/cli) that includes required support for route-services operations. Confirmed working with v6.20.0.

### An active Apigee Edge account.
This broker works with both private cloud (OPDK) and SaaS Edge. If you are not an existing Apigee Edge customer you can register for a free SaaS account at [https://accounts.apigee.com/accounts/sign_up](https://accounts.apigee.com/accounts/sign_up).

### Apigee SSO CLI
The broker will create the (reverse) proxy on Apigee Edge for the app's route. This requires authenticating with Edge; ideally this is done with an authorization token, generated with scripts in the [Apigee SSO CLI bundle](http://docs.apigee.com/api-services/content/using-oauth2-security-apigee-edge-management-api#installingacurlandgettokenutilities). Plain username and password may also be used if necessary.

## Usage

With Cloud Foundry, a *service broker* provides a catalog of services, and performs tasks to tie those services with applications and their routes. This broker only supports route services, to use Apigee as a reverse proxy for applications, and follows the standard route service flow:

1. [CF Administrator/Operator installs the service to make it available in the marketplace](#install)
2. [User creates service instance for CF org/space](#instance)
3. [User binds or unbinds route service to app route as needed](#bind)

Some steps are slightly different when [using Microgateway](#microgateway)

### <a name="install"></a>Install service

A service broker can be installed as an application (i.e. a broker-app) by an Administrator. This is particularly useful when running a Cloud Foundry development environment.

For Pivotal Cloud Foundry, this broker is also packaged as a *tile* for easy installation by an Operator.

#### Installing broker-app

These instructions assume a local [PCF Dev](https://pivotal.io/pcf-dev) environment, at the domain `local.pcfdev.io`. Replace the domain as appropriate.

1. Check out the project
 ```bash
 cd <your working directory>
 git clone https://github.com/apigee/pivotal-cf-apigee.git
 cd pivotal-cf-apigee/apigee-cf-service-broker
 ```

1. Load dependencies and test (requires Node to be installed)
 ```bash
 npm install
 npm test
 ```

1. Edit the manifest to set required variables and override defaults as appropriate for your environment and Edge account.

Item | Purpose | Default (for SaaS Edge)
---- | ---- | ----
APIGEE_DASHBOARD_URL | URL for Apigee Edge management UI | `https://enterprise.apigee.com/platform/#/`
APIGEE_MGMT_API_URL | Apigee Edge Management API endpoint | `https://api.enterprise.apigee.com/v1`
APIGEE_PROXY_DOMAIN | Domain for proxy host template | `apigee.net`
APIGEE_PROXY_HOST_TEMPLATE | ES6 template literal for generated proxy host. (Note that without any placeholders, will be used as-is.) | `${org}-${env}.${domain}`
APIGEE_PROXY_NAME_TEMPLATE | ES6 template literal for generated proxy | `cf-${routeName}`


1. Deploy the broker.
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
 cf create-service-broker apigee-edge <user from above> <password from above> https://apigee-cf-service-broker.local.pcfdev.io
 ```

1. Publish in marketplace
 ```bash
 cf enable-service-access apigee-edge
 cf marketplace
 cf marketplace -s apigee-edge
 ```

#### Installing tile

TBD

### <a name="instance"></a>Create service instance

A CF service typically offers several variations, known as *service plans*. For this broker, they are:

Service plan | Purpose | Required `bind-route-service` parameter
---- | ---- | ----
`org` | Apigee public or private cloud |
`microgateway` | Apigee Edge Microgateway | `micro`: FQDN of microgateway

The service instance is created for the CF org/space by specifying the desired service plan and a name for the instance. For example, for the service name `myapigee` using the `org` plan:
```bash
cf create-service apigee-edge org myapigee
cf service myapigee
```

### <a name="bind"></a>Bind route service

Each bind attempt requires authorization with Edge, passed as additional parameters to the `cf` bind command.

1. First, get the URL of the app/route to bind. `cf routes` lists the host and domain separately; `cf apps` combines them into a FQDN, listed under "urls". For example, if the app's hostname is `test-app`, then the resulting FQDN is `test-app.local.pcfdev.io`

1. Get or update the authorization token using the Apigee SSO CLI script. You may be prompted for your Apigee Edge username and password, and an MFA token, if you have MFA enabled for the organization. This updates the token in the `~/.sso-cli/valid_token.dat` file (if that subdirectory exists -- otherwise the file is placed in the current working directory):
```bash
 get_token
```

1. Bind the route-service to Apigee with the domain and hostname, carefully using quotes and command expansion:
 ```bash
cf bind-route-service local.pcfdev.io myapigee --hostname test-app \
   -c '{"org":"<your edge org>","env":"<your edge env>",
       "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'"}'
 ```

1. Log into Edge and note that the route has been created, and that requests to your app are being routed through Edge. You will find a proxy named using the pattern specified by the APIGEE_PROXY_NAME_TEMPLATE variable and deployed to the environment specified when you created your service instance. Entering trace on that proxy and sending requests to your app will show the traffic routing through the proxy. You can now configure standard Apigee Edge policies on that proxy.

#### Auhorization security

The broker does not store any data; it requires credentials and other parameters for each individual `cf` command.

Instead of a `bearer` token, credentials can also be expressed as

- `basic`: standard HTTP Base-64 encoded username and password for `Authorization: Basic`. Note that this is *not encrypted* and easily converted to clear text. But a jumble of digits and letters may provide some protection in case of momentary exposure (but no better than if the password is already a jumble of digits, letters, and symbols)
- `user` and `pass`: username and password in clear text

### <a name="microgateway"></a>Microgateway

To use Edge Microgateway, select the `microgateway` service plan when creating the service instance.
```bash
cf create-service apigee-edge microgateway myapigee
```

When binding, specify the its FQDN as `micro`. In this example, the Microgateway is also installed as an app with the hostname `edgemicro-app`:
```bash
cf bind-route-service local.pcfdev.io myapigee --hostname test-app \
   -c '{"org":"<your edge org>","env":"<your edge env>",
       "bearer":"'$(cat ~/.sso-cli/valid_token.dat)'",
       "micro":"edgemicro-app.local.pcfdev.io"}'
```

The proxies created by the bind for Microgateway have an additional `edgemicro_` at the beginning of their name, a general requirement unrelated to Cloud Foundry and service brokers. Another general requirement is that the proxy is part of a published API Product; a change you must make manually.

If the version of Microgateway does not support automatic configuration reload, you must restart Microgateway to fetch the newly created proxy and updated Product configuration.

### Unbind route service

The unbind command does not accept any parameters
```bash
cf unbind-route-service local.pcfdev.io myapigee --hostname test-app
```

### Uninstalling service instance and broker
```bash
cf delete-service myapigee
cf delete-service-broker apigee-edge
```
