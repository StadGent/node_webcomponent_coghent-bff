export function setId(entityRaw: any) {
  const filterdId = entityRaw.identifiers.filter(
    (id: string) => id.length === 9
  );
  entityRaw.id = filterdId.length === 1 ? filterdId[0] : 'noid';
  return entityRaw;
}