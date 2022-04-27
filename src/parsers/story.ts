import { Relation, RelationType } from '../type-defs';

export const sortRelationmetadataOnTimestampStart = (_components: Array<Relation>) => {
  let sortedComponents = []
  const componentsWithoutStartTimestamp = _components.filter(_component => !_component.timestamp_start || _component.timestamp_start === null)
  let componentsWithStartTimestamp = _components.filter(_component => _component.timestamp_start && _component.timestamp_start != null)
  componentsWithStartTimestamp = componentsWithStartTimestamp.sort((a: Relation, b: Relation) => { return Number(a.timestamp_start) - Number(b.timestamp_start) });
  sortedComponents = [...componentsWithStartTimestamp, ...componentsWithoutStartTimestamp]
  sortedComponents = filterOutRelationsofType(sortedComponents, RelationType.Stories)
  return sortedComponents
}

const filterOutRelationsofType = (_relations: Array<Relation>, _type: RelationType) => {
  return _relations.filter(relation => relation.type != _type)
}