import { setEntitiesIdPrefix } from '../common'
import { BoxVisiter, Entity, EntityTypes, Relation, RelationType } from '../type-defs'
import { DataSources } from '../types'

export const visiterOfRelationHelper = async (_relations: Array<Relation>, _dataSources: DataSources) => {
  let visiter: null | BoxVisiter = null
  if (_relations && _relations.length === 1) {
    const visiterId = _relations[0].key.replace(`box_visits/`, '')
    const tmpVisiter = await _dataSources.BoxVisitersAPI.getByCode(visiterId)
    tmpVisiter && tmpVisiter.code ? visiter = tmpVisiter : null
  }
  return visiter
}

export const getVisiterOfEntity = async (_parent: Entity, _dataSources: DataSources) => {
  let visiter: null | BoxVisiter = null

  switch (_parent.type) {
    case EntityTypes.Story:
      const storyRelations = await _dataSources.EntitiesAPI.getRelationOfType(_parent.id, RelationType.StoryBoxVisits)
      visiter = await visiterOfRelationHelper(storyRelations, _dataSources)
      break;
    case EntityTypes.Frame:
      const frameRelations = await _dataSources.EntitiesAPI.getRelationOfType(_parent.id, RelationType.Stories)
      if (frameRelations && frameRelations.length === 1) {
        const storyRelations = await _dataSources.EntitiesAPI.getRelationOfType(setEntitiesIdPrefix(frameRelations[0].key, false), RelationType.StoryBoxVisits)
        visiter = await visiterOfRelationHelper(storyRelations, _dataSources)
      }
      break;
    default: visiter = null
  }
  return visiter
}