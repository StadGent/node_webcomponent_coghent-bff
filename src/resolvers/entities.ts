import { setEntitiesIdPrefix } from '../common';
import { EntityData, filterByRelationTypes, getMetadataOfKey } from '../parsers/entities';
import { Collections, EntityTypes, Metadata, MetaKey, Relation, RelationType } from '../type-defs';
import { DataSources } from '../types';

export const getBasketEntityRelationsAsEntities = async (_code: string, _dataSources: DataSources) => {
  let relations = await _dataSources.BoxVisitersAPI.getRelations(_code);
  relations = filterByRelationTypes(relations, [RelationType.InBasket]).reverse();
  return await _dataSources.EntitiesAPI.getEntitiesOfRelationIds(relations.map(relation => relation.key));
}

export const getEntityData = async (_id: string, _dataSources: DataSources): Promise<EntityData> => {
  // const entity = await _dataSources.EntitiesAPI.getEntity(_id)
  const metadata = await _dataSources.EntitiesAPI.getMetadata(_id)
  const relations = await _dataSources.EntitiesAPI.getEntityRelations(_id)
  return {
    // entity: entity,
    metadata: metadata,
    relations: relations
  }
}

export const setRelationValueToDefaultTitleOrFullname = async (_relations: Array<Relation>, _dataSources: DataSources) => {
  const transformedRelations: Array<Relation> = []
  for (const relation of _relations) {
    let updated = relation
    if (relation.value === undefined) {
      const entity = await _dataSources.EntitiesAPI.getEntity(setEntitiesIdPrefix(relation.key))
      switch (entity.type) {
        case EntityTypes.Person:
          const metaPerson = getMetadataOfKey(entity, MetaKey.Fullname)
          metaPerson ? updated.value = metaPerson.value : updated.value = 'label'
          break;
        default:
          const metaDefault = getMetadataOfKey(entity, MetaKey.Title)
          metaDefault ? updated.label = metaDefault.value : updated.label = 'label'
          break;
      }
    }
    transformedRelations.push(updated)
  }
}