import {
  Entity,
  Metadata,
  MetadataInput,
  MediaFile,
  Relation,
  EntitiesResults,
  RelationType,
  EntityInfo,
  BoxVisiter,
  RelationInput,
  MediaFileInput,
  Collections,
  EntityTypes,
} from './type-defs';
import { Context } from './types';
import { environment as env } from './environment';
import { setIdAs_Key, setIdsAs_Key } from './common';
import { AuthRESTDataSource } from 'inuits-apollo-server-auth';
import {
  createBaseEntity,
  minimalEntity,
  setIdAndObjectId,
  setObjectIdToEntity,
} from './parsers/entities';
import { SKIP_RELATIONS } from './sources/constants';

export class EntitiesAPI extends AuthRESTDataSource<Context> {
  public baseURL = `${env.api.collectionAPIUrl}/`;

  async getBoxEntities(): Promise<EntitiesResults> {
    let data = await this.get(`entities?type=box`);
    data = setIdsAs_Key(data);
    return data;
  }

  async getStories(): Promise<EntitiesResults> {
    let data = await this.get(`entities?type=story&limit=20&skip=0`);
    data = setIdsAs_Key(data);
    return data;
  }

  async createEntity(entityInfo: EntityInfo): Promise<Entity> {
    const entityBody = createBaseEntity(
      entityInfo.type,
      entityInfo.title,
      entityInfo.description
    );
    let data = await this.post(`entities`, JSON.parse(entityBody));
    data = setIdAs_Key(data) as Entity;
    data = setObjectIdToEntity(data);
    return data;
  }

  // async getEntity(id: string, _collection: Collections = Collections.Entities, _skipRelations: 1 | 0 = 0): Promise<Entity> {
  //   let data = await this.get<Entity>(_collection + (id ? '/' + id : '') + `?${SKIP_RELATIONS}=${_skipRelations}`);
  async getEntity(id: string, _collection: Collections = Collections.Entities): Promise<Entity> {
    let data = await this.get<Entity>(_collection + (id ? '/' + id : ''));
    // setId(data);
    // data = setIdAs_Key(data) as Entity;
    data = setIdAndObjectId(data);
    return data;
  }

  async getRelations(
    id: string,
    _collection: 'entities' | 'box_visits' = 'entities'
  ): Promise<Relation[]> {
    return await this.get(`${_collection}/${id}/relations/all`);
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

  async getMediafiles(id: string, _public: boolean = true): Promise<MediaFile[]> {
    if (id !== 'noid') {
      const mediafiles = await this.get(`entities/${id}/mediafiles${_public === true ? '' : '?non_public=1'}`);
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
      return (mediafile = await this.get(`mediafiles/${id}`));
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

  async getMetadata(id: String): Promise<Metadata[]> {
    return await this.get(`entities/${id}/metadata`);
  }

  async getRelationOfType(
    _id: string,
    _type: RelationType
  ): Promise<Array<Relation>> {
    const relations = await this.getRelations(_id);
    return relations.filter((_relation) => _relation.type == _type);
  }

  async getEntitiesOfRelationIds(
    _relationIds: Array<string>
  ): Promise<Array<Entity>> {
    const entities: Array<Entity> = [];
    if (_relationIds.length > 0) {
      for (const _id of _relationIds) {
        let id = _id;
        if (!id.includes('mediafiles/')) {
          if (id.includes('entities/')) {
            id = id.replace('entities/', '');
          }
          try {
            const entity = await this.getEntity(id);
            entities.push(entity);
          } catch (error) {
            console.error(`Couldn't find an entity with id: ${_id}`);
          }
        }
      }
    }
    return entities;
  }

  async replaceRelations(
    _entityId: string,
    _relations: Array<Relation>
  ): Promise<Array<Relation>> {
    const newRelations = await this.put(
      `entities/${_entityId}/relations`,
      _relations
    ).catch((error) => console.log(`\n\n ERROR ON REPLACE RELATIONS`, error));
    return newRelations;
  }

  async addRelation(
    _entityId: string,
    _entityRelation: Relation,
    _collection: 'entities' | 'box_visits' = 'entities'
  ): Promise<Array<Relation>> {
    const relationsOfEntity = await this.patch(
      `${_collection}/${_entityId}/relations`,
      [_entityRelation]
    ).catch((error) => {
      console.log(`\n\n error from addrelation`, error);
    });
    return relationsOfEntity;
  }

  async deleteRelations(_entityId: string, relationsToRemove: RelationInput[]) {
    const result = await this.delete(
      `entities/${_entityId}/relations`,
      undefined,
      {
        body: JSON.stringify(relationsToRemove),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return result;
  }

  async deleteEntity(_id: string, _collection: Collections = Collections.Entities): Promise<string> {
    await this.delete(`${_collection}/${_id}`);
    return `Deleted entity with id ${_id} from collection: ${_collection}`;
  }

  async addUpdateProperty(
    _id: string,
    _property: keyof Entity | keyof BoxVisiter,
    _value: string | number,
    _collection: 'entities' | 'box_visits' = 'entities'
  ): Promise<Entity | BoxVisiter> {
    const obj = {} as any;
    obj[_property] = _value;
    const result = await this.patch(`${_collection}/${_id}`, obj);
    return result;
  }

  async createMediafile(_mediafile: MediaFileInput): Promise<MediaFile> {
    let mediafile = await this.post(`${Collections.Mediafiles}`, _mediafile)
    return mediafile
  }

  async createFullEntity(_type: EntityTypes, _metadata: Array<Metadata>, _relations: Array<Relation>, _objectId?: string): Promise<Entity | null> {
    let entityTemplate = minimalEntity(_type) as unknown as Entity
    _objectId ? entityTemplate.object_id = _objectId : null
    let entity = await this.post(Collections.Entities, entityTemplate);
    let relations: null | Array<Relation> = null
    let metadata: null | Array<Metadata> = null
    if (entity) {
      entity = setIdAs_Key(entity)
      Promise.allSettled([
        _relations.length >= 1 ? relations = await this.replaceRelations(entity.id!, _relations) : null,
        _metadata.length >= 1 ? metadata = await this.replaceMetadata(entity.id!, _metadata as Array<MetadataInput>) : null,
      ])
    }
    return entity
  }

  async addMediafilesToEntity(_entityId: string, _mediafile: MediaFile): Promise<Array<MediaFile>> {
    let mediafiles = await this.post(`${Collections.Entities}/${_entityId}/mediafiles`, _mediafile);
    return mediafiles
  }

  async getSixthCollection() {
    return await this.get(`${Collections.Entities}/sixthcollection/id`)
  }
}
