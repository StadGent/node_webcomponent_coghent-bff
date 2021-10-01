import { Metadata, Resolvers } from './type-defs';
import { Context } from './types';
import { AuthenticationError } from "apollo-server"

export const resolvers: Resolvers<Context> = {
  Query: {
    Entity: async (_source, { id }, { dataSources }) => {
      return dataSources.EntitiesAPI.getEntity(id);
    },
    Entities: async (_source, { limit, skip, searchValue, fetchPolicy }, { dataSources }) => {
      return dataSources.SearchAPI.getEntities(limit || 20, skip || 0, searchValue, fetchPolicy || '');
    },
    User: async (_source, { }, { dataSources, session }) => {
      if(!session.auth.accessToken){
        throw new AuthenticationError("Not authenticated")
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
          meta => meta && key.includes(meta.key)
        ) as Metadata[];
        data.sort((x, y) => key.indexOf(x.key) - key.indexOf(y.key));
        return data;
      }
      return parent.metadata;
    },
    relations(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getRelations(parent.id);
    },
  },
};
