import { BodyInit, RequestInit, URLSearchParamsInit } from 'apollo-server-env';
import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
import { AuthenticationError } from 'apollo-server-errors';
import { TokenManager } from './tokenRepository';

type Body = BodyInit | object;
interface WithTokenManager {
  session: {
    tokenMgr: TokenManager;
  }
}

export class AuthRESTDataSource<T extends WithTokenManager> extends RESTDataSource<T> {
  willSendRequest(request: RequestOptions) {
    request.headers.set('Authorization', this.context.session.tokenMgr.accessToken!);
  }

  private withRetry<T extends any[], S, F extends (...args: T) => S>(fn: F, ...args: T): S {
    try {
      return fn(...args);
    } catch (e) {
      if (!(e instanceof AuthenticationError)) throw e;
      this.context.session.tokenMgr.refresh();
      return fn(...args);
    }
  }

  protected async get<TResult = any>(
    path: string, params?: URLSearchParamsInit, init?: RequestInit
  ): Promise<TResult> {
    return this.withRetry(super.get.bind(this), path, params, init)
  }

  protected async post<TResult = any>(
    path: string, body?: Body, init?: RequestInit
  ): Promise<TResult> {
    return this.withRetry(super.post.bind(this), path, body, init)
  }

  protected async patch<TResult = any>(
    path: string, body?: Body, init?: RequestInit
  ): Promise<TResult> {
    return this.withRetry(super.patch.bind(this), path, body, init)
  }

  protected async put<TResult = any>(
    path: string, body?: Body, init?: RequestInit
  ): Promise<TResult> {
    return this.withRetry(super.put.bind(this), path, body, init)
  }

  protected async delete<TResult = any>(
    path: string, params?: URLSearchParamsInit, init?: RequestInit
  ): Promise<TResult> {
    return this.withRetry(super.delete.bind(this), path, params, init)
  }
}
