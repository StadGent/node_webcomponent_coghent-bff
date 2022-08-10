import { SessionData } from 'express-session';
import { BoxVisitersAPI } from './boxVisiters';
import { EntitiesAPI } from './entities';
import { SearchAPI } from './entities_search';
import { IiifAPI } from './iiif';
import { StoryBoxAPI } from './sources/storybox';
import { TicketsAPI } from './ticket';
import { UserAPI } from './user';
import { TestimonyAPI } from './testimony';
import { StorageStaticAPI } from './sources/storage_static';
import EntitiesStaticAPI from './sources/entities_static';

export interface DataSources {
  StorageStaticAPI: StorageStaticAPI;
  EntitiesAPI: EntitiesAPI;
  EntitiesStaticAPI: EntitiesStaticAPI;
  StoryBoxAPI: StoryBoxAPI;
  BoxVisitersAPI: BoxVisitersAPI;
  TicketsAPI: TicketsAPI;
  IiifAPI: IiifAPI;
  SearchAPI: SearchAPI;
  UserAPI: UserAPI;
  TestimonyAPI: TestimonyAPI;
}

export interface Context {
  session: SessionData;
  dataSources: DataSources;
}
