import { EntitiesResults, RelationsResults, SearchFilter } from './type-defs';
import { setId, setIdsAs_Key } from './common';
import { Context } from './types';
import { environment as env } from './environment';
import { AuthRESTDataSource } from 'inuits-apollo-server-auth';
import { ParsedFilter } from './resolvers/search';

export class SearchAPI extends AuthRESTDataSource<Context> {
  public baseURL = `${env.api.searchAPIUrl}/`;
  private SEARCH = `search`
  private ADVANCED_SEARCH = `advanced-search`

  async getEntities(
    limit: number,
    skip: number,
    searchValue: SearchFilter,
    fetchPolicy: string
  ): Promise<EntitiesResults> {
    let body = searchValue;
    const data = await this.post(
      `${this.SEARCH}/collection?limit=${limit}&skip=${skip}`,
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

    const data = await this.post(`${this.SEARCH}/relations?`, body);
    data.results.forEach((element: any) => setId(element));
    return data;
  }

  async getByAdvancedFilters(
    _limit: number,
    _advancedFilters?: Array<ParsedFilter>
  ): Promise<EntitiesResults | null> {
    let data = await this.post(
      `${this.ADVANCED_SEARCH}?limit=${_limit}&skip=0`,
      _advancedFilters
    );
    data = setIdsAs_Key(data) as EntitiesResults
    return data
  }
}
