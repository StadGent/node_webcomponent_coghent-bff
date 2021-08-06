const defaultPort = 4002;

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
  sessionSecret: process.env.APOLLO_SESSION_SECRET || '',
  clientSecret: process.env.APOLLO_CLIENT_SECRET || '',
  oauthBaseUrl: process.env.OAUTH_BASE_URL || 'http://keycloak:8080/auth/realms/dams/',
};
