import {
  Entity,
  Metadata,
  MetadataInput,
  MediaFile,
  Relation,
  EntitiesResults,
} from './type-defs';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
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

  async getComponents(id: string): Promise<Relation[]> {
    return await this.get(`entities/${id}/components`);
  }

  /*async getMediafiles(id: string): Promise<MediaFile[]> {
    return await this.get(`entities/${id}/mediafiles`);
  }*/

  async getMediafiles(id: string): Promise<MediaFile[]> {
    if (id !== 'noid') {
      const mediafiles = await this.get(`entities/${id}/mediafiles`);
      // a Set to track seen mediafiles
      const seen = new Set();

      const filtered = mediafiles.filter((mediafile: MediaFile) => {
        // check if the current mediafile is a duplicate
        const isDuplicate: boolean = seen.has(mediafile.filename);
        // add the current brand to the Set
        seen.add(mediafile.filename);
        // filter() returns the brand when isDuplicate is false
        return (
          !isDuplicate &&
          mediafile.filename &&
          !mediafile.filename.endsWith('CR1') &&
          !mediafile.filename.endsWith('CR2') &&
          !mediafile.filename.endsWith('CR3')
        );
      });

      return filtered;
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
