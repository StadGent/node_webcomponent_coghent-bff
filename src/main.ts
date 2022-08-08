import { ApolloServer } from 'apollo-server-express';
import { readFileSync } from 'fs';
import express from 'express';
import cors from 'cors';

import {
  applyAuthEndpoints,
  applyAuthSession,
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
import { StorageAPI } from './sources/storage';
// @ts-ignore
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

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
    StorageAPI: new StorageAPI(),
    EntitiesAPI: new EntitiesAPI(),
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
  '/api/mediafile',
  createProxyMiddleware({
    target: environment.api.storageAPIUrl + '/storage/v1/download/',
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
