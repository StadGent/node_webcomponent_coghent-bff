import { ApolloServer } from 'apollo-server-express';
import { readFileSync } from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import {
  applyAuthEndpoints,
  applyAuthSession,
  applyEnvironmentConfig,
  EnvConfig,
} from 'inuits-apollo-server-auth';
import { environment } from './environment';
import { EntitiesAPI } from './entities';
import { resolvers } from './resolvers';
import { SearchAPI } from './entities_search';
import { UserAPI } from './user';
import { IiifAPI } from './iiif';
import { BoxVisitersAPI } from './boxVisiters';

import { BaseRedisCache } from 'apollo-server-cache-redis';
import { TicketsAPI } from './ticket';
import { StoryBoxAPI } from './sources/storybox';
import { TestimonyAPI } from './testimony';
import { StorageStaticAPI } from './sources/storage_static';
// @ts-ignore
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import EntitiesStaticAPI from './sources/entities_static';
import { proxyLinks } from './sources/constants';

console.log(`>inuits-apollo-server-auth: v1.0.17`);
const Redis = require('ioredis');

let redisCache = undefined;
if (environment.redisHost) {
  redisCache = new BaseRedisCache({
    client: new Redis({
      host: environment.redisHost,
    }),
  });
  console.log(`Redis cache enabled: ${environment.redisHost}`);
} else {
  console.log('No Redis cache');
}

export const app = express();
app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
app.use(express.json());
app.use(
  cors({
    credentials: false,
    origin: [environment.webPortal, environment.boxFrontend],
  })
);

const apolloServer = new ApolloServer({
  typeDefs: readFileSync('./schema.graphql').toString('utf-8'),
  resolvers,
  dataSources: () => ({
    StorageStaticAPI: new StorageStaticAPI(),
    EntitiesAPI: new EntitiesAPI(),
    EntitiesStaticAPI: new EntitiesStaticAPI(),
    StoryBoxAPI: new StoryBoxAPI(),
    BoxVisitersAPI: new BoxVisitersAPI(),
    TestimonyAPI: new TestimonyAPI(),
    TicketsAPI: new TicketsAPI(),
    IiifAPI: new IiifAPI(),
    SearchAPI: new SearchAPI(),
    UserAPI: new UserAPI(),
  }),
  cache: redisCache,
  context: ({ req, res }) => {
    return { session: req.session };
  },
  introspection: environment.apollo.introspection,
  playground: environment.apollo.playground,
  uploads: false,
});

app.use(graphqlUploadExpress({ maxFileSize: 50000000, maxFiles: 1 }));

applyAuthSession(app, environment.sessionSecret);

// Proxy for storage API
const addJwt = (proxyReq: any, req: any, res: any) => {
  proxyReq.setHeader('Authorization', 'Bearer ' + environment.staticToken);
};

app.use(
  proxyLinks.mediafiles,
  createProxyMiddleware({
    target: environment.api.storageAPIUrl + '/download/',
    changeOrigin: true,
    pathRewrite: {
      '^/api/mediafile': '/',
    },
    onProxyReq: addJwt,
  })
);

apolloServer.applyMiddleware({
  app,
  path: environment.apollo.graphqlPath,
  cors: {
    credentials: false,
    origin: [environment.webPortal, environment.boxFrontend],
  },
});
applyEnvironmentConfig({
  tokenLogging: environment.apollo.tokenLogging,
  staticJWT: environment.staticToken,
} as EnvConfig);

applyAuthEndpoints(app, environment.oauthBaseUrl, environment.clientSecret);

const httpServer = app.listen(environment.port, () => {
  console.log(`🚀 Server is running on port ${environment.port}`);
});

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    httpServer.close();
  });
}
