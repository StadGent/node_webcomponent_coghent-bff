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

const apolloServer = new ApolloServer({
  typeDefs: readFileSync('./schema.graphql').toString('utf-8'),
  resolvers,
  dataSources: () => ({
    EntitiesAPI: new EntitiesAPI(),
    SearchAPI: new SearchAPI(),
    UserAPI: new UserAPI(),
  }),
  context: ({ req, res }) => {
    /*if (!req.session.auth) {
      console.log(req.session)
      res.status(401);
      res.end('You must be logged in.');
    }*/
    return { session: req.session };
  },
  introspection: environment.apollo.introspection,
  playground: environment.apollo.playground,
});

const app = express();
app.use(express.json());
app.use(
  cors({
    credentials: false,
    origin: [environment.webPortal, environment.boxFrontend],
  })
);

applyAuthSession(app, environment.sessionSecret);

apolloServer.applyMiddleware({ app, path: environment.apollo.graphqlPath, cors: false });

applyAuthEndpoints(app, environment.oauthBaseUrl, environment.clientSecret);

const httpServer = app.listen(environment.port, () => {
  console.log(
    `🚀 Server is running on port ${environment.port}`
  );
});

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    httpServer.close();
  });
}
