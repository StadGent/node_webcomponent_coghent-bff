import { Collections, Relation } from '../type-defs';

type SortedRelations = {
  entities: Array<Relation>,
  mediafiles: Array<Relation>,
}



export const sortRelationsInEntitiesAndMediafiles = (_relations: Array<Relation>): SortedRelations => {

  return {
    entities: _relations.filter(relation => relation.key.includes(Collections.Entities)),
    mediafiles: _relations.filter(relation => relation.key.includes(Collections.Mediafiles))
  }
}