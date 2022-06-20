import { EntityTypes, Metadata, Relation, RelationType } from '../type-defs';

export const filterByRelationTypes = (_relations: Array<Relation>, _types: Array<RelationType>) => {
  let relations: Array<Relation>;
  if (_relations.length > 0 && _types.length > 0) {
    relations = _relations.filter(_relation => _types.includes(_relation.type))
  } else {
    relations = _relations
  }
  return relations
}

export const createEntityBody = (_type: EntityTypes, _title: string, _description: string) => {
  const body = `{
    "type": "${_type}",
    "metadata": [
        {
            "key": "type",
            "value": "frame",
            "language": "en"
        },
        {
            "key": "title",
            "value": "${_title}",
            "language": "en"
        },
        {
            "key": "description",
            "value": "${_description}",
            "language": "en"
        }
    ],
    "data": {}
}`
  return body
}

export const replaceMetadata = (_metadata: Array<Metadata>, _newMetadata: Metadata) => {
  let metadata = _metadata
  console.log('\n ORIGINAL metadata', metadata)

  for (const data of _metadata) {
    if (data.key === _newMetadata.key) {
      console.log(`\n THIS ITEM to remove`, data)
      metadata.splice(metadata.indexOf(data), 1)
      console.log('\n MANIPULATED metadata', metadata)
    }
  }
}