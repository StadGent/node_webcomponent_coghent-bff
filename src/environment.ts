const defaultPort = 4000;

interface Environment {
  apollo: {
    graphqlPath: string;
    introspection: boolean;
    playground: boolean;
  };
  port: number | string;
  sessionSecret: string;
  clientSecret: string;
  oauthBaseUrl: string;
  api: {
    collectionAPIUrl: string;
    searchAPIUrl: string;
  };
  webPortal: string;
  boxFrontend: string;
}

export const environment: Environment = {
  apollo: {
    graphqlPath: process.env.APOLLO_GRAPHQL_PATH || '/api/graphql',
    introspection: process.env.APOLLO_INTROSPECTION === 'true',
    playground: process.env.APOLLO_PLAYGROUND === 'true',
  },
  port: process.env.PORT || defaultPort,
  sessionSecret: process.env.APOLLO_SESSION_SECRET || 'heelgeheim',
  clientSecret:
    process.env.APOLLO_CLIENT_SECRET || '445cac0c-101f-4916-8cb2-dade093d38a7',
  oauthBaseUrl:
    process.env.OAUTH_BASE_URL || 'http://localhost:8080/auth/realms/dams',
  api: {
    collectionAPIUrl:
      process.env.COLLECTION_API_URL || 'http://collection-api:8000',
    searchAPIUrl: process.env.SEARCH_API_URL || 'http://search-api:8002',
  },
  webPortal: process.env.WEB_PORTAL_URL || 'http://localhost:8070',
  boxFrontend: process.env.BOX_FRONTEND_URL || 'http://localhost:8071',
};
