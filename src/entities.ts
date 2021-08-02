import { EntitiesResults, Entity, MetadataInput, MetaKey, MediaFile } from './type-defs';
import { AuthRESTDataSource } from './AuthRESTDataSource';
import { Context } from './types'


export class EntitiesAPI extends AuthRESTDataSource<Context> {
  constructor() {
    super();
    this.baseURL = 'http://collection-api:8000/';
  }

  private getId(entityRaw: any) {
    const filterdId = entityRaw.identifiers.filter((id: string) => id.length === 9);
    entityRaw.id = filterdId.length === 1 ? filterdId[0] : 'noid';
    return entityRaw;
  }

  async getEntity(id: string): Promise<Entity> {
    const data = await this.get<Entity>(`entities/${id}`);
    this.getId(data);
    return data;
  }

  async getEntities(limit: number, skip: number): Promise<EntitiesResults> {
    const data = await this.get(`entities`, { limit, skip });
    data.results.forEach((element: any) => this.getId(element));
    return data;
  }

  async getMediafiles(id: string): Promise<MediaFile[]> {
    return await this.get(`entities/${id}/mediafiles`);
  }

  async addMetadata(id: string, metadata: MetadataInput): Promise<Entity> {
    return await this.post(`entities/${id}/metadata`, metadata);
  }
  async replaceMetadata(id: String, metadata: MetadataInput[]): Promise<Entity> {
    return await this.put(`entities/${id}/metadata`, metadata);
  }
  async deleteMetadata(id: String, key: MetaKey): Promise<void> {
    return await this.delete(`entities/${id}/metadata/${key}`);
  }
}
