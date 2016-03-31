#!/bin/sh -e

TILE_GEN_DIR="$( cd "$1" && pwd )"
POOL_DIR="$( cd "$2" && pwd )"

PCF=${TILE_GEN_DIR}/bin/pcf

cd ${POOL_DIR}

# Insert tests here
# You have access to the pcf command, and you are in the dir that has the metadata file

# Typical tests here would:
# - Connect to your deployed services and brokers
# - Verify that you can create service instances
# - Bind those to test apps
# - Make sure the right things happen
