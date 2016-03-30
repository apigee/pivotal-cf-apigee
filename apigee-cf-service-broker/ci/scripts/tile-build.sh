#!/bin/sh -e

TILE_GEN_DIR=$1
SOURCE_DIR=$2
HISTORY_DIR=$3
TARGET_DIR=$4

BIN_DIR="$( cd "${TILE_GEN_DIR}/bin" && pwd )"

TILE="${BIN_DIR}/tile"

HISTORY=`ls ${HISTORY_DIR}/tile-history-*.yml`
if [ -n "${HISTORY}" ]; then
	cp ${HISTORY} ${SOURCE_DIR}/tile-history.yml
fi

(cd ${SOURCE_DIR}; zip -r resources/apigee.zip server.js package.json api helpers policy_templates proxy-resources schemas util; $TILE build)

VERSION=`grep '^version:' ${SOURCE_DIR}/tile-history.yml | sed 's/^version: //'`
HISTORY="tile-history-${VERSION}.yml"

cp ${SOURCE_DIR}/product/*.pivotal ${TARGET_DIR}
cp ${SOURCE_DIR}/tile-history.yml ${TARGET_DIR}/tile-history-${VERSION}.yml
