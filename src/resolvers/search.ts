import { AdvancedInputType, EntityTypes, MetaKey } from '../type-defs';

export type ParsedFilter = {
  key?: MetaKey;
  type: AdvancedInputType;
  value: Array<EntityTypes>;
  item_types: string[];
};

export const getRelationsForUpload = (_searchValue: string) => {
  const itemTypes = [EntityTypes.Getty, EntityTypes.Person];

  const filters: Array<ParsedFilter> = [];
  const titleFilter = [
    {
      type: AdvancedInputType.TextInput,
      item_types: itemTypes,
    },
    {
      type: AdvancedInputType.TextInput,
      value: _searchValue,
      key: 'title',
    },
  ];

  filters.push(titleFilter as unknown as ParsedFilter);
  return filters;
};
