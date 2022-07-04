import { environment as _ } from '../environment';
import { EntitiesAPI } from '../entities';
import {
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
import {
  createEntityBody,
  filterByRelationTypes,
  filterOutRelationTypes,
  mergeRelations,
} from '../parsers/entities';
import {
  createMetadataTypeFromData,
  createRelationsOfStorybox,
  setIdAndCustomObjectId,
  setObjectIdToCustomStorybox,
  updateMetadataField,
} from '../parsers/storybox';
import { setIdAs_Key, setIdsAs_Key } from '../common';

export class StoryBoxAPI extends EntitiesAPI {
  public baseURL = `${_.api.collectionAPIUrl}/`;
  private STORY_BOX = 'story_box';
  private entities = new EntitiesAPI();

  async userStorybox(): Promise<EntitiesResults> {
    //console.log(`\n CONTEXT`, this.context.session) // DEV:

    let storybox = await this.get(`${this.STORY_BOX}`);
    storybox = setIdsAs_Key(storybox) as EntitiesResults;
    return storybox;
  }

  async linkStorybox(_code: string): Promise<Entity> {
    let linkedStorybox: Entity = await this.post(
      `${this.STORY_BOX}/link/${_code}`
    );
    linkedStorybox = setIdAs_Key(linkedStorybox) as Entity;
    linkedStorybox = setObjectIdToCustomStorybox(linkedStorybox);

    let copiedMetadata: Array<Metadata> = [];
    Object.assign(
      copiedMetadata,
      linkedStorybox.metadata ? linkedStorybox.metadata : []
    );
    copiedMetadata.push(createMetadataTypeFromData(MetaKey.BoxCode, _code));

    await this.replaceMetadata(
      linkedStorybox.id,
      copiedMetadata as Array<MetadataInput>
    );
    let frameFromCode = await this.getEntity(linkedStorybox.id);
    frameFromCode = setIdAndCustomObjectId(frameFromCode);
    return frameFromCode;
  }

  async create(_storyboxInfo: StoryboxBuild): Promise<Entity> {
    let frame = await this.createFrame(
      _storyboxInfo.title ? _storyboxInfo.title : '',
      _storyboxInfo.description ? _storyboxInfo.description : ''
    );
    frame = setIdAs_Key(frame) as Entity;
    frame = setObjectIdToCustomStorybox(frame);
    console.log(`\n => Created frame id`, frame.id);
    console.log(`\n => Created frame key`, frame._key);
    // const relations = createRelationsOfStorybox(_storyboxInfo);
    // await this.addRelations(frame.id, relations);
    return frame;
  }

  async createFrame(_title: string, _description: string): Promise<Entity> {
    const frameBody = createEntityBody(EntityTypes.Frame, _title, _description);
    const newFrame = await this.post(`entities`, JSON.parse(frameBody));
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

    const updatedRelationsAll = [
      ...otherRelations,
      ...relationsFromStorybox,
    ];

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
    console.log(`\n UPDATED FRAME WITH IDS SET`, setIdAndCustomObjectId(updatedFrame))
    return setIdAndCustomObjectId(updatedFrame);
  }
}
