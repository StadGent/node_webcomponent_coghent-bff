const defaultPort = 4000;

interface Environment {
  apollo: {
    introspection: boolean;
    playground: boolean;
  };
  port: number | string;
  sessionSecret: string;
  clientSecret: string;
  oauthBaseUrl: string;
}

export const environment: Environment = {
  apollo: {
    introspection: process.env.APOLLO_INTROSPECTION === 'true',
    playground: process.env.APOLLO_PLAYGROUND === 'true',
  },
  port: process.env.PORT || defaultPort,
  sessionSecret: process.env.APOLLO_SESSION_SECRET || 'heelgeheim',
  clientSecret:
    process.env.APOLLO_CLIENT_SECRET || '445cac0c-101f-4916-8cb2-dade093d38a7',
  oauthBaseUrl:
    process.env.OAUTH_BASE_URL || 'http://localhost:8080/auth/realms/dams/',
};
