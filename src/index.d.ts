import { TokenManager } from './tokenRepository';

declare module 'express-session' {
  interface SessionData {
    tokenMgr: TokenManager;
  }
}

declare module 'http-proxy-middleware'
