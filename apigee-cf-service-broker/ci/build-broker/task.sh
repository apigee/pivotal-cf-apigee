#!/bin/sh -ex

apt-get update
apt-get -y install zip

cd tile-repo/apigee-cf-service-broker
npm install
zip -r resources/apigee.zip EULA.txt LICENSE README.md manifest.yml api helpers policy_templates proxy-resources schemas util node_modules package.json server.js

file=`ls resources/*.zip`
filename=$(basename "${file}")
filename=${filename%.*}
ver=`more ../../version/number`

cp ${file} ../../broker-zip/${filename}-${ver}.zip