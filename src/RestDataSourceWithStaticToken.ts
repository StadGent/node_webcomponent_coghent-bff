import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
import { environment } from './environment';

export class RESTDataSourceWithStaticToken<T> extends RESTDataSource<T> {
  willSendRequest(request: RequestOptions) {
    if (environment.staticToken) {
      request.headers.set('Authorization', environment.staticToken);
    }
  }
}
