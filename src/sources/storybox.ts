import { environment as _ } from '../environment';
import { EntitiesAPI } from '../entities';
import { Entity, EntityTypes, Relation, RelationType, StoryboxBuild } from '../type-defs';
import { AuthRESTDataSource } from 'inuits-apollo-server-auth';
import { Context } from '../types';
import { UserAPI } from '../user';
import { createEntityBody } from '../parsers/entities';
import { createRelationsOfStorybox } from '../parsers/storybox';
import { setId } from '../common';

export class StoryBoxAPI extends AuthRESTDataSource<Context> {
  public baseURL = `${_.api.collectionAPIUrl}/`;
  private STORY_BOX = 'story_box'

  async getStorybox() {
    const storybox = await this.get(`${this.STORY_BOX}`)
    console.log('\n THE STORYBOX', storybox)
    return storybox
  }

  async create(_storyboxInfo: StoryboxBuild) {
    console.log(`\n URL `, this.baseURL);
    console.log(`\n SESSION`, this.context.session)
    console.log({ _storyboxInfo })

    // DEV: // TMP:
    // const user = new UserAPI().getMe(this.context.session.auth.accessToken!)
    // console.log(user)
    let frame = await this.createFrame(_storyboxInfo.title ? _storyboxInfo.title : '', _storyboxInfo.description ? _storyboxInfo.description : '')
    frame = setId(frame)
    console.log(`\n => Create frame`, frame.id)
    const relations = createRelationsOfStorybox(_storyboxInfo)
    const frameRelations = await this.addRelations(frame.id, relations)
    console.log(`\n => Created relations`, frameRelations)
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

}