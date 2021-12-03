import { SessionData } from 'express-session';
import { EntitiesAPI } from './entities';
import { SearchAPI } from './entities_search';
import { IiifAPI } from './iiif';
import { UserAPI } from './user';

export interface DataSources {
  EntitiesAPI: EntitiesAPI;
  IiifAPI: IiifAPI;
  SearchAPI: SearchAPI;
  UserAPI: UserAPI;
}

export interface Context {
  session: SessionData;
  dataSources: DataSources;
}
