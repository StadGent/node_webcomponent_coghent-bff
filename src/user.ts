import {
  EntitiesResults,
  Entity,
  User
} from './type-defs'
import { AuthRESTDataSource, getMe } from 'inuits-apollo-server-auth';
import { RESTDataSource } from 'apollo-datasource-rest';
import { Context } from './types';

export class UserAPI extends AuthRESTDataSource<Context> {
  //public baseURL = 'http://coghent-graphql:4002/';

  getMe(accessToken: string): User {
    const data: any = getMe(accessToken)
    const user: User = {
      id: data.sub,
      email: data.email,
      family_name: data.family_name,
      given_name: data.given_name,
      name: data.name,
      preferred_username: data.preferred_username
    }
    return user;
  }

  async myUploads(): Promise<EntitiesResults> {
    return {}
  }
}