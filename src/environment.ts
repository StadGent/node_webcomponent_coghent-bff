const defaultPort = 4000;

type domain = {
  hostname: string;
  port: string;
  prefix?: string;
};

interface Environment {
  apollo: {
    introspection: boolean;
    playground: boolean;
  };
  port: number | string;
  sessionSecret: string;
  clientSecret: string;
  oauthBaseUrl: string;
  entities: domain;
  search_entities: domain;
}

export const environment: Environment = {
  apollo: {
    introspection: process.env.APOLLO_INTROSPECTION === "true",
    playground: process.env.APOLLO_PLAYGROUND === "true",
  },
  port: process.env.PORT || defaultPort,
  sessionSecret: process.env.APOLLO_SESSION_SECRET || "heelgeheim",
  clientSecret:
    process.env.APOLLO_CLIENT_SECRET || "445cac0c-101f-4916-8cb2-dade093d38a7",
  oauthBaseUrl:
    process.env.OAUTH_BASE_URL || "http://localhost:8080/auth/realms/dams/",
  entities: {
    hostname: process.env.ENTITIES_HOSTNAME || "collection-api",
    port: process.env.ENTITIES_PORT || "8000",
  },
  search_entities: {
    hostname: process.env.SEARCH_ENTITIES_HOSTNAME || "search-api",
    port: process.env.SEARCH_ENTITIES_PORT || "8002",
    prefix: process.env.SEARCH_ENTITIES_PREFIX || "search",
  },
};
