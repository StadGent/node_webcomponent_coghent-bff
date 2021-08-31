import {
  EntitiesResults, SearchFilter,
} from './type-defs'
import { setId } from './common'
import { AuthRESTDataSource } from 'inuits-apollo-server-auth';
import { Context } from './types';
import { getQuery } from './templateQueries';

export class SearchAPI extends AuthRESTDataSource<Context> {
  public baseURL = 'http://search-api:8002/search/';

  async getEntities(limit: number, skip: number, searchValue: SearchFilter, fetchPolicy: string): Promise<EntitiesResults> {
    let body = JSON.parse(getQuery(searchValue));
    
    const data = await this.post(`collection?limit=${limit}&skip=${skip}`, body);
    data.results.forEach((element: any) => setId(element));
    return data;
  }
}