import { Context } from '../types';
import { RESTDataSourceWithStaticToken } from '../RestDataSourceWithStaticToken';
import { environment as _ } from '../environment';
import { Collections } from '../type-defs';

export default class EntitiesStaticAPI extends RESTDataSourceWithStaticToken<Context>{
  public baseURL = `${_.api.collectionAPIUrl}/`;

  async getSixthCollectionObjectId() {
    return await this.get(`${Collections.Entities}/sixthcollection/id`);
  }

}