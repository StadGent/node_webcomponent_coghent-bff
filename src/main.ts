import { ApolloServer } from 'apollo-server-express';
import { readFileSync } from 'fs';
import express from 'express';
import cors from 'cors';

import { environment } from './environment';
import { EntitiesAPI } from './entities';
import { resolvers } from './resolvers';
import { SearchAPI } from './entities_search';

const apolloServer = new ApolloServer({
  typeDefs: readFileSync('./schema.graphql').toString('utf-8'),
  resolvers,
  dataSources: () => ({
    EntitiesAPI: new EntitiesAPI(),
    SearchAPI: new SearchAPI(),
  }),
  /*context: ({ req, res }) => {
    if (!req.session.auth) {
      res.status(401);
      res.end('You must be logged in.');
    }
    return { session: req.session };
  },*/
  introspection: environment.apollo.introspection,
  playground: environment.apollo.playground,
});

const app = express();
app.use(express.json());
app.use(
  cors({
    credentials: false,
    origin: ['http://localhost:8070', 'http://localhost:8071'],
  })
);

apolloServer.applyMiddleware({ app, path: '/api/graphql', cors: false });

const httpServer = app.listen(environment.port, () => {
  console.log(`🚀 Server is running at http://localhost:${environment.port}`);
});

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    httpServer.close();
  });
}
