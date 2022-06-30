import { setEntitiesIdPrefix, setIdAs_Key } from '../common';
import { calculateScale, calculateSpaceForAssets, Dimension, getUpdateRelations } from '../parsers/customStory';
import { Entity, RelationType } from '../type-defs'
import { DataSources } from '../types'

export const wallFullWidth = 5760
export const wallFullHeight = 1080
export const zones = 6
export const zoneWidth = wallFullWidth / zones
export const PADDING = 30
export const ASSET_MARGIN = 80

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

export const generateAssetScale = async (_dataSources: DataSources, _assetKey: string, availableSpace: Dimension) => {
  let scale = 1;
  const id = setEntitiesIdPrefix(_assetKey, false)
  let asset = await _dataSources.EntitiesAPI.getEntity(id)

  asset = setIdAs_Key(asset) as Entity

  if (asset.primary_height && asset.primary_width) {
    scale = await calculateScale(Number(asset.primary_width), Number(asset.primary_height), availableSpace)
  }
  return scale
}

export const addScaleToAssets = async (_dataSources: DataSources, _frameId: string) => {
  const relationComponents = await _dataSources.EntitiesAPI.getRelationOfType(_frameId, RelationType.Components)
  if (relationComponents) {
    const space = calculateSpaceForAssets(relationComponents.length)
    let count = 0
    for (const relation of relationComponents) {
      count++
      let width;
      count <= space.assetsLeft ? width = space.spaceleft : width = space.spaceright
      const scale = await generateAssetScale(_dataSources, relation.key, { height: wallFullHeight, width: width } as Dimension)
      const found = relationComponents.find(_obj => _obj.key === relation.key)
      if (found) {
        found.scale = scale
        await _dataSources.EntitiesAPI.addRelation(_frameId, found)
      }
    }
  }
}

export const prepareCustomStory = async (_dataSources: DataSources, _storyId: string) => {
  let frame = await getCustomFrame(_dataSources, _storyId)
  if (frame) {
    frame = setIdAs_Key(frame) as Entity
    await updatedRelationsForFrame(_dataSources, frame.id)
    await addScaleToAssets(_dataSources, frame.id)
  }
}