#!/bin/sh -ex

ver=`more ../../version/number`
(cd tile-repo/apigee-cf-service-broker; npm install; zip -r resources/apigee.zip EULA.txt LICENSE README.md manifest.yml api helpers policy_templates proxy-resources schemas util node_modules package.json server.js; tile build ${ver})

file=`ls product/*.pivotal`
filename=$(basename "${file}")
filename="${filename%-*}"

cp ${file} ../../broker-tile/${filename}-${ver}.pivotal
cp tile-history.yml ../../tile-history-new/tile-history-${ver}.yml