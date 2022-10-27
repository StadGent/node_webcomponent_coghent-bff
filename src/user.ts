import {
  Collections,
  EntitiesResults,
  Entity,
  MediafilesResults,
  User,
} from './type-defs';
import { AuthRESTDataSource, getMe } from 'inuits-apollo-server-auth';
import { Context } from './types';
import { environment as _ } from './environment';
import { setIdsAs_Key } from './common';

export class UserAPI extends AuthRESTDataSource<Context> {
  public baseURL = `${_.api.collectionAPIUrl}/`;

  getMe(accessToken: string): User {
    const data: any = getMe(accessToken);
    const user: User = {
      id: data.sub,
      email: data.email,
      family_name: data.family_name,
      given_name: data.given_name,
      name: data.name,
      preferred_username: data.preferred_username,
    };
    return user;
  }

  async myMediafileUploads(): Promise<MediafilesResults> {
    let files = await this.get(Collections.Mediafiles);
    files = setIdsAs_Key(files) as MediafilesResults;
    return files;
  }

  async myAssetCreations(limit: number | null = 10): Promise<EntitiesResults> {
    let files = null;
    files = await this.get(
      `${Collections.Entities}?type=asset&only_own=1&limit=${limit}`
    );
    files = setIdsAs_Key(files) as EntitiesResults;
    return files;
  }
}
