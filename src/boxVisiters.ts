import {
  BoxVisiter,
  BoxVisitersResults,
  EntityTypes,
  FrameInput,
  FrameSeen,
  Relation,
  RelationType,
  StoryInput,
} from './type-defs';
import { setIdAs_Key, setIdsAs_Key, setEntitiesIdPrefix } from './common';
import { PersistedQueryNotFoundError } from 'apollo-server-errors';
import { createEntityBody } from './parsers/entities';
import { createRelationTypeFromData } from './parsers/storybox';
import { EntitiesAPI } from './entities';

export class BoxVisitersAPI extends EntitiesAPI {
  private BOX_VISITS = 'box_visits';

  async getBoxVisiters(): Promise<BoxVisitersResults> {
    const visiters = await this.get<BoxVisitersResults>(this.BOX_VISITS);
    return setIdsAs_Key(visiters) as BoxVisitersResults;
  }

  async getByCode(_code: string): Promise<BoxVisiter | null> {
    let visiter = null;
    try {
      visiter = await this.get<BoxVisiter>(`${this.BOX_VISITS}/${_code}`);
      visiter = setIdAs_Key(visiter) as BoxVisiter;
    } catch (error) {
      console.log(`No visiter found for code: ${_code}`);
    }
    return visiter;
  }

  async getBasketItemsByFrameId(_id: string): Promise<Array<Relation>> {
    const frameRelations = this.getEntityRelations(_id);
    return frameRelations;
  }

  async getRelations(_code: string): Promise<Array<Relation>> {
    return await this.get<Array<Relation>>(
      `${this.BOX_VISITS}/${_code}/relations`
    );
  }

  async create(_storyId: string): Promise<BoxVisiter> {
    const visiter = await this.post(this.BOX_VISITS, {
      story_id: setEntitiesIdPrefix(_storyId),
    });
    return setIdAs_Key(visiter) as BoxVisiter;
  }

  async AddStory(
    _code: string,
    storyInput: StoryInput
  ): Promise<BoxVisiter | null> {
    let last_frame = '';
    let seenFrames: Array<FrameSeen> = [];
    if (storyInput.last_frame && storyInput.last_frame != '') {
      seenFrames.push(this.createSeenFrame(storyInput.last_frame));
      last_frame = seenFrames[seenFrames.length - 1].id;
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
    } as Relation;
    await this.updateRelation(_code, [newStory]);
    let updatedVisiter: BoxVisiter | null;
    const visiter = await this.getByCode(_code);
    visiter != null
      ? (updatedVisiter = setIdAs_Key(visiter) as BoxVisiter)
      : (updatedVisiter = null);
    return updatedVisiter;
  }

  async addRelation(
    _entityId: string,
    _entityRelation: Relation
  ): Promise<Array<Relation>> {
    const relationsOfEntity = await this.patch(
      `entities/${_entityId}/relations`,
      [_entityRelation]
    ).catch((error) => {
      console.log(`\n\n error from addrelation`, error);
    });
    return relationsOfEntity;
  }

  async updateRelation(
    _code: string,
    _relation: Array<Relation>
  ): Promise<Relation> {
    let relation: Relation;
    try {
      relation = await this.patch(
        `${this.BOX_VISITS}/${_code}/relations`,
        _relation
      );
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }
    return relation;
  }

  async CreateCustomFrameForBoxVisit(_code: string) {
    const storybox = await this.getByCode(_code);
    if (storybox) {
      const frameBody = createEntityBody(EntityTypes.Frame, '', '');
      let newFrame = await this.post(`entities`, JSON.parse(frameBody));

      const relation = createRelationTypeFromData(
        RelationType.StoryBox,
        newFrame.id,
        'entities/'
      );
      await this.addRelation(storybox?.id, relation);
      newFrame = setIdAs_Key(newFrame);
      return newFrame;
    }
  }

