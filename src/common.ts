import { EntitiesResults, Entity } from './type-defs';

const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export function setId(entityRaw: any) {
  console.log("Entityraw", entityRaw);
  const filterdId = entityRaw.identifiers.filter(
    (id: string) => regexExp.test(id)
  );
  entityRaw.id = filterdId.length === 1 ? filterdId[0] : 'noid';
  return entityRaw;
}
export function setIdsAs_Key(_entities: EntitiesResults) {
  const entities: Array<Entity> = [];
  _entities.results?.forEach((_entity) => {
    const entity = { id: _entity?._key as string } as Entity;
    Object.assign(entity, _entity);
    entities.push(entity);
  });
  Object.assign(_entities.results, entities);
  return _entities;
}

export function setIdAs_Key(_entity: Entity){
  const entity = { id: _entity?._key as string } as Entity;
  Object.assign(entity, _entity);
  return entity;
}