import { SessionData } from 'express-session';
import { EntitiesAPI } from './entities';
import { SearchAPI } from './entities_search';

export interface DataSources {
  EntitiesAPI: EntitiesAPI;
  SearchAPI: SearchAPI
}

export interface Context {
  session: SessionData;
  dataSources: DataSources;
}
