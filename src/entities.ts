import {
  Entity,
  Metadata,
  MetadataInput,
  MediaFile,
  Relation,
  EntitiesResults,
  RelationType,
} from './type-defs';
import { Context } from './types';
import { environment as env } from './environment';
import { setIdAs_Key, setIdsAs_Key } from './common';
import { AuthRESTDataSource } from 'inuits-apollo-server-auth';

export class EntitiesAPI extends AuthRESTDataSource<Context> {
  public baseURL = `${env.api.collectionAPIUrl}/`;

  async getBoxEntities(): Promise<EntitiesResults> {
    let data = await this.get(`entities?type=box`);
    data = setIdsAs_Key(data)
    return data;
  }

  async getStories(): Promise<EntitiesResults> {
    let data = await this.get(`entities?type=story&limit=20&skip=0`);
    data = setIdsAs_Key(data)
    return data;
  }

  async getEntity(id: string): Promise<Entity> {
    let data = await this.get<Entity>('entities' + (id ? '/' + id : ''));
    // setId(data);
    data = setIdAs_Key(data) as Entity;
    return data;
  }

  async getRelations(id: string): Promise<Relation[]> {
    return await this.get(`entities/${id}/relations/all`);
  }

  async getEntityRelations(id: string): Promise<Relation[]> {
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

  async getRelationOfType(_id: string, _type: RelationType): Promise<Array<Relation>> {
    const relations = await this.getRelations(_id)
    return relations.filter(_relation => _relation.type == _type)
  }

  async getEntitiesOfRelationIds(_relationIds: Array<string>): Promise<Array<Entity>> {
    const entities: Array<Entity> = []
    if (_relationIds.length > 0) {
      for (const _id of _relationIds) {
        let id = _id
        if (id.includes('entities/')) {
          id = id.replace('entities/', '')
        }
        try {
          const entity = await this.getEntity(id)
          entities.push(entity)
        } catch (error) {
          console.error(`Couldn't find an entity with id: ${_id}`)
        }
      }
    }
    return entities
  }

  async replaceRelations(_entityId: string, _relations: Array<Relation>): Promise<Array<Relation>> {
    const newRelations = await this.put(`entities/${_entityId}/relations`, _relations).catch(error => console.log(`\n\n ERROR ON REPLACE RELATIONS`, error))
    return newRelations
  }

  async addRelation(_entityId: string, _entityRelation: Relation): Promise<Array<Relation>> {
    const relationsOfEntity = await this.patch(`entities/${_entityId}/relations`, [_entityRelation]).catch(error => { console.log(`\n\n error from addrelation`,error)})
    return relationsOfEntity
  }
}
