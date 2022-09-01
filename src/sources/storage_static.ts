import { environment as _ } from '../environment';
import { Context } from '../types';
import FormData from 'form-data';
import { MediaFile } from '../type-defs';
import { RESTDataSourceWithStaticToken } from '../RestDataSourceWithStaticToken';
import CryptoJS from 'crypto-js';
import { Base64 } from 'js-base64';

export class StorageStaticAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${_.api.storageAPIUrl}/`;

  async uploadMediafile(
    _entityId: string,
    _file: any
  ): Promise<MediaFile | null> {
    let response: null | MediaFile = null;
    const form = new FormData();
    const { createReadStream, filename, mimetype, encoding, knownLength } =
      await _file;
    form.append('file', createReadStream(), {
      filename: filename,
      contentType: mimetype,
      knownLength: knownLength,
    });

    const formHeaders = form.getHeaders();

    try {
      response = await this.post(
        `upload?id=${_entityId.replace(`mediafiles/`, '')}`,
        form,
        { headers: formHeaders }
      );
    } catch (error: any) {
      console.error(
        `\n Uploading failed`,
        error.extensions.response.body ? error.extensions.response.body : error
      );
    }
    return response;
  }

  async checkIfUploadedIsDuplicate(base64Image: string) {
    const md5sum = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(base64Image));
    const isDuplicate = await this.get(`unique/${md5sum}`);
    return { result: isDuplicate };
  }
}
