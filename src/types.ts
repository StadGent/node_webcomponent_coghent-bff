import { SessionData } from 'express-session';
import { EntitiesAPI } from './entities';
import { SearchAPI } from './entities_search';
import { UserAPI } from './user';

export interface DataSources {
  EntitiesAPI: EntitiesAPI;
  SearchAPI: SearchAPI,
  UserAPI: UserAPI
}

export interface Context {
  session: SessionData;
  dataSources: DataSources;
}
