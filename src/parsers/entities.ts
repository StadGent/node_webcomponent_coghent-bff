import { Relation, RelationType } from '../type-defs';

export const filterByRelationTypes = (_relations: Array<Relation>, _types:Array<RelationType>) => {
  let relations: Array<Relation>;
  if(_relations.length > 0 && _types.length > 0){
    relations =_relations.filter(_relation => _types.includes(_relation.type))
  }else{
    relations = _relations
  }
  return relations
}