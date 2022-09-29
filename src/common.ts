import { BoxVisiter, BoxVisitersResults, EntitiesResults, Entity, MediaFile, MediafilesResults } from './type-defs';

const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export function setId(entityRaw: any) {
  const filterdId = entityRaw.identifiers.filter(
    (id: string) => regexExp.test(id)
  );
  entityRaw.id = filterdId.length === 1 ? filterdId[0] : 'noid';
  return entityRaw;
}
export function setIdsAs_Key(_entities: EntitiesResults | BoxVisitersResults | MediafilesResults) {
  const entities: Array<Entity | BoxVisiter | MediaFile> = [];
  _entities.results?.forEach((_entity: any) => {
    let entity = { id: _entity?._key as string } as Entity | BoxVisiter;
    entity = {..._entity, ...entity};
    entities.push(entity);
  });

  Object.assign(_entities.results as Array<any>, entities);

  return _entities;
}

export function setIdAs_Key(_entity: Entity | BoxVisiter) {
  const entity = { id: _entity?._key as string } as Entity | BoxVisiter;
  Object.assign(entity, _entity);
  return entity;
}

export function setEntitiesIdPrefix(_id: string, _hasPrefix = false) {
  const prefix = 'entities/'
  let newId = _id
  if (_hasPrefix) {
    if (_id.includes(prefix)) {
      newId = _id
    } else {
      newId = `${prefix}${_id}`
    }
  } else {
    newId = _id.replace(prefix, '')
  }
  return newId
}

export const audioFileExtensions = ['.mp3', '.wav']
export const subtitleFileExtensions = ['.srt']
export const splitFilenameAndExtension = (_filename: string, _encodeFilename = false) => {
  const extension = _filename.substring(_filename.lastIndexOf('.'))
  let filename = _filename.substring(0, _filename.lastIndexOf('.'))
  // if (_encodeFilename) filename = encodeURIComponent(filename)
  return {
    name: filename,
    extension: extension
  }
}