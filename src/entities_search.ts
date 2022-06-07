import { EntitiesResults, RelationsResults, SearchFilter } from './type-defs';
import { setId } from './common';
import { Context } from './types';
import { environment as env } from './environment';
import { AuthRESTDataSource } from 'inuits-apollo-server-auth';

export class SearchAPI extends AuthRESTDataSource<Context> {
    public baseURL = `${env.api.searchAPIUrl}/search/`;

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
