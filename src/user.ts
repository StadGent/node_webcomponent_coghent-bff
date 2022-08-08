import {
  Collections,
  EntitiesResults,
  Entity,
  MediafilesResults,
  User
} from './type-defs'
import { AuthRESTDataSource, getMe } from 'inuits-apollo-server-auth';
import { RESTDataSource } from 'apollo-datasource-rest';
import { Context } from './types';
import { environment as _ } from './environment';
import { setIdsAs_Key } from './common';

export class UserAPI extends AuthRESTDataSource<Context> {
  public baseURL = `${_.api.collectionAPIUrl}/`;

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

  async myMediafileUploads(): Promise<MediafilesResults> {
    let files = await this.get(Collections.Mediafiles)
    files = setIdsAs_Key(files) as MediafilesResults
    return files
  }

  async myAssetCreations(): Promise<EntitiesResults> {
    let files = null
    try {
      files = await this.get(Collections.Entities)
      files = setIdsAs_Key(files) as EntitiesResults
    } catch (error) {
      files.results = []
      files.count = 0
    }

    return files
  }
}