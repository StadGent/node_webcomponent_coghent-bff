import { Context } from '../types';
import { RESTDataSourceWithStaticToken } from '../RestDataSourceWithStaticToken';
import { environment as _ } from '../environment';
import { Collections, EntitiesResults, Entity, EntityTypes } from '../type-defs';
import { setIdAs_Key } from '../common';

export default class EntitiesStaticAPI extends RESTDataSourceWithStaticToken<Context>{
  public baseURL = `${_.api.collectionAPIUrl}/`;

  async getSixthCollectionObjectId() {
    return await this.get(`${Collections.Entities}/sixthcollection/id`);
  }

  async getEntityIdOfEntityType(_type: EntityTypes, _objectId: string, _collection: Collections = Collections.Entities): Promise<string | null> {
    let data = await this.get(`${_collection}?type=${_type}`) as EntitiesResults | null
    let id: null | string = null
    if (data && data.results) {
      if (data.results.length === 1) id = setIdAs_Key(data.results[0] as Entity).id
      else {
        const found = data.results.find(entity => entity?.object_id === _objectId)
        found ? id = setIdAs_Key(found).id : null
      }
    }
    return id
  }
}