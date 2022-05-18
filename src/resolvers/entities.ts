import { filterByRelationTypes } from '../parsers/entities';
import { RelationType } from '../type-defs';
import { DataSources } from '../types';

export const getBasketEntityRelationsAsEntities = async (_code: string, _dataSources: DataSources) => {
  let relations = await _dataSources.BoxVisitersAPI.getRelations(_code);
  relations = filterByRelationTypes(relations, [RelationType.InBasket]).reverse();
  return await _dataSources.EntitiesAPI.getEntitiesOfRelationIds(relations.map(relation => relation.key));
}