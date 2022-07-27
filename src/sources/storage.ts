import { environment as _ } from '../environment';
import { Context } from '../types';
import FormData from 'form-data';
import { MediaFile } from '../type-defs';
import { AuthRESTDataSource } from 'inuits-apollo-server-auth';

export class StorageAPI extends AuthRESTDataSource<Context> {
  public baseURL = `${_.api.storageAPIUrl}/`;

  async uploadMediafile(_entityId: string, _file: any): Promise<MediaFile | null> {
    let response: null | MediaFile = null
    const form = new FormData()
    const { createReadStream, filename, mimetype, encoding, knownLength } = await _file;
    form.append('file', createReadStream(), {
      filename: filename,
      contentType: mimetype,
      knownLength: knownLength
    })

    const formHeaders = form.getHeaders();

    try {
      response = await this.post(`upload?id=${_entityId.replace(`mediafiles/`, '')}`, form, { headers: formHeaders })
    } catch (error: any) {
      console.error(`\n Uploading failed`, error.extensions.response.body ? error.extensions.response.body : error)
    }
    return response;
  }

}