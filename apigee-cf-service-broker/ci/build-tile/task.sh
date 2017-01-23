#!/bin/sh -ex

ver=`more version/number`

cd tile-repo/apigee-cf-service-broker
cp ../../broker-zip/*.zip resources/apigee.zip
tile build ${ver}

cp product/*.pivotal ../../broker-tile
cp tile-history.yml ../../tile-history-new/tile-history-${ver}.yml