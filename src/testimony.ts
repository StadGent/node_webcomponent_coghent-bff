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
import {
  createBaseEntity,
  getMetadataOfKey,
  setObjectIdToEntity,
} from './parsers/entities';
import { EntitiesAPI } from './entities';
import { createRelationTypeFromData } from './parsers/storybox';

export class TestimonyAPI extends EntitiesAPI {
  public baseURL = `${env.api.collectionAPIUrl}/`;

  async createTestimony(entityInfo: EntityInfo): Promise<Entity> {
    const testimonyBody = JSON.parse(
      createBaseEntity(
        entityInfo.type,
        entityInfo.title,
        entityInfo.description
      )
    );
    const testimonySpecificMetadata = [
      {
        key: MetaKey.PublicationStatus,
        value: Publication.Public,
        lang: 'en',
      },
      {
        key: MetaKey.Likes,
        value: '0',
        lang: 'en',
      },
      {
        key: MetaKey.Date,
        value: new Date().toISOString(),
        lang: 'en',
      },
    ];
    testimonyBody.metadata.push(...testimonySpecificMetadata);
    let data = await this.post(`entities`, testimonyBody);
    data = setIdAs_Key(data) as Entity;
    data = setObjectIdToEntity(data);
    return data;
  }

  async linkTestimonyWithAsset(
    assetId: string,
    testimonyId: string
  ): Promise<Relation[]> {
    const relation = createRelationTypeFromData(
      RelationType.HasTestimony,
      testimonyId,
      'entities/'
    );
    const backwardsRelation = createRelationTypeFromData(
      RelationType.IsTestimonyFor,
      assetId,
      'entities/'
    );
    console.log(backwardsRelation);
    await this.addRelation(testimonyId, backwardsRelation);
    return await this.addRelation(assetId, relation);
  }

  async getTestimoniesByAssetId(assetId: string): Promise<Entity[]> {
    try {
      const testimonyRelations = await this.getRelationOfType(
        assetId,
        RelationType.HasTestimony
      );
      const testimonyIds = testimonyRelations.map((rel: Relation) =>
        rel.key.replace('entities/', '')
      );
      const allTestimonies = await this.getEntitiesOfRelationIds(testimonyIds);
      console.log('All Testimonies');
      console.log(allTestimonies);
      const publicTestimonies = allTestimonies.filter(
        (testimony: Entity) =>
          getMetadataOfKey(testimony, MetaKey.PublicationStatus)?.value ==
          Publication.Public
      ) as Entity[];
      return publicTestimonies;
    } catch (er) {
      console.log(er);
      return [];
    }
  }
}
