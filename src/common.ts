
const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export function setId(entityRaw: any) {
  console.log("Entityraw",entityRaw);
  const filterdId = entityRaw.identifiers.filter(
    (id: string) => regexExp.test(id)
  );
  entityRaw.id = filterdId.length === 1 ? filterdId[0] : 'noid';
  return entityRaw;
}