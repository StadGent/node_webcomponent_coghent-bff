import { setEntitiesIdPrefix } from '../common';
import { Entity, Relation, RelationType } from '../type-defs';
import { DataSources } from '../types';

export const setMediafileOnAsset = async (_dataSources: DataSources, _assets: Array<Entity>, _frameId: string) => {
  let components = await _dataSources.EntitiesAPI.getEntityRelations(_frameId);
  for (const _component of components) {
    if (_component.setMediafile && _component.setMediafile != 1 && !_component.key.includes('mediafiles')) {
      const mediafiles = await _dataSources.EntitiesAPI.getMediafiles(
        setEntitiesIdPrefix(_component.key)
      )
      if (mediafiles[_component.setMediafile - 1]) {
        const mediafile = mediafiles[_component.setMediafile - 1]
        _assets.map(asset => {
          if (asset.id === setEntitiesIdPrefix(_component.key)) {
            asset.primary_mediafile_location = mediafile.original_file_location
            asset.primary_mediafile = mediafile.filename
            asset.primary_height = mediafile.img_height
            asset.primary_width = mediafile.img_width
            asset.primary_transcode = mediafile.transcode_filename
            asset.primary_transcode_location = mediafile.primary_transcode_location
          }
        })
      }
    }
  }
  return _assets
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