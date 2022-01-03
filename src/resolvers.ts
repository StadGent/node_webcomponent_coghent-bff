import {
  Entity,
  Metadata,
  Relation,
  RelationType,
  Resolvers,
  MetaKey,
  ComponentType,
  MediaFile,
  Maybe,
  MetadataCollection,
} from './type-defs';
import { Context, DataSources } from './types';
import { AuthenticationError } from 'apollo-server';
import { setIdAs_Key } from './common';

export const resolvers: Resolvers<Context> = {
  Query: {
    BoxVisiters: async (_source, _args, { dataSources }) => {
      const visiters = await dataSources.EntitiesAPI.getBoxVisiters();
      return visiters;
    },
    BoxVisiterByCode: async (_source, { code }, { dataSources }) => {
      const visiters = await dataSources.EntitiesAPI.getBoxVisiters();
      let visiter = null;
      visiters.results?.forEach((_visiter) => {
        if (_visiter?._key == code) visiter = _visiter;
      });
      if (visiter == null) {
        visiter = await dataSources.EntitiesAPI.createBoxVisiter();
        visiter = setIdAs_Key(visiter);
      }
      return visiter;
    },
    Stories: async (_source, _args, { dataSources }) => {
      return dataSources.EntitiesAPI.getStories();
    },
    Entity: async (_source, { id }, { dataSources }) => {
      return dataSources.EntitiesAPI.getEntity(id);
    },
    Entities: async (
      _source,
      { limit, skip, searchValue, fetchPolicy },
      { dataSources }
    ) => {
      return dataSources.SearchAPI.getEntities(
        limit || 20,
        skip || 0,
        searchValue,
        fetchPolicy || ''
      );
    },
    User: async (_source, {}, { dataSources, session }) => {
      if (!session.auth.accessToken) {
        throw new AuthenticationError('Not authenticated');
      }
      return dataSources.UserAPI.getMe(session.auth.accessToken);
    },
  },
  Mutation: {
    replaceMetadata: async (_source, { id, metadata }, { dataSources }) => {
      return dataSources.EntitiesAPI.replaceMetadata(id, metadata);
    },
    AddFrameToVisiter: async (
      _source,
      { visiterId, frameId },
      { dataSources }
    ) => {
      return await dataSources.EntitiesAPI.addFrameToVister(visiterId, frameId);
    },
  },
  Relation: {
    async audioFile(parent, _args, { dataSources }) {
      let audio = 'No audio';
      let mediafile: MediaFile = {} as MediaFile;
      if (parent.key.includes('mediafiles')) {
        mediafile = await dataSources.EntitiesAPI.getMediafilesById(
          parent.key.replace('mediafiles/', '')
        );
        if (mediafile.original_file_location) {
          audio = mediafile.original_file_location as string;
        }
      }
      return audio;
    },
  },
  Entity: {
    mediafiles(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getMediafiles(parent.id);
    },
    metadata(parent, { key }, { dataSources }) {
      if (key) {
        return filterMetaData(parent.metadata, key, dataSources);
      } else {
        return [];
      }
    },
    metadataByLabel: async (parent, { key }, { dataSources }) => {
      if (key) {
        const data = await filterMetaData(
          parent.metadata,
          key,
          dataSources,
          'label'
        );

        return data.map((metadata) => {
          delete metadata.type;
          return metadata;
        });
      } else {
        return [];
      }
    },
    metadataCollection: async (parent, { key, label }, { dataSources }) => {
      const data: MetadataCollection[] = [];
      const metaData = await exlcudeMetaData(parent.metadata, key, label);
      metaData.forEach((element) => {
        if (element.value) {
          const label = element.label ? element.label : element.key;
          if (data.some((collectionItem) => collectionItem.label === label)) {
            data.map((collectionItem) => {
              if (collectionItem.label === label) {
                collectionItem.data && collectionItem.data.push(element);
              }
            });
          } else {
            data.push({
              label: label,
              data: [element],
              nested: element.type === 'components' ? true : false,
            });
          }
        }
      });

      return data;
    },
    relations(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getRelations(parent.id);
    },
    relationMetadata: async (parent, _args, { dataSources }) => {
      return await dataSources.EntitiesAPI.getComponents(parent.id);
    },
    components: async (parent, _args, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let components = await getComponents(dataSources, data);
      return components;
    },
    componentsOfType: async (parent, { key }, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let components: Array<Entity> = [];

      if (
        !key ||
        !Object.values(ComponentType).includes(key as ComponentType)
      ) {
        components = await getComponents(dataSources, data);
      } else {
        const allComponents = await getComponents(dataSources, data);
        allComponents.map((component) => {
          if (
            component.metadata.filter(
              (meta) => meta?.key === 'type' && meta.value === key
            ).length > 0
          )
            components.push(component);
        });
      }

      return components;
    },
    assets: async (parent, _args, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let frames = await getComponents(dataSources, data);
      return frames;
    },
    frames: async (parent, _args, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let frames = await getComponents(dataSources, data);
      return frames;
    },
    qrCode: async (parent, _args, { dataSources }) => {
      let qrCode = null;
      if (parent.id != 'noid') {
        const entity = await dataSources.EntitiesAPI.getEntity(parent.id);
        qrCode = entity.metadata.filter(
          (data) => data?.key == MetaKey.QrCode
        )[0]?.value;
        if (qrCode == undefined)
          qrCode = Math.floor(Math.random() * (10000000 - 1 + 1)) + 1;
      }
      return qrCode as string;
    },
  },
  MediaFile: {
    mediainfo: async (parent, _args, { dataSources }) => {
      return await dataSources.IiifAPI.getInfo(
        parent.filename ? parent.filename : ''
      );
    },
  },
  Metadata: {
    nestedMetaData: async (parent, _args, { dataSources }) => {
      if (parent.type && parent.type !== 'isIn') {
        return await dataSources.EntitiesAPI.getEntity(
          parent.key.replace('entities/', '')
        );
      }
      return null;
    },
  },
};
const getComponents = async (
  dataSources: DataSources,
  data: Relation[]
): Promise<Entity[]> => {
  if (data.length > 0) {
    const components: Entity[] = [];
    const componentsRelations: Relation[] = data.filter(
      (relation: Relation) =>
        relation && [RelationType.Components].includes(relation.type)
    );
    for (const relation of componentsRelations) {
      const entity = await dataSources.EntitiesAPI.getEntity(
        relation.key.replace('entities/', '')
      );
      components.push(entity);
    }
    return components;
  } else {
    return [];
  }
};

