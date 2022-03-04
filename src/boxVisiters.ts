import {
  BoxVisiter,
  BoxVisitersResults, Entity, FrameInput, FrameSeen, Relation, RelationType, StoryInput,
} from './type-defs';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { Context } from './types';
import { environment as env } from './environment';
import { setIdAs_Key, setIdsAs_Key, setEntitiesIdPrefix } from './common';
import { PersistedQueryNotFoundError } from 'apollo-server-errors';

export class BoxVisitersAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${env.api.collectionAPIUrl}/`;
  private BOX_VISITS = 'box_visits';

  async getBoxVisiters(): Promise<BoxVisitersResults> {
    const visiters = await this.get<BoxVisitersResults>(this.BOX_VISITS);
    return setIdsAs_Key(visiters) as BoxVisitersResults;
  }

  async getByCode(_code: string): Promise<BoxVisiter | null> {
    let visiter = null
    try {
      visiter = await this.get<BoxVisiter>(`${this.BOX_VISITS}/${_code}`);
      visiter = setIdAs_Key(visiter) as BoxVisiter;
    } catch (error) {
      console.error(`No visiter found for code: ${_code}`)
    }
    return visiter
  }

  async getRelations(_code: string): Promise<Array<Relation>> {
    return await this.get<Array<Relation>>(`${this.BOX_VISITS}/${_code}/relations`);
  }

  async create(_storyId: string): Promise<BoxVisiter> {
    const visiter = await this.post(this.BOX_VISITS, { story_id: setEntitiesIdPrefix(_storyId) })
    return setIdAs_Key(visiter) as BoxVisiter;
  }

  async AddStory(_code: string, storyInput: StoryInput): Promise<BoxVisiter | null> {
    let last_frame = ''
    let seenFrames: Array<FrameSeen> = []
    if (storyInput.last_frame && storyInput.last_frame != '') {
      seenFrames.push(this.createSeenFrame(storyInput.last_frame))
      last_frame = seenFrames[seenFrames.length - 1].id
    }
    const newStory = {
      type: RelationType.Stories,
      label: 'story',
      key: setEntitiesIdPrefix(storyInput.id as string, true),
      active: true,
      last_frame: storyInput.last_frame,
      total_frames: storyInput.total_frames,
      order: Math.round(Date.now() / 1000),
      seen_frames: seenFrames,      
    } as Relation
    await this.updateRelation(_code, [newStory])
    let updatedVisiter: BoxVisiter | null
    const visiter = await this.getByCode(_code)
    visiter != null ? updatedVisiter = setIdAs_Key(visiter) as BoxVisiter : updatedVisiter = null
    return updatedVisiter
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

  async AddFrameToStory(_code: string, _frameInput: FrameInput): Promise<BoxVisiter | null> {
    const frameId = setEntitiesIdPrefix( _frameInput.frameId)
    let updatedVisiter: BoxVisiter | null
    const relations = await this.getRelations(_code)
    const stories = relations.filter(_relation => setEntitiesIdPrefix(_relation.key) == _frameInput.storyId)
    if (stories.length == 1) {
      let story = stories[0]
      if (!story.seen_frames) { story.seen_frames = [] }
      if (this.checkIfFrameAlreadySeen(story, frameId)) {
        story = this.findAndUpdateDateFromFrame(story, frameId)
        console.log('frame already exists')
      } else {
        story.seen_frames?.push(this.createSeenFrame(frameId))
      }
      await this.updateRelation(_code, [story])
    } else {
      console.error(`No stories found for boxVisiter with code ${_code}`)
    }
    const visiter = await this.getByCode(_code)
    visiter != null ? updatedVisiter = setIdAs_Key(visiter) as BoxVisiter : updatedVisiter = null
    return updatedVisiter
  }

  createSeenFrame(_frameId: string): FrameSeen {
    return { id: `${_frameId}`, date: Math.round(Date.now() / 1000) }
  }

  async AddAssetToRelation(_code: string, _assetId: string, _type: RelationType): Promise<Relation> {
    const relation: Relation = {
      key: setEntitiesIdPrefix(_assetId, true),
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
      const matches = _relation.seen_frames.filter(_frame => setEntitiesIdPrefix(_frame?.id as string) == _frameId)
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
        if (setEntitiesIdPrefix(relation?.id as string) == _frameId) {
          updatedSeenFrames.push({
            id: setEntitiesIdPrefix(_frameId),
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