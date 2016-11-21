# Apigee Edge Microgateway Add-ons for Cloud Foundry

You can run Edge Microgateway in Cloud Foundry to gain the scalability and management benefits that Cloud Foundry provides for other apps it hosts. This file includes instructions for adding Edge Microgateway as a Cloud Foundry-managed application and adding a plugin needed to bind Cloud Foundry applications to Edge Microgateway proxies.

To do that, with these instructions you turn your Edge Microgateway installation directory into the root directory of a Cloud Foundry app, including a plugin.

When you run Edge Microgateway as a Cloud Foundry app, you shorten the distance between a proxy running on Edge Microgateway and a Cloud Foundry app bound to it. This shortened distance can increase performance.

## Prerequisites

Apigee Edge Microgateway version 2.3.0 or later. [Install](http://docs.apigee.com/microgateway/latest/edge-microgateway-installation), [configure](http://docs.apigee.com/microgateway/latest/edge-microgateway-tutorial), and [start](http://docs.apigee.com/microgateway/latest/edge-microgateway-tutorial#part3operateedgemicrogateway-1startedgemicrogateway) it (at least once) for your Apigee organization and environment first. Edge Microgateway doesn't need to be running to configure integration.

Performing these Edge Microgateway steps will give you the configuration files necessary to configure the plugin.

## Instructions

1. Locate the following, which you'll need when setting up this integration:
 - Your Edge Microgateway installation directory. This will be the directory that contains the startmicro file.
 
     When you use npm with the global option (`npm install -g edgemicro`), the software is installed in `[prefix]/lib/node_modules/edgemicro`. You can find the value of `[prefix]` with this command:

     ```
npm config get prefix
```
 - The `[org]-[env]-config.yaml` file for your Edge Microgateway organization and environment.
 
     For example, if you specified `myorg` and `test` as your organization and environment parameters on the `edgemicro configure` command, your .yaml file is likely to be called:
     
     `~/.edgemicro/myorg-test-config.yaml`

2. Copy the content of this repository's `microgateway` directory into your Edge Microgateway installation directory.

 You'll copy the following from inside the `microgateway` directory to the inside of your Edge Microgateway installation directory:
  - A manifest.yml file. This is a sample Cloud Foundry manifest to run as edgemicro-app.
  
     The manifest sets the memory at 512M, enough for a small workload with several proxies and products.
  - A startmicro file. You might need to replace a startmicro file already in the directory.

     The start script extracts organization/environment from the `[org]-[env]-cache-config.yaml` file to launch the Edge Microgateway for that configuration.

     **Note:** Self-signed certificates are used for https in some Cloud Foundry setups, including local PCF Dev; To enforce verification, remove this from the start script:

     NODE\_TLS\_REJECT_UNAUTHORIZED=0 at startup. 
 - A `plugins/cloud-foundry-route-service` directory. **Note:** Simply copying the `plugins` directory into the Edge Microgateway installation directory could **replace the contents of the plugins directory** that's already there. If you want to avoid this, copy the `cloud-foundry-route-service` directory separately into the `plugins` directory.
 
     This is a plugin to enable Edge Microgateway to act as Cloud Foundry route-service.     
3. Edit the `package.json` so that the new startmicro script is used. The relevant section should read:

 ```
 "scripts": {
    "start": "./startmicro",
```
4. In your Edge Microgateway configuration file, under `plugins`, add the following line to reference the plugin you're adding:

 ```- cloud-foundry-route-service```

 The edited section of your `*-config.yaml` file should read like this:
 ```
plugins:
      sequence:
        - oauth
        - cloud-foundry-route-service
  ```
5. Reload Edge Microgateway to ensure that your configuration changes have been propagated to all the required files (the .yaml files in `~/.edgemicro`).

    Run `edgemicro reload -o [org] -e [env] -k [key] -s [secret]`

6. Copy the entire `~/.edgemicro` directory into the Edge Microgateway installation directory.

 Before you add the Edge Microgateway app to Cloud Foundry with the `cf push` command, you must include in it the configuration files it needs. The root directory of the application becomes the home directory when running inside Cloud Foundry.
 
7. From the command prompt, cd to the Edge Microgateway installation directory, which now contains a copy of `.edgemicro`, the plugin code you copied from this repository, and the edited package.json.

8. Run `cf push` to add Edge Microgateway as an app to Cloud Foundry.

 A successful push will end with output such as the following, showing a running state.

 ```
requested state: started
instances: 1/1
usage: 512M x 1 instances
urls: edgemicro-app.cfapps.pivotal.io
last uploaded: Fri Nov 18 18:07:36 UTC 2016
stack: cflinuxfs2
buildpack: nodejs_buildpack

         state     since                    cpu    memory           disk           details
#0   running   2016-11-18 01:08:47 PM   0.0%   263.2M of 512M   113.3M of 1G
```
