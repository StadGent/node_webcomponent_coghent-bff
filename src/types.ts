import { SessionData } from 'express-session';
import { EntitiesAPI } from './entities';

export interface DataSources {
  EntitiesAPI: EntitiesAPI;
}

export interface Context {
  session: SessionData;
  dataSources: DataSources;
}
