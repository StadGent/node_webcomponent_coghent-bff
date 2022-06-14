import { environment as _ } from '../environment';
import { EntitiesAPI } from '../entities';
import { StoryboxBuild } from '../type-defs';

export class StoryBoxAPI extends EntitiesAPI {

  async createNewFrame(_storyboxInfo: StoryboxBuild) {
    console.log({ _storyboxInfo })
    return ''
  }


}