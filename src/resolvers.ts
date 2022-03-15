import {
  Entity,
  Metadata,
  Relation,
  RelationType,
  Resolvers,
  MetaKey,
  ComponentType,
  Maybe,
  MetadataCollection,
  MediaInfo,
  EntitiesResults,
  BoxVisiter,
  StoryInput,
  Ticket,
} from './type-defs';
import { Context, DataSources } from './types';
import { AuthenticationError } from 'apollo-server';
import 'apollo-cache-control';
import { environment } from './environment';
import { filterByRelationTypes } from './parsers/entities';
import { ticketXML } from './sources/ticket';

export const resolvers: Resolvers<Context> = {
  Query: {
    PrintBoxTicket: (_source, { code }, { dataSources }) => {
      const ticket = dataSources.TicketsAPI.print(code);
      const body = {
        data: ticket,
      };
      return { code: code, body: JSON.stringify(body) } as Ticket;
    },
    ActiveBox: async (_source, _args, { dataSources }) => {
      const stories = await getActiveStories(dataSources);
      return { count: stories.length, results: stories } as EntitiesResults;
    },
    BoxVisiters: async (_source, _args, { dataSources }) => {
      const visiters = await dataSources.BoxVisitersAPI.getBoxVisiters();
      return visiters;
    },
    BoxVisiterByCode: async (_source, { code }, { dataSources }) => {
      const visiter = await dataSources.BoxVisitersAPI.getByCode(code);
      console.log('Get visiter by CODE', visiter);
      return visiter;
    },
    BoxVisiterRelationsByType: async (
      _source,
      { code, type },
      { dataSources }
    ) => {
      const relations = await dataSources.BoxVisitersAPI.getRelations(code);
      return filterByRelationTypes(relations, [type]).reverse();
    },
    CreateBoxVisiter: async (_source, { storyId }, { dataSources }) => {
      const visiter = await dataSources.BoxVisitersAPI.create(storyId);
      console.log('CREATE box visiter', visiter);
      return visiter;
    },
    Stories: async (_source, _args, { dataSources }) => {
      return dataSources.EntitiesAPI.getStories();
    },
    Entity: async (_source, { id }, { dataSources }, info) => {
      info.cacheControl.setCacheHint({ maxAge: 3600 });
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
    AddStoryToBoxVisiter: async (
      _source,
      { code, storyId },
      { dataSources }
    ) => {
      let updatedVisiter: BoxVisiter | null;
      const visiterRelations = await dataSources.BoxVisitersAPI.getRelations(
        code
      );
      const storyMatches = visiterRelations?.filter(
        (_relation) =>
          _relation.key.replace('entities/', '') == storyId &&
          _relation.type == RelationType.Stories
      );
      if (storyMatches.length > 0) {
        console.log(
          `Story with id ${storyId} was already added tot the box_visiter.`
        );
        updatedVisiter = await dataSources.BoxVisitersAPI.getByCode(code);
      } else {
        const storyToAdd = await dataSources.EntitiesAPI.getEntity(storyId);
        const frameRelationsOfStory =
          await dataSources.EntitiesAPI.getRelationOfType(
            storyToAdd.id,
            RelationType.Frames
          );
        updatedVisiter = await dataSources.BoxVisitersAPI.AddStory(code, {
          id: storyId,
          total_frames: frameRelationsOfStory.length,
        } as StoryInput);
      }
      return updatedVisiter;
    },
    AddFrameToStoryBoxVisiter: async (
      _source,
      { code, frameInput },
      { dataSources }
    ) => {
      return await dataSources.BoxVisitersAPI.AddFrameToStory(code, frameInput);
    },
    AddAssetToBoxVisiter: async (
      _source,
      { code, assetId, type },
      { dataSources }
    ) => {
      if (type == RelationType.Visited || type == RelationType.InBasket) {
        await dataSources.BoxVisitersAPI.AddAssetToRelation(
          code,
          assetId,
          type
        );
      }
      return await dataSources.BoxVisitersAPI.getRelations(code);
    },
  },
  BoxVisiter: {
    async relations(parent, _args, { dataSources }) {
      return await dataSources.BoxVisitersAPI.getRelations(parent.code);
    },
    async relationByType(parent, { type }, { dataSources }) {
      const relations = await dataSources.BoxVisitersAPI.getRelations(
        parent.code
      );
      return relations.filter((_relation) => _relation.type == type).reverse();
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
    primary_mediafile_info: async (parent, _args, { dataSources }) => {
      let _mediainfo: MediaInfo;
      if (parent.primary_mediafile?.includes('.mp3')) {
        _mediainfo = { width: '0', height: '0' } as MediaInfo;
      } else {
        _mediainfo = await dataSources.IiifAPI.getInfo(
          parent.primary_mediafile ? parent.primary_mediafile : ''
        );
      }
      return _mediainfo;
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
      let components = await dataSources.EntitiesAPI.getEntityRelations(
        parent.id
      );
      components = components.map((component) => {
        //@ts-ignore
        if (component.x) {
          component.position = {
            //@ts-ignore
            x: component.x,
            //@ts-ignore
            y: component.y,
            //@ts-ignore
            z: component.z,
          };
        }

        return component;
      });
      let mediafileRelations = components.filter((_component) =>
        _component.key.includes('mediafiles/')
      );
      for (const _relation of mediafileRelations) {
        const mediafile = await dataSources.EntitiesAPI.getMediafilesById(
          _relation.key.replace('mediafiles/', '')
        );
        if (
          mediafile.original_file_location?.includes('.mp3') ||
          mediafile.original_file_location?.includes('.wav')
        ) {
          _relation['audioFile'] = mediafile.original_file_location;
        }
        if (mediafile.original_file_location?.includes('.srt')) {
          _relation['subtitleFile'] = mediafile.original_file_location;
        }
      }
      return components;
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
      const assetRelations = data.filter(
        (_relation) => _relation.type == RelationType.Components
      );
      const assets = await dataSources.EntitiesAPI.getEntitiesOfRelationIds(
        assetRelations.map((_relation) => _relation.key)
      );
      return assets;
    },
    frames: async (parent, _args, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelationOfType(
        parent.id,
        RelationType.Frames
      );

      return await dataSources.EntitiesAPI.getEntitiesOfRelationIds(
        data.map((_relation) => _relation.key)
      );
    },
    collections: async (parent, _args, { dataSources }) => {
      const matches = parent.metadata?.filter(
        (_meta) => _meta?.label == 'MaterieelDing.beheerder'
      );
      return matches as Array<Relation>;
    },
  },
  MediaFile: {
    mediainfo: async (parent, _args, { dataSources }) => {
      let _mediainfo: MediaInfo;
      if (parent.filename?.includes('.mp3')) {
        _mediainfo = { width: '0', height: '0' } as MediaInfo;
      } else {
        _mediainfo = await dataSources.IiifAPI.getInfo(
          parent.filename ? parent.filename : ''
        );
      }
      return _mediainfo;
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

const getActiveStories = async (dataSources: DataSources) => {
  const boxStories = await dataSources.EntitiesAPI.getRelations(
    environment.activeBoxEntity
  );
  let activeStories = boxStories.filter((_relation) => _relation?.active);
  if (activeStories.length > Number(environment.maxStories)) {
    activeStories = activeStories.slice(0, Number(environment.maxStories));
  }
  let stories: Array<Entity> = [];
  for (const story of activeStories) {
    try {
      const entity = await dataSources.EntitiesAPI.getEntity(
        story.key.replace('entities/', '')
      );
      stories.push(entity);
    } catch (error) {
      console.error(`Couldn't find entity with id: ${story.key}`);
    }
  }
  return stories;
};
