import { environment as _ } from '../environment';
import { EntitiesAPI } from '../entities';
import {
  BoxVisiter,
  EntitiesResults,
  Entity,
  EntityTypes,
  Metadata,
  MetadataInput,
  MetaKey,
  Relation,
  RelationType,
  StoryboxBuild,
} from '../type-defs';
import { createEntityBody, filterOutRelationTypes } from '../parsers/entities';
import {
  createRelationsOfStorybox,
  setIdAndCustomObjectId,
  setObjectIdToCustomStorybox,
  updateMetadataField,
} from '../parsers/storybox';
import { setIdAs_Key, setIdsAs_Key } from '../common';

export class StoryBoxAPI extends EntitiesAPI {
  public baseURL = `${_.api.collectionAPIUrl}/`;
  private STORY_BOX = 'story_box';

  async userStorybox(): Promise<EntitiesResults> {
    // console.log(`\n CONTEXT`, this.context.session) // DEV:

    let storybox = await this.get(`${this.STORY_BOX}`);
    storybox = setIdsAs_Key(storybox) as EntitiesResults;
    return storybox;
  }

  async linkStorybox(_code: string): Promise<Entity> {
    let linkedStorybox: Entity = await this.post(
      `${this.STORY_BOX}/link/${_code}`
    );
    if (linkedStorybox != undefined) {
      linkedStorybox = setIdAs_Key(linkedStorybox) as Entity;
      linkedStorybox = setObjectIdToCustomStorybox(linkedStorybox);
      await this.replaceMetadata(
        linkedStorybox.id,
        linkedStorybox.metadata as Array<MetadataInput>
      );
    }
    return linkedStorybox;
  }

  async create(_storyboxInfo: StoryboxBuild): Promise<Entity> {
    let frame = await this.createFrame(
      _storyboxInfo.title ? _storyboxInfo.title : '',
      _storyboxInfo.description ? _storyboxInfo.description : ''
    );
    frame = setIdAs_Key(frame) as Entity;
    frame = setObjectIdToCustomStorybox(frame);
    return frame;
  }

  async createFrame(_title: string, _description: string): Promise<Entity> {
    const frameBody = createEntityBody(EntityTypes.Frame, _title, _description);
    let newFrame = await this.post(`entities`, JSON.parse(frameBody));
    newFrame = setIdAs_Key(newFrame);
    return newFrame;
  }

  async addRelations(_entityId: string, _relations: Array<Relation>) {
    const newRelations = await this.patch(
      `entities/${_entityId}/relations`,
      _relations
    );
    return newRelations;
  }

  async update(_storyboxInfo: StoryboxBuild): Promise<Entity> {
    let originalFrame = await this.getEntity(_storyboxInfo.frameId!);
    originalFrame = setIdAndCustomObjectId(originalFrame);
    const originalMetadata = await this.getMetadata(originalFrame.id);
    const originalRelationsAll = await this.getRelations(originalFrame.id);

    const relationsFromStorybox = createRelationsOfStorybox(_storyboxInfo);

    const otherRelations = filterOutRelationTypes(originalRelationsAll, [
      RelationType.Components,
    ]);

    const updatedRelationsAll = [...otherRelations, ...relationsFromStorybox];

    await this.replaceRelations(_storyboxInfo.frameId!, updatedRelationsAll);
    let newmetadata: Array<Metadata> = originalMetadata as Array<Metadata>;
    newmetadata = updateMetadataField(
      MetaKey.Title,
      _storyboxInfo.title!,
      newmetadata
    );
    newmetadata = updateMetadataField(
      MetaKey.Description,
      _storyboxInfo.description!,
      newmetadata
    );
    await this.replaceMetadata(
      _storyboxInfo.frameId!,
      newmetadata as Array<MetadataInput>
    );
    let updatedFrame = await this.getEntity(_storyboxInfo.frameId!);
    return setIdAndCustomObjectId(updatedFrame);
  }

  async linkFrameToVisiter(_frameId: string): Promise<BoxVisiter> {
    let visiter = await this.post(`/story_box/publish/${_frameId}`);
    visiter = setIdAs_Key(visiter) as BoxVisiter;
    return visiter;
  }
}
