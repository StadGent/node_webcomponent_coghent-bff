import { SessionData } from 'express-session';
import { BoxVisitersAPI } from './boxVisiters';
import { EntitiesAPI } from './entities';
import { SearchAPI } from './entities_search';
import { IiifAPI } from './iiif';
import { StoryBoxAPI } from './sources/storybox';
import { TicketsAPI } from './ticket';
import { UserAPI } from './user';

export interface DataSources {
  EntitiesAPI: EntitiesAPI;
  StoryBoxAPI: StoryBoxAPI;
  BoxVisitersAPI: BoxVisitersAPI;
  TicketsAPI: TicketsAPI;
  IiifAPI: IiifAPI;
  SearchAPI: SearchAPI;
  UserAPI: UserAPI;
}

export interface Context {
  session: SessionData;
  dataSources: DataSources;
}
