import { setEntitiesIdPrefix } from '../common';
import { getUpdateRelations } from '../parsers/customStory';
import { Entity, RelationType } from '../type-defs'
import { DataSources } from '../types'

export const getCustomFrame = async (_dataSources: DataSources, _id: string) => {
  const storyRelations = await _dataSources.EntitiesAPI.getRelationOfType(_id, RelationType.Frames)
  let frame: null | Entity = null
  if (storyRelations.length === 1) {
    frame = await _dataSources.EntitiesAPI.getEntity(setEntitiesIdPrefix(storyRelations[0].key, false))
  }
  return frame
}

export const updatedRelationsForFrame = async (_dataSources: DataSources, _frameId: string) => {
  const relationsAll = await _dataSources.EntitiesAPI.getRelations(_frameId)
  const updatedRelations = getUpdateRelations(relationsAll)
  await _dataSources.EntitiesAPI.replaceRelations(_frameId, updatedRelations)
}

export const addPositionsToAssets = async (_dataSources: DataSources, _storyId: string) => {
  const frame = await getCustomFrame(_dataSources, _storyId)
  if (frame) {
    await updatedRelationsForFrame(_dataSources, frame.id)
  }
}