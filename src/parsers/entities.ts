import { setIdAs_Key } from '../common';
import {
  Collections,
  EntitiesResults,
  Entity,
  EntityTypes,
  Metadata,
  MetaKey,
  Relation,
  RelationType,
} from '../type-defs';

export type EntityData = {
  metadata: Array<Metadata>;
  relations: Array<Relation>;
};

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
  _entity.object_id ? null : (_entity.object_id = `${_entity.id}`);
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

export const minimalEntity = (_type: EntityTypes) => {
  return {
    type: _type,
    metadata: [],
    data: {},
  };
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
            "value": "${_type}",
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
  _entity = setObjectIdToEntity(_entity);
  return _entity;
};

export const getMetadataOfKey = (
  _entity: Entity,
  _type: MetaKey
): Metadata | null => {
  const found = _entity.metadata.find((meta) => meta?.key === _type);
  return found ? found : null;
};

export const hasRelationOfType = (
  _relations: Array<Relation>,
  _type: RelationType
) => {
  const found = _relations.map((relation) => relation.type === _type);
  return found ? found.some((result) => result === true) : false;
};

export const getRelationsFromMetadata = (
  _entity: Entity,
  _type: RelationType
) => {
  let relations: Array<Metadata> = [];
  if (_entity && _entity.metadata.length >= 1) {
    relations = _entity.metadata.filter(
      (_meta) => _meta?.type === _type
    ) as Array<Metadata>;
  }
  return relations;
};

export const mergeMetadata = (
  _originalMetadata: Array<Metadata>,
  _metadata: Array<Metadata>
) => {
  let mergedMetadata = _originalMetadata;
  if (_metadata.length >= 1) {
    for (const updated of _metadata) {
      const found = _originalMetadata.find(
        (_rel) => _rel.key === updated.key && _rel.key === updated.key
      );
      if (found) {
        const index = mergedMetadata.indexOf(found);
        Object.assign(mergedMetadata[index], updated);
      } else mergedMetadata.push(updated);
    }
  }
  return mergedMetadata;
};

export const relationsWithExcludedCollections = (
  _relations: Array<Relation>,
  _excludedCollections: Array<Collections>
) => {
  const relations: Array<Relation> = [];
  for (const relation of _relations) {
    if (relation.key.indexOf(`/`) !== -1) {
      const collection = relation.key.substring(0, relation.key.indexOf('/'));
      let collectionOfType: Collections;
      let key: keyof typeof Collections;
      for (key in Collections) {
        if (Collections[key] === collection) {
          collectionOfType = Collections[key];
          if (!_excludedCollections.includes(collectionOfType)) {
            relations.push(relation);
          }
        }
      }
    }
  }
  return relations;
};

export const filterOnEntityType = (
  _entitiesResults: EntitiesResults,
  _entityTypes: Array<EntityTypes>
) => {
  let updated = {} as EntitiesResults;
  Object.assign(updated, _entitiesResults);
  if (_entitiesResults.results) {
    updated.results = [];

    for (const entity of _entitiesResults.results) {
      if (entity && _entityTypes.includes(entity.type as EntityTypes)) {
        updated.results.push(entity);
      }
    }
  }
  return updated;
};
