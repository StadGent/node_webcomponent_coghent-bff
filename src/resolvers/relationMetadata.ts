import { setEntitiesIdPrefix } from '../common';
import { relationsWithExcludedCollections } from '../parsers/entities';
import { Collections, Entity, MediaFile, Relation, RelationType } from '../type-defs';
import { DataSources } from '../types';

export const setMediafileOnAsset = async (_dataSources: DataSources, _assets: Array<Entity>, _frameId: string) => {
  const updatedAssets: Array<Entity> = _assets
  let components = await _dataSources.EntitiesAPI.getRelationOfType(_frameId, RelationType.Components);
  components = relationsWithExcludedCollections(components, [Collections.Mediafiles])
  const itemsToUpdate: Array<{ id: string, index: number, mediaFile: MediaFile, setMediafile: number }> = []
  for (const [index, _component] of components.entries()) {
    if (_component.setMediafile && _component.setMediafile != 1 && !_component.key.includes('mediafiles')) {
      const mediafiles = await _dataSources.EntitiesAPI.getMediafiles(
        setEntitiesIdPrefix(_component.key)
      )
      if (mediafiles[_component.setMediafile - 1]) {
        const mediafile = mediafiles[_component.setMediafile - 1]
        itemsToUpdate.push({
          id: setEntitiesIdPrefix(_component.key, false),
          index: index,
          mediaFile: mediafile,
          setMediafile: _component.setMediafile
        })
      }
    }
  }
  if (itemsToUpdate.length >= 1) {
    for (const item of itemsToUpdate) {
      if (updatedAssets[item.index] && updatedAssets[item.index].id === item.id) {
        updatedAssets[item.index].primary_mediafile_location = item.mediaFile.original_file_location
        updatedAssets[item.index].primary_mediafile = item.mediaFile.filename
        updatedAssets[item.index].primary_height = item.mediaFile.img_height
        updatedAssets[item.index].primary_width = item.mediaFile.img_width
        updatedAssets[item.index].primary_transcode = item.mediaFile.transcode_filename
        updatedAssets[item.index].primary_transcode_location = item.mediaFile.primary_transcode_location
      }
    }

  }
  return updatedAssets
}

export const createRelationOfId = (_entityId: string, _relationType: RelationType) => {
  const relation = {
    key: `entities/${_entityId}`,
    type: _relationType,
  } as Relation
  return relation
}

export const addTimingsToRelation = (_relation: Relation, _timings: Record<'start' | 'zoom' | 'end', number>) => {
  _relation.timestamp_start = _timings['start']
  _relation.timestamp_zoom = _timings['zoom']
  _relation.timestamp_end = _timings['end']
  return _relation
}