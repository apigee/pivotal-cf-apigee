#!/bin/bash -ex

mkdir -p /usr/src/app
cp -r git-source/apigee-cf-service-broker/* /usr/src/app
cd /usr/src/app
npm install
cp sample-config.json config.json
npm test

exit $?
