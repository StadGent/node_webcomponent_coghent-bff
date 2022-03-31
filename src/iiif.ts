import { MediaInfo } from './type-defs';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { Context } from './types';
import { environment as env } from './environment';
import { splitFilenameAndExtension } from './common';

export class IiifAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${env.api.IiifAPIUrl}/`;

  async getInfo(id: string): Promise<MediaInfo> {
    console.log('GET INFO---------------')
    let returnValue = {
      width: '500',
      height: '500',
    };
    const filename = splitFilenameAndExtension(id, true)
    const data = await this.get<string>(`/iiif/3/${filename.name}${filename.extension}/info.json`)
      .then((data: any) => {
        returnValue = JSON.parse(data);
      })
      .catch((error) => {
        console.log('ERROR from catch', error)
        console.log(`ORIGINAL ID: ${id}`)
        console.log(`URL: ${this.baseURL}iiif/3/${filename.name}${filename.extension}/info.json`)
        console.error('No iiif info found for id ', filename.name + filename.extension);
      });
      console.log('GET INFO END-----------')
    return returnValue;
  }
}
