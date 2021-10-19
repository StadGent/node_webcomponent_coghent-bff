#!/bin/bash
DOCKER=docker
if [ -x "$(command -v podman)" ]; then
  DOCKER=podman
fi

${DOCKER} run -it --rm -p 4000:4000 --env-file=.env.local coghent-graphql-service:prod $@
