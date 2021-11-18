import { Entity, Metadata, Relation, RelationType, Resolvers } from './type-defs';
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
  Entity: {
    mediafiles(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getMediafiles(parent.id);
    },
    metadata(parent, { key }) {
      if (key) {
        const data = parent.metadata.filter(
          (meta) => meta && key.includes(meta.key)
        ) as Metadata[];
        data.sort((x, y) => key.indexOf(x.key) - key.indexOf(y.key));
        return data;
      }
      return parent.metadata;
    },
    relations(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getRelations(parent.id);
    },
    components: async (parent, _args, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let components = await getComponents(dataSources, data)
      return components
    },
    assets: async (parent, _args, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let frames = await getComponents(dataSources, data)
      return frames
    },    
    frames: async (parent, _args, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let frames = await getComponents(dataSources, data)
      return frames
    },    
  }
};
const getComponents = async (dataSources: DataSources, data : Relation[]) : Promise<Entity[]> => {
      if(data.length > 0){
        const components : Entity[] = []
        const componentsRelations: Relation[] = data.filter((relation: Relation) => relation && [RelationType.Components].includes(relation.type))
        for (const relation of componentsRelations) {
          const entity = await dataSources.EntitiesAPI.getEntity(relation.key.replace('entities/', ''))
          components.push(entity)
        }
        return components
      }else{
        return []
      }
}
