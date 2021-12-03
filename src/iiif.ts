import { MediaInfo } from './type-defs';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { Context } from './types';
import { environment as env } from './environment';

export class IiifAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${env.api.IiifAPIUrl}/`;

  async getInfo(id: string): Promise<MediaInfo> {
    const data = await this.get<string>(`/iiif/3/${id}/info.json`);

    return JSON.parse(data);
  }
}
