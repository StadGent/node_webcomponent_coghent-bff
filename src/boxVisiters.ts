import {
  Entity,
  Relation,
  EntitiesResults,
} from './type-defs';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { Context } from './types';
import { environment as env } from './environment';
import { setIdAs_Key, setIdsAs_Key } from './common';
import { UserInputError } from 'apollo-server-errors';

export class BoxVisitersAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${env.api.collectionAPIUrl}/`;
  private BOX_VISIT = 'box_visit';

  async createBoxVisiter(): Promise<Entity> {
    console.log('CREATE BOX VISIT');
    const model = `{
      "type": "${this.BOX_VISIT}",
      "metadata": [
          {
              "key": "type",
              "value": "${this.BOX_VISIT}",
              "language": "en"
          }
      ]
  }`;
    let visiter;
    try {
      visiter = await this.post(this.BOX_VISIT, JSON.parse(model));
      visiter = setIdAs_Key(visiter);
      console.log('visitre with set id', visiter);
    } catch (error) {
      throw new UserInputError(`${error}`);
    }
    return visiter;
  }

  async getBoxVisiters(): Promise<EntitiesResults> {
    const visiters = await this.get<EntitiesResults>(this.BOX_VISIT);
    return setIdsAs_Key(visiters);
  }

  async getBoxVisiterById(id: string): Promise<Entity> {
    let visiter = {id: 'noid', type: `${this.BOX_VISIT}`} as Entity;
    try {
      visiter = await this.get<Entity>(`${this.BOX_VISIT}/${id}`);  
    } catch (error) {
      visiter = await this.createBoxVisiter();
    }
    return setIdAs_Key(visiter);
  }

  async addFrameToVister(visterId: string, frameId: string): Promise<Array<Relation>> {
    const body = `[
      {
        "key": "entities/${frameId}",
        "type": "components",
        "date": "${new Date().toLocaleString()}"
      }
    ]`;
    let relations: Array<Relation> = [];
    try {
      relations = await this.patch(`${this.BOX_VISIT}/${visterId}/components`, JSON.parse(body))
    } catch (error) {
      console.log({ error });
    }
    return relations;
  }
}
