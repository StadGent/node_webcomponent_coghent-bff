import { addTimingsToRelation, createRelationOfId } from '../resolvers/relationMetadata';
import { Metadata, MetaKey, Relation, RelationType, StoryboxBuild } from '../type-defs';

export const createTimingForAsset = (_startTime: number, _duration: number) => {
  let timing: Record<'start' | 'zoom' | 'end', number> = {
    "start": _startTime,
    "zoom": _startTime + 1,
    "end": _startTime + 1 + _duration,
  };
  return timing
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