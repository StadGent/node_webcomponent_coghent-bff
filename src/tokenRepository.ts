import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import jwt_decode from 'jwt-decode';

import { environment } from './environment';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  tokenEndpoint: string;
  redirectUri: string;
}

export interface AuthBody {
  code: string;
  grant_type: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface RefreshBody {
  grant_type: string;
  client_id: string;
  refresh_token: string;
  oidc_url: string;
}

export interface TokenUser {
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
}

export class TokenManager {
  accessToken?: string;
  refreshToken?: string;

  constructor(private clientId: string, private tokenEndpoint: string) {}

  async authenticate(authCode: string, redirectUri: string) {
    const res = await fetch(
      `${environment.oauthBaseUrl}${this.tokenEndpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: this.clientId,
          client_secret: environment.clientSecret,
          redirect_uri: redirectUri,
        }),
      }
    );
    const data = (await res.json()) as TokenResponse;
    if (!data.access_token || !data.refresh_token) {
      throw new Error('Invalid response from OpenID server');
    }
    jwt_decode(data.access_token);
    jwt_decode(data.refresh_token);
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
  }

  async refresh(): Promise<TokenResponse> {
    const res = await fetch(
      `${environment.oauthBaseUrl}${this.tokenEndpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken ?? '',
          client_id: this.clientId,
          oidc_url: this.tokenEndpoint,
        }),
      }
    );
    return (await res.json()) as TokenResponse;
  }
}