const updateRelationMetadataWhenAudio = async (
  dataSources: DataSources,
  allRelations: Array<Relation>,
  fromComponent: Entity,
  relation: Relation
) => {
  if (relation.key.includes('mediafiles/')) {
    const mediafile = await dataSources.EntitiesAPI.getMediafilesById(
      relation.key.replace('mediafiles/', '')
    );
    const newRelationObject: Relation = allRelations.filter(
      (singleRelation) =>
        singleRelation.key.replace('entities/', '') == fromComponent.id
    )[0];
    newRelationObject['audioFile'] = mediafile.original_file_location;
    return newRelationObject;
  }
};

const filterMetaData = async (
  metadata: Maybe<Metadata>[],
  key: any,
  dataSources: DataSources,
  keyOrLabel: 'key' | 'label' = 'key'
) => {
  const data = metadata.filter((meta) => {
    return meta && key.includes(meta[keyOrLabel]);
  }) as Metadata[];

  if (key.includes('unMapped' as MetaKey.UnMapped)) {
    const other = metadata.filter(
      (meta) => meta && !Object.values(MetaKey).includes(meta.key)
    ) as Metadata[];
    for (const meta of other) {
      if (meta.value)
        data.push({
          key: 'unMapped' as MetaKey.UnMapped,
          value: meta.value,
          unMappedKey: meta.key,
          lang: meta.lang,
          label: meta.label,
          type: meta.type,
        });
    }
  }

  data.sort((x, y) => key.indexOf(x.key) - key.indexOf(y.key));
  return data;
};

const exlcudeMetaData = async (
  metadata: Maybe<Metadata>[],
  key: any,
  label: any = []
) => {
  const dataFilterdOnKey = metadata.filter(
    (meta) => meta && !key.includes(meta.key)
  ) as Metadata[];
  const dataFilterdOnLabel = dataFilterdOnKey.filter(
    (meta) => meta && !label.includes(meta.label)
  ) as Metadata[];
  return dataFilterdOnLabel;
};
