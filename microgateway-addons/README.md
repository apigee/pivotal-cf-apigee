# Apigee Edge Microgateway Add-ons for Cloud Foundry

These add-ons enable Edge Microgateway to run as a Cloud Foundry app, either generally, or specifically as a route-service.

## Prerequisites

Apigee Edge Microgateway version 2.2.2 or later. Install and configure it for your Apigee organization and environment first.

## Instructions

Copy the content of the `microgateway` directory into your Microgateway installation directory. The contents are:

- `manifest.yml`: sample CF manifest to run as `edgemicro-app`
- `startmicro`: smarter start script
- `plugins/cloud-foundry-route-service/`: plugin to enable Microgateway to act as Cloud Foundry route-service

Note that simply copying everything in the directory includes copying the `plugins` directory; that may *replace all existing content*. The existing content may be only the sample plugin, so its loss is not catastrophic, but be careful. You may want to copy the files in the root, and then the subdirectory in `plugins`, separately.

### Manifest

The manifest sets the memory at `512M`, enough for a small workload with several proxies and products.

### Start script

Configuring Microgateway creates the `~/.edgemicro` directory with the configuration files. This directory must be copied into the Microgateway installation directory before the `cf push` into Cloud Foundry. The root directory of the application becomes the home directory when running inside Cloud Foundry.

The start script looks for the first `*-cache-config.yaml` file for an organization/environment, and extracts some values from that file to launch the Microgateway for that configuration.

The start script also works outside Cloud Foundry. (But take note of which home subdirectory is being scanned.)

The `package.json` must be modified so that the start script is used. The relevant section should read:
```
 "scripts": {
   "start": "./startmicro",
```

Self-signed certificates are used for `https` in some Cloud Foundry setups, including local PCF Dev; and are allowed by Microgateway by setting `NODE_TLS_REJECT_UNAUTHORIZED=0` at startup. To enforce verification, remove this from the start script.

### Plugin

Using Microgateway as a route-service requires adding an entry to the configuration. The relevant section of your `*-config.yaml` file should read like:

```yaml
plugins:
  sequence:
    - oauth
    - cloud-foundry-route-service
```


### Installation sequence
1. Configure Microgateway
1. Copy add-ons to Microgateway
1. Add `cloud-foundry-route-service` to config file
1. Copy `~/.edgemicro` directory
1. Remove `NODE_TLS_REJECT_UNAUTHORIZED=0` from `startmicro` if desired
1. Modify `package.json` to use `./startmicro`
1. Set memory or anything else in `manifest.yml`
1. `cf push`
