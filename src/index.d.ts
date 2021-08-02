import { TokenManager } from './tokenRepository';

declare module 'express-session' {
  interface SessionData {
    tokenMgr: TokenManager;
  }
}
