import {
  BoxVisiter,
  BoxVisitersResults, Relation, RelationType, StoryInput,
} from './type-defs';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { Context } from './types';
import { environment as env } from './environment';
import { setIdAs_Key, setIdsAs_Key } from './common';
import { PersistedQueryNotFoundError } from 'apollo-server-errors';

export class BoxVisitersAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${env.api.collectionAPIUrl}/`;
  private BOX_VISITS = 'box_visits';

  async getBoxVisiters(): Promise<BoxVisitersResults> {
    const visiters = await this.get<BoxVisitersResults>(this.BOX_VISITS);
    return setIdsAs_Key(visiters) as BoxVisitersResults;
  }

  async getByCode(_code: string): Promise<BoxVisiter> {
    const visiter = await this.get<BoxVisiter>(`${this.BOX_VISITS}/${_code}`);
    return setIdAs_Key(visiter) as BoxVisiter;
  }

  async getRelations(_code: string): Promise<Array<Relation>> {
    return await this.get<Array<Relation>>(`${this.BOX_VISITS}/${_code}/relations`);
  }

  async create(_storyId: string): Promise<BoxVisiter> {
    const visiter = await this.post(this.BOX_VISITS, { story_id: _storyId })
    return setIdAs_Key(visiter) as BoxVisiter;
  }

  async AddStory(_code: string, story: StoryInput): Promise<any> {
    const newStory = {
      type: 'stories',
      label: RelationType.Stories,
      key: `entities/${story.key}`,
      active: story.active,
      last_frame: story.last_frame
    } as Relation
    try {
      this.patch(`${this.BOX_VISITS}/${_code}/relations`, [newStory])
    } catch (error) {
      console.error(error)
      throw new PersistedQueryNotFoundError()
    }
    const updatedVisiter = await this.getByCode(_code)
    return setIdAs_Key(updatedVisiter)
  }

}

