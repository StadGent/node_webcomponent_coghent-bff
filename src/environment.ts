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
    storageAPIUrl: string;
    collectionAPIUrl: string;
    searchAPIUrl: string;
    IiifAPIUrl: string;
  };
  webPortal: string;
  boxFrontend: string;
  staticToken: string | false;
  redisHost: string | false;
  redisPort: string | false;
  activeBoxEntity: string;
  maxStories: number | string;
  codePostfix: string;
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
    storageAPIUrl:
      process.env.STORAGE_API_URL || 'http://storage-api:8001',
    searchAPIUrl: process.env.SEARCH_API_URL || 'http://search-api:8002',
    IiifAPIUrl: process.env.IIIF_API_URL || 'http://cantaloupe:8182',
  },
  webPortal: process.env.WEB_PORTAL_URL || 'http://localhost:8070',
  boxFrontend: process.env.BOX_FRONTEND_URL || 'http://localhost:8071',
  staticToken: process.env.STATIC_TOKEN || false,
  redisHost: process.env.REDIS_HOST || false,
  redisPort: process.env.REDIS_PORT || false,
  activeBoxEntity: process.env.BOX_ENTITY || 'c0a577c6-071b-4051-bad8-4f4fbe40537b',
  maxStories: process.env.BOX_MAX_STORIES || 4,
  codePostfix: process.env.BOX_CODE_POSTFIX || 'visit',
};
