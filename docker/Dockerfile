### Development stage
FROM node:lts-alpine as development-stage

ARG NPM_AUTH_TOKEN
# We need to set NPM_AUTH_TOKEN build ARG to ENV because we need valid .npmrc file for development aswell
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN

WORKDIR /app

ENTRYPOINT ["/entrypoint.sh"]
COPY docker/entrypoint*.sh /
COPY package*.json ./

RUN apk add --no-cache git
RUN git --version
RUN npm install -g webpack webpack-cli
RUN npm install -g concurrently

RUN npm install

COPY ./src ./src
COPY ./webpack.*.js ./

EXPOSE 4001