import {
  Entity,
  Metadata,
  MetadataInput,
  MediaFile,
  Relation,
  EntitiesResults,
} from './type-defs';
import { RESTDataSourceWithStaticToken } from './RESTDataSourceWithStaticToken';
import { Context } from './types';
import { environment as env } from './environment';
import { setId } from './common';

export class EntitiesAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${env.api.collectionAPIUrl}/`;

  async getStories(): Promise<EntitiesResults> {
    const data = await this.get(`entities?type=story&limit=20&skip=0`);
    return data;
  }

  async getEntity(id: string): Promise<Entity> {
    const data = await this.get<Entity>('entities' + (id ? '/' + id : ''));
    setId(data);
    return data;
  }

  async getRelations(id: string): Promise<Relation[]> {
    return await this.get(`entities/${id}/relations`);
  }

  /*async getMediafiles(id: string): Promise<MediaFile[]> {
    return await this.get(`entities/${id}/mediafiles`);
  }*/

  async getMediafiles(id: string): Promise<MediaFile[]> {
    if (id !== 'noid') {
      return await this.get(`entities/${id}/mediafiles`);
    } else {
      return [];
    }
  }

  async replaceMetadata(
    id: String,
    metadata: MetadataInput[]
  ): Promise<Metadata[]> {
    return await this.put(`entities/${id}/metadata`, metadata);
  }
}
