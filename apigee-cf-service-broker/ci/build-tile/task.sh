#!/bin/sh -ex

ver=`more version/number`

cd tile-repo/apigee-cf-service-broker
cp ../../broker-zip/*.zip resources/
tile build ${ver}

file=`ls product/*.pivotal`
filename=$(basename "${file}")
filename="${filename%-*}"

cp ${file} ../../broker-tile/${filename}-${ver}.pivotal
cp tile-history.yml ../../tile-history-new/tile-history-${ver}.yml