import { AuthRESTDataSource } from 'inuits-apollo-server-auth';
import { Context } from './types';
import { environment as env } from './environment';
import {
  Entity,
  EntityInfo,
  MetaKey,
  Publication,
  Relation,
  RelationType,
  StatusKey,
} from './type-defs';
import { setIdAs_Key } from './common';
import { createBaseEntity, setObjectIdToEntity } from './parsers/entities';
import { EntitiesAPI } from './entities';
import { createRelationTypeFromData } from './parsers/storybox';

export class TestimoniAPI extends EntitiesAPI {
  public baseURL = `${env.api.collectionAPIUrl}/`;

  async createTestimoni(entityInfo: EntityInfo): Promise<Entity> {
    const testimoniBody = JSON.parse(
      createBaseEntity(
        entityInfo.type,
        entityInfo.title,
        entityInfo.description
      )
    );
    const testimoniSpecificMetadata = [
      {
        key: MetaKey.PublicationStatus,
        value: Publication.Public,
        lang: 'en',
      },
      {
        key: MetaKey.Likes,
        value: 1,
        lang: 'en',
      },
      {
        key: MetaKey.Date,
        value: new Date().toISOString(),
        lang: 'en',
      },
    ];
    testimoniBody.metadata.push(...testimoniSpecificMetadata);
    let data = await this.post(`entities`, testimoniBody);
    data = setIdAs_Key(data) as Entity;
    data = setObjectIdToEntity(data);
    return data;
  }

  async linkTestimoniWithAsset(
    assetId: string,
    testimoniId: string
  ): Promise<Relation[]> {
    const relation = createRelationTypeFromData(
      RelationType.Testimoni,
      testimoniId,
      'entities/'
    );
    console.log({ relation });
    return await this.addRelation(assetId, relation);
  }
}
