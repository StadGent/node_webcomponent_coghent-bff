import { setIdAs_Key } from '../common';
import { addTimingsToRelation, createRelationOfId } from '../resolvers/relationMetadata';
import { Entity, Metadata, MetaKey, Relation, RelationType, StoryboxBuild } from '../type-defs';

export const createTimingForAsset = (_startTime: number, _duration: number) => {
  let timing: Record<'start' | 'zoom' | 'end', number> = {
    "start": _startTime,
    "zoom": _startTime + 1,
    "end": _startTime + 1 + _duration,
  };
  return timing
}

export const createRelationTiming = (_startTime: number, _duration: number): Relation => {
  const timing = createTimingForAsset(_startTime, _duration)
  return {
    timestamp_start: timing.start,
    timestamp_zoom: timing.zoom,
    timestamp_end: timing.end,
  } as Relation
}

export const createRelationsOfStorybox = (_storyboxBuild: StoryboxBuild) => {
  let time = 1;
  const relations: Array<Relation> = []
  for (const _asset of _storyboxBuild.assetTimings!) {
    const relation = createRelationOfId(_asset?.key!, RelationType.Components)
    const timing = createTimingForAsset(time, Number(_asset?.value))
    const relationWithTimings = addTimingsToRelation(relation, timing)
    relations.push(relationWithTimings)
    time = timing.end + 1
  }
  return relations
}

export const createMetadataTypeFromData = (_type: MetaKey, _value: string) => {
  return { key: _type, value: _value !== null ? _value : '' } as Metadata
}

export const updateMetadataField = (_type: MetaKey, _value: string, _metadata: Array<Metadata>) => {
  const updateMetadata: Array<Metadata> = _metadata
  const found = _metadata.find((_meta: Metadata) => _meta.key === _type)
  if (found) {
    const indexToDelete = _metadata.indexOf(found)
    if (indexToDelete != -1) {
      updateMetadata.splice(indexToDelete, 1)
    }

  }
  updateMetadata.push(createMetadataTypeFromData(_type, _value))
  return updateMetadata
}

export const createRelationTypeFromData = (_type: RelationType, _key: string, _keyPrefix: `entities/`) => {
  return {
    type: _type, key: `${_keyPrefix}${_key}`
  } as Relation
}

export const setObjectIdToCustomStorybox = (_entity: Entity) => {
  _entity.object_id = `customStory-${_entity.id}`
  return _entity
}

export const setIdAndCustomObjectId = (_entity: Entity) => {
  _entity = setIdAs_Key(_entity) as Entity;
  _entity = setObjectIdToCustomStorybox(_entity)
  return _entity
}