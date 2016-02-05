#!/bin/bash -ex

mkdir -p /usr/src/app
cp -r git-source/* /usr/src/app
cd /usr/src/app
npm install
npm test

exit $?
