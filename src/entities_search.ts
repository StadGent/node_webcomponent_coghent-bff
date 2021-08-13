import {
  EntitiesResults,
} from './type-defs';
import { RESTDataSource } from 'apollo-datasource-rest';
import { Context } from './types';

export class SearchAPI extends RESTDataSource<Context> {
  public baseURL = 'http://search-api:8002/search/';

  private setId(entityRaw: any) {
    const filterdId = entityRaw.identifiers.filter(
      (id: string) => id.length === 9
    );
    entityRaw.id = filterdId.length === 1 ? filterdId[0] : 'noid';
    return entityRaw;
  }

  async getEntities(limit: number, skip: number, query?: string): Promise<EntitiesResults> {
    const data = await this.get(`collection`, { limit, skip, query });
    data.results.forEach((element: any) => this.setId(element));
    return data;
  }
}
