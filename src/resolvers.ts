import { Metadata, Resolvers } from './type-defs';
import { Context } from './types';

export const resolvers: Resolvers<Context> = {
    Query: {
        Entity: async (_source, { id }, { dataSources }) => {
            return dataSources.EntitiesAPI.getEntity(id);
        },
        Entities: async (_source, { limit, skip }, { dataSources }) => {
            return dataSources.EntitiesAPI.getEntities(limit || 20, skip || 0);
        },
    },
    Mutation: {
        addMetadata: async (_source, { id, metadata }, { dataSources }) => {
            return dataSources.EntitiesAPI.addMetadata(id, metadata);
        },
        replaceMetadata: async (_source, { id, metadata }, { dataSources }) => {
            return dataSources.EntitiesAPI.replaceMetadata(id, metadata);
        },
        deleteMetadata: async (_source, { id, key }, { dataSources }) => {
            return dataSources.EntitiesAPI.deleteMetadata(id, key);
        },
    },
    Entity: {
        mediafiles(parent, _args, { dataSources }) {
            return dataSources.EntitiesAPI.getMediafiles(parent.id);
        },
        metadata(parent, { key }) {
            if (key) {
                const data = parent.metadata.filter(meta => meta && key.includes(meta.key)) as Metadata[]
                data.sort((x, y) => key.indexOf(x.key) - key.indexOf(y.key));
                return data;
            }
            return parent.metadata;
        },
    }
};