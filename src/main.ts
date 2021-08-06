import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import { readFileSync } from 'fs';
import express from 'express';
import cors from 'cors';
import jwt_decode from 'jwt-decode';
import session from 'express-session';

import { environment } from './environment';
import { EntitiesAPI } from './entities';
import { resolvers } from './resolvers';
import { TokenManager } from './tokenRepository';

const apolloServer = new ApolloServer({
  typeDefs: readFileSync('./src/schema.graphql').toString('utf-8'),
  resolvers,
  dataSources: () => ({ EntitiesAPI: new EntitiesAPI() }),
  context: ({ req }) => {
    // optionally block the user
    // we could also check user roles/permissions here
    if (!req.session.tokenMgr) throw new AuthenticationError('You must be logged in.');
    return { session: req.session };
  },
  introspection: environment.apollo.introspection,
  playground: environment.apollo.playground,
});

const app = express();
app.use(express.json());
app.use(cors({
  credentials: false,
  origin: 'http://localhost:8070',
}));
app.use(session({
  secret: environment.sessionSecret,
  saveUninitialized: true,
  resave: false,
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 3600000,
    secure: false,
  },
}));

apolloServer.applyMiddleware({ app, path: '/api/graphql', cors: false });

app.get('/api/logout', async (req, res) => {
  req.session.tokenMgr = undefined;
  res.end('Logged out');
});

app.post('/api/auth_code', async (req, res) => {
  if (req.session.tokenMgr) {
    res.end('Session token still present.');
    return;
  }
  const { authCode, clientId, tokenEndpoint, redirectUri } = req.body;
  req.session.tokenMgr = new TokenManager(clientId, tokenEndpoint)
  try {
    await req.session.tokenMgr.authenticate(authCode, redirectUri);
    res.end('Got token succesfully.');
  } catch (e) {
    res.end('Something went wrong.');
  }
});

app.get('/api/me', async (req, res) => {
  if (!req.session.tokenMgr) {
    res.status(401).end('Unauthorized');
    return;
  }
  res.end(JSON.stringify(jwt_decode(req.session.tokenMgr.accessToken!)));
});

app.listen(environment.port, () => {
  console.log(`🚀 Server is running at http://localhost:${environment.port}`);
});

// if (module.hot) {
//   module.hot.accept();
//   module.hot.dispose(() => server.stop());
// }