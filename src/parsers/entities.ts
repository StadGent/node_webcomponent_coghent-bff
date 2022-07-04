import { setIdAs_Key } from '../common';
import {
  Entity,
  EntityTypes,
  Metadata,
  MetaKey,
  Relation,
  RelationType,
} from '../type-defs';

export const filterByRelationTypes = (
  _relations: Array<Relation>,
  _types: Array<RelationType>
) => {
  let relations: Array<Relation>;
  if (_relations.length > 0 && _types.length > 0) {
    relations = _relations.filter((_relation) =>
      _types.includes(_relation.type)
    );
  } else {
    relations = _relations;
  }
  return relations;
};

export const setObjectIdToEntity = (_entity: Entity) => {
  _entity.object_id ? null : _entity.object_id = `${_entity.id}`;
  return _entity;
};

export const createBaseEntity = (
  _type: EntityTypes,
  _title: string,
  _description: string
) => {
  const body = `{
    "type": "${_type}",
    "metadata": [
        {
            "key": "title",
            "value": "${_title}",
            "language": "en"
        },
        {
            "key": "description",
            "value": "${_description}",
            "language": "en"
        }
    ],
    "data": {}
}`;
  return body;
};

export const createEntityBody = (
  _type: EntityTypes,
  _title: string,
  _description: string
) => {
  const body = `{
    "type": "${_type}",
    "metadata": [
        {
            "key": "type",
            "value": "frame",
            "language": "en"
        },
        {
            "key": "title",
            "value": "${_title}",
            "language": "en"
        },
        {
            "key": "description",
            "value": "${_description}",
            "language": "en"
        }
    ],
    "data": {}
}`;
  return body;
};

export const mergeRelations = (
  _originalRelations: Array<Relation>,
  _newRelations: Array<Relation>
) => {
  let mergedrelations = _originalRelations;
  for (const updatedRelation of _newRelations) {
    const found = _originalRelations.find(
      (_rel) =>
        _rel.key === updatedRelation.key && _rel.type === updatedRelation.type
    );
    if (found) {
      const index = mergedrelations.indexOf(found);
      Object.assign(mergedrelations[index], updatedRelation);
    } else mergedrelations.push(updatedRelation);
  }
  return mergedrelations;
};

export const filterOutRelationTypes = (
  _relations: Array<Relation>,
  _types: Array<RelationType>
) => {
  const otherRelations = [];
  for (const relation of _relations) {
    if (!_types.includes(relation.type)) otherRelations.push(relation);
  }
  return otherRelations;
};

export const setIdAndObjectId = (_entity: Entity) => {
  _entity = setIdAs_Key(_entity) as Entity;
  _entity = setObjectIdToEntity(_entity)
  return _entity
}

export const getMetadataOfKey = (_entity: Entity, _type: MetaKey): Metadata | null => {
  const found = _entity.metadata.find(meta => meta?.key === _type)
  return found ? found : null
}
