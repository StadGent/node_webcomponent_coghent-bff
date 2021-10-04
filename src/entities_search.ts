import { EntitiesResults, RelationsResults, SearchFilter } from './type-defs';
import { setId } from './common';
import { RESTDataSource } from 'apollo-datasource-rest';
import { Context } from './types';
import { environment as env } from './environment';

export class SearchAPI extends RESTDataSource<Context> {
  public baseURL = `http://${env.search_entities.hostname}:${env.search_entities.port}/${env.search_entities.prefix}/`;

  async getEntities(
    limit: number,
    skip: number,
    searchValue: SearchFilter,
    fetchPolicy: string
  ): Promise<EntitiesResults> {
    let body = searchValue;
    const data = await this.post(
      `collection?limit=${limit}&skip=${skip}`,
      body
    );
    data.results.forEach((element: any) => setId(element));
    return data;
  }

  async getRelations(
    searchValue: SearchFilter,
    fetchPolicy: string
  ): Promise<RelationsResults> {
    let body = searchValue;

    const data = await this.post(`relations?`, body);
    data.results.forEach((element: any) => setId(element));
    return data;
  }
}
