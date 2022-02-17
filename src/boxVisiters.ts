import {
  EntitiesResults,
} from './type-defs';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { Context } from './types';
import { environment as env } from './environment';
import { setIdsAs_Key } from './common';

export class BoxVisitersAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${env.api.collectionAPIUrl}/`;
  private BOX_VISIT = 'box_visit';

  async getBoxVisiters(): Promise<EntitiesResults> {
    const visiters = await this.get<EntitiesResults>(this.BOX_VISIT);
    return setIdsAs_Key(visiters);
  }
}
