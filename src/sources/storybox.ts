import { environment as _ } from '../environment';
import { EntitiesAPI } from '../entities';
import { EntitiesResults, Entity, EntityTypes, Relation, StoryboxBuild } from '../type-defs';
import { AuthRESTDataSource } from 'inuits-apollo-server-auth';
import { Context } from '../types';
import { createEntityBody } from '../parsers/entities';
import { createRelationsOfStorybox } from '../parsers/storybox';
import { setId, setIdsAs_Key } from '../common';

export class StoryBoxAPI extends AuthRESTDataSource<Context> {
  public baseURL = `${_.api.collectionAPIUrl}/`;
  private STORY_BOX = 'story_box'
  private entities = new EntitiesAPI()

  async userStorybox(): Promise<EntitiesResults> {
    // console.log(`\n CONTEXT`, this.context.session) // DEV:

    let storybox = await this.get(`${this.STORY_BOX}`)
    storybox = setIdsAs_Key(storybox) as EntitiesResults
    return storybox
  }

  async create(_storyboxInfo: StoryboxBuild): Promise<Entity> {
    console.log(`\n CONTEXT`, this.context.session)

    let frame = await this.createFrame(_storyboxInfo.title ? _storyboxInfo.title : '', _storyboxInfo.description ? _storyboxInfo.description : '')
    frame = setId(frame)
    console.log(`\n => Created frame id`, frame.id)
    console.log(`\n => Created frame key`, frame._key)
    const relations = createRelationsOfStorybox(_storyboxInfo)
    await this.addRelations(frame.id, relations)
    return frame
  }

  async createFrame(_title: string, _description: string): Promise<Entity> {
    const frameBody = createEntityBody(EntityTypes.Frame, _title, _description)
    const newFrame = await this.post(`entities`, JSON.parse(frameBody))
    return newFrame
  }

  async addRelations(_entityId: string, _relations: Array<Relation>) {
    const newRelations = await this.patch(`entities/${_entityId}/relations`, _relations)
    return newRelations
  }

  async update(_storyboxInfo: StoryboxBuild): Promise<Entity> {
    const originalFrame = await this.entities.getEntity(_storyboxInfo.frameId!)
    console.log(`\n ORIGNAL FRAME`, originalFrame)
    console.log(`\n ORIGNAL FRAME metadata`, originalFrame.metadata)
    return originalFrame as Entity
  }
}