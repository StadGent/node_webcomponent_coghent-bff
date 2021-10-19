#!/bin/bash
set -a

__DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DOCKER_BUILDKIT=1

DOCKER=docker
if [ -x "$(command -v podman)" ]; then
  DOCKER=podman
fi

if [[ -f "${1:-.env.local}" ]]; then
  echo "Using '${1:-.env.local}' as .env"
  . ${1:-.env.local}
else
  echo "Missing ${1:-.env.local} file, provide valid one as argument"
  exit 1
fi

${DOCKER} build -f docker/Dockerfile -t coghent-graphql-service:dev --target=development-stage --build-arg NPM_AUTH_TOKEN=${NPM_AUTH_TOKEN} $__DIR $@
