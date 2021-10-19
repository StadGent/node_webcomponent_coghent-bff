#!/usr/bin/env bash

cd `dirname $0`/..
DIR=`pwd`
if [ ! -f $DIR/.npmrc.local ]; then
  touch $DIR/.npmrc.local
fi

docker run -it --rm -v $DIR/.npmrc.local:/root/.npmrc node:lts-alpine npm login --registry=https://nexus.inuits.io/repository/npm --always-auth
grep _authToken .npmrc.local | sed -e 's/^.*_authToken=/NPM_AUTH_TOKEN=/' > ${1:-.env.local}
