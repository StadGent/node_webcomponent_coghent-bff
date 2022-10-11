### Development stage
FROM node:14-alpine as development-stage

ARG NPM_CONFIG__AUTH_TOKEN

RUN apk add --no-cache git && adduser --disabled-password --home /app --shell /bin/bash app

WORKDIR /app

COPY .npmrc ./package*.json ./codegen.yml ./tsconfig.json ./schema.graphql ./

RUN npm install -g webpack webpack-cli && npm install && npm cache clean --force

COPY ./src ./src
COPY ./webpack.*.js ./

CMD npm run dev

EXPOSE 4000

### Production stage
FROM node:14-alpine as production-stage

ARG NPM_CONFIG__AUTH_TOKEN
ENV NODE_ENV=production

RUN adduser --disabled-password --home /app --shell /bin/bash app

USER app

WORKDIR /app

COPY --from=development-stage --chown=app:app /app /app

RUN npm run generate && npm run build && rm .npmrc && npm cache clean --force

CMD npm start

EXPOSE 4000
