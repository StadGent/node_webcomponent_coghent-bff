### Development stage
FROM node:lts-alpine as development-stage

ARG NPM_AUTH_TOKEN
# We need to set NPM_AUTH_TOKEN build ARG to ENV because we need valid .npmrc file for development aswell
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN

WORKDIR /app

RUN npm install -g webpack webpack-cli

COPY ./package*.json  package-lock.json ./
RUN npm install

COPY ./src ./src
COPY ./webpack.*.js ./

CMD npm run build:dev

EXPOSE 4001