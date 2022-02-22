import {
  BoxVisiter,
  BoxVisitersResults, FrameInput, FrameSeen, Relation, RelationType, StoryInput,
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

  async AddStory(_code: string, story: StoryInput): Promise<BoxVisiter> {
    let last_frame = ''
    let seenFrames: Array<FrameSeen> = []
    if (story.last_frame && story.last_frame != '') {
      seenFrames.push(this.createSeenFrame(story.last_frame))
      last_frame= seenFrames[seenFrames.length- 1].id
    }
    const newStory = {
      type: RelationType.Stories,
      label: 'story',
      key: `entities/${story.key}`,
      active: story.active,
      last_frame: last_frame,
      seen_frames: seenFrames,
    } as Relation
    await this.updateRelation(_code, [newStory])
    const updatedVisiter = await this.getByCode(_code)
    return setIdAs_Key(updatedVisiter) as BoxVisiter
  }

  async updateRelation(_code: string, _relation: Array<Relation>): Promise<Relation> {
    let relation: Relation;
    try {
      relation = await this.patch(`${this.BOX_VISITS}/${_code}/relations`, _relation)
    } catch (error) {
      throw new PersistedQueryNotFoundError()
    }
    return relation
  }

  async AddFrameToStory(_code: string, _frameInput: FrameInput): Promise<BoxVisiter> {
    let visiter: BoxVisiter
    const relations = await this.getRelations(_code)
    const stories = relations.filter(_relation => _relation.key.replace('entities/', '') == _frameInput.storyId)
    if (stories.length == 1) {
      let story = stories[0]
      if (!story.seen_frames) { story.seen_frames = [] }
      if (this.checkIfFrameAlreadySeen(story, _frameInput.frameId)) {
        story = this.findAndUpdateDateFromFrame(story, _frameInput.frameId)
        console.log('frame already exists')
      } else {
        story.seen_frames?.push(this.createSeenFrame(_frameInput.frameId))
      }
      await this.updateRelation(_code, [story])
    } else {
      console.error(`No stories found for boxVisiter with code ${_code}`)
    }
    visiter = await this.getByCode(_code)
    return visiter
  }

  createSeenFrame(_frameId: string): FrameSeen {
    return { id: `entities/${_frameId}`, date: Math.round(Date.now() / 1000) }
  }

  async AddAssetToRelation(_code: string, _assetId: string, _type: RelationType): Promise<Relation> {
    const relation: Relation = {
      key: `entities/${_assetId}`,
      type: _type,
      label: 'asset',
      order: Math.round(Date.now() / 1000),
    }
    const createdRelation = await this.updateRelation(_code, [relation])
    return createdRelation
  }

  checkIfFrameAlreadySeen(_relation: Relation, _frameId: string): boolean {
    let isExisting = false
    if (_relation.seen_frames) {
      const matches = _relation.seen_frames.filter(_frame => _frame?.id.replace('entities/', '') == _frameId)
      if (matches.length > 0)
        isExisting = true
    }
    return isExisting
  }

  findAndUpdateDateFromFrame(_relation: Relation, _frameId: string): Relation {
    let updatedSeenFrames: Array<FrameSeen> = []
    let newRelation = {} as Relation
    Object.assign(newRelation, _relation)
    if (newRelation.seen_frames) {
      for (const relation of newRelation.seen_frames) {
        if (relation?.id.replace('entities/', '') == _frameId) {
          updatedSeenFrames.push({
            id: `entities/${_frameId}`,
            date: Math.round(Date.now() / 1000)
          } as FrameSeen)
        } else {
          updatedSeenFrames.push(relation as FrameSeen)
        }
      }
      newRelation.seen_frames = updatedSeenFrames
    }
    return newRelation
  }
}