  async AddFrameToStory(
    _code: string,
    _frameInput: FrameInput
  ): Promise<BoxVisiter | null> {
    const frameId = setEntitiesIdPrefix(_frameInput.frameId);
    let updatedVisiter: BoxVisiter | null;
    const relations = await this.getRelations(_code);
    const stories = relations.filter(
      (_relation) => setEntitiesIdPrefix(_relation.key) == _frameInput.storyId
    );
    if (stories.length == 1) {
      let story = stories[0];
      if (!story.seen_frames) {
        story.seen_frames = [];
      }
      if (this.checkIfFrameAlreadySeen(story, frameId)) {
        story = this.findAndUpdateDateFromFrame(story, frameId);
        console.log('frame already exists');
      } else {
        story.seen_frames?.push(this.createSeenFrame(frameId));
      }
      await this.updateRelation(_code, [story]);
    } else {
      console.error(`No stories found for boxVisiter with code ${_code}`);
    }
    const visiter = await this.getByCode(_code);
    visiter != null
      ? (updatedVisiter = setIdAs_Key(visiter) as BoxVisiter)
      : (updatedVisiter = null);
    return updatedVisiter;
  }

  async AddTouchTableTime(_code: string): Promise<BoxVisiter | null> {
    let visiter = await this.getByCode(_code);
    if (visiter) {
      visiter = (await this.addUpdateProperty(
        visiter.id,
        'touch_table_time',
        new Date().toLocaleString('en-US', {
          hour12: false,
          hour: 'numeric',
          minute: 'numeric',
        }),
        'box_visits'
      )) as BoxVisiter;
    }
    visiter != null
      ? (visiter = setIdAs_Key(visiter) as BoxVisiter)
      : (visiter = null);
    return visiter;
  }

  createSeenFrame(_frameId: string): FrameSeen {
    return { id: `${_frameId}`, date: Math.round(Date.now() / 1000) };
  }

  async AddAssetToRelation(
    _code: string,
    _assetId: string,
    _type: RelationType
  ): Promise<Relation> {
    const relation: Relation = {
      key: setEntitiesIdPrefix(_assetId, true),
      type: _type,
      label: 'asset',
      order: Math.round(Date.now() / 1000),
    };
    const createdRelation = await this.updateRelation(_code, [relation]);
    return createdRelation;
  }

  checkIfFrameAlreadySeen(_relation: Relation, _frameId: string): boolean {
    let isExisting = false;
    if (_relation.seen_frames) {
      const matches = _relation.seen_frames.filter(
        (_frame) => setEntitiesIdPrefix(_frame?.id as string) == _frameId
      );
      if (matches.length > 0) isExisting = true;
    }
    return isExisting;
  }

  findAndUpdateDateFromFrame(_relation: Relation, _frameId: string): Relation {
    let updatedSeenFrames: Array<FrameSeen> = [];
    let newRelation = {} as Relation;
    Object.assign(newRelation, _relation);
    if (newRelation.seen_frames) {
      for (const relation of newRelation.seen_frames) {
        if (setEntitiesIdPrefix(relation?.id as string) == _frameId) {
          updatedSeenFrames.push({
            id: setEntitiesIdPrefix(_frameId),
            date: Math.round(Date.now() / 1000),
          } as FrameSeen);
        } else {
          updatedSeenFrames.push(relation as FrameSeen);
        }
      }
      newRelation.seen_frames = updatedSeenFrames;
    }
    return newRelation;
  }

  async updatedScanned(_code: string): Promise<BoxVisiter | null> {
    let count = 0;
    let visiter = await this.getByCode(_code);
    if (visiter !== null) {
      visiter.ticketUsed != undefined
        ? (count = visiter.ticketUsed! + 1)
        : (count = 1);
      visiter = (await this.addUpdateProperty(
        visiter.id,
        'ticketUsed',
        count,
        'box_visits'
      )) as BoxVisiter;
      visiter = setIdAs_Key(visiter) as BoxVisiter;
    }
    return visiter;
  }
}
