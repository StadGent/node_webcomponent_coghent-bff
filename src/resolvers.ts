import {
  Entity,
  Metadata,
  Relation,
  RelationType,
  Resolvers,
  MetaKey,
  ComponentType,
  MediaFile,
} from './type-defs';
import { Context, DataSources } from './types';
import { AuthenticationError } from 'apollo-server';

export const resolvers: Resolvers<Context> = {
  Query: {
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
  },
  Relation: {
    async audioFile(parent, _args, { dataSources }){
      let audio = 'No audio';
      let mediafile: MediaFile = {} as MediaFile;
      if(parent.key.includes('mediafiles')){
        mediafile = await dataSources.EntitiesAPI.getMediafilesById(parent.key.replace('mediafiles/', '')); 
        if(mediafile.original_file_location){
          audio = mediafile.original_file_location as string;
        } 
      }
      return audio;
    }
  },
  Entity: {
    mediafiles(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getMediafiles(parent.id);
    },
    metadata(parent, { key }) {
      if (key) {
        const data = parent.metadata.filter(
          (meta) => meta && key.includes(meta.key)
        ) as Metadata[];

        if (key.includes('unMapped' as MetaKey.UnMapped)) {
          const other = parent.metadata.filter(
            (meta) => meta && !Object.values(MetaKey).includes(meta.key)
          ) as Metadata[];

          other.forEach((meta) => {
            if (meta.value)
              data.push({
                key: 'unMapped' as MetaKey.UnMapped,
                value: meta.value,
                unMappedKey: meta.key,
                lang: meta.lang,
              });
          });
        }

        data.sort((x, y) => key.indexOf(x.key) - key.indexOf(y.key));
        return data;
      }
      return parent.metadata;
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

      if(!key || !Object.values(ComponentType).includes(key as ComponentType)){
        components = await getComponents(dataSources, data);
      }else {
        const allComponents = await getComponents(dataSources, data);
        allComponents.map(component => {
          if(component.metadata.filter(meta => meta?.key === 'type' && meta.value === key).length > 0)
            components.push(component)
        })
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
  },
  MediaFile: {
    mediainfo: async (parent, _args, { dataSources }) => {
      return await dataSources.IiifAPI.getInfo(
        parent.filename ? parent.filename : ''
      );
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

const updateRelationMetadataWhenAudio = async (dataSources: DataSources, allRelations: Array<Relation>, fromComponent: Entity, relation: Relation) => {
  if(relation.key.includes('mediafiles/')){
    const mediafile = await dataSources.EntitiesAPI.getMediafilesById(relation.key.replace('mediafiles/', ''));
    const newRelationObject: Relation = allRelations.filter(singleRelation => singleRelation.key.replace('entities/','') == fromComponent.id)[0];
    newRelationObject['audioFile'] = mediafile.original_file_location;
    return newRelationObject;
  }
}
