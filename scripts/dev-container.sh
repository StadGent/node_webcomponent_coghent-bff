#!/bin/bash
set -a

__DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DOCKER=docker
if [ -x "$(command -v podman)" ]; then
  DOCKER=podman
fi

${DOCKER} run -it --rm -v ${__DIR}/src:/app/src -p 4000:4000 --env-file=.env.local coghent-graphql-service:dev $@
