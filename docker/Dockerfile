### Development stage
FROM node:14.17.6-alpine3.12 as development-stage

ARG NPM_AUTH_TOKEN

RUN apk add --no-cache git

RUN adduser --disabled-password --home /app --shell /bin/bash app
WORKDIR /app

COPY .npmrc ./package*.json ./codegen.yml ./tsconfig.json ./schema.graphql ./
RUN npm install -g webpack webpack-cli
RUN npm install

COPY ./src ./src
COPY ./webpack.*.js ./

CMD npm run dev

EXPOSE 4000

### Production stage
FROM node:14.17.6-alpine3.12 as production-stage

ARG NPM_AUTH_TOKEN
ENV NODE_ENV=production

RUN adduser --disabled-password --home /app --shell /bin/bash app
USER app
WORKDIR /app

COPY --from=development-stage --chown=app:app /app /app

RUN npm run generate
RUN npm run build

RUN rm .npmrc

CMD npm start

EXPOSE 4000
