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
import { UserInputError } from 'apollo-server-errors';

export class EntitiesAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${env.api.collectionAPIUrl}/`;

  async createBoxVisitor(): Promise<Entity> {
    const model = `{
      "data": {},
      "id": "5c5812e2-7e42-4a28-8791-4cd67318d9ef
        ",
        "identifiers": [
          "5c5812e2-7e42-4a28-8791-4cd67318d9ef"
      ],
      "metadata": [
          {
              "key": "type",
              "value": "visitor",
              "language": "en"
          },
          {
              "key": "QRCode",
              "value": "23197897832786123",
              "language": "en"
          }
      ],
      "type": "box_visit",
  }`;
    let visiter;
    try {
      visiter = await this.post(`entities`, JSON.parse(model));
      visiter = setId(visiter);
      console.log(`CREATED BOX VISITER`, visiter);
    } catch (error) {
      throw new UserInputError(`${error}`);
    }
    return visiter;
  }

  async getBoxVisitors(): Promise<EntitiesResults> {
    const visiters = await this.get<EntitiesResults>(`entities?type=box_visit`);
    visiters.results?.forEach(entity => setId(entity))
    return visiters;
  }

  async addFrameToVister(visterId: string, frameId: string): Promise<Array<Relation>> {
    const body = `[
      {
        "key": "entities/${frameId}",
        "type": "components",
        "date": "${new Date().toLocaleString()}"
      }
    ]`;
    let relations: Array<Relation> = [];
    try {
      relations = await this.patch(`entities/${visterId}/components`, JSON.parse(body))
    } catch (error) {
      console.log({ error });
    }
    return relations;
  }

  async getStories(): Promise<EntitiesResults> {
    const data = await this.get(`entities?type=story&limit=20&skip=0`);
    data.results.forEach((_entity: Entity) => setId(_entity));
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

  async getMediafilesById(id: string): Promise<MediaFile> {
    let mediafile: MediaFile = {} as MediaFile;
    try {
      return mediafile = await this.get(`mediafiles/${id}`);
    } catch (error) {
      console.log(error);
    }
    return mediafile;
  }

  async replaceMetadata(
    id: String,
    metadata: MetadataInput[]
  ): Promise<Metadata[]> {
    return await this.put(`entities/${id}/metadata`, metadata);
  }
}
