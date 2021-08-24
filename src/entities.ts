import { Entity, Metadata, MetadataInput, MetaKey, MediaFile, Relation } from './type-defs';
import { RESTDataSource } from 'apollo-datasource-rest';
import { Context } from './types';

export class EntitiesAPI extends RESTDataSource<Context> {
  public baseURL = 'http://collection-api:8000/';

  private setId(entityRaw: any) {
    const filterdId = entityRaw.identifiers.filter(
      (id: string) => id.length === 9
    );
    entityRaw.id = filterdId.length === 1 ? filterdId[0] : 'noid';
    return entityRaw;
  }

  async getEntity(id: string): Promise<Entity> {
    const data = await this.get<Entity>(`entities/${id}`);
    this.setId(data);
    return data;
  }

  async getRelations(id: string): Promise<Relation[]> {
    return await this.get(`entities/${id}/relations`);
  }


  /*async getMediafiles(id: string): Promise<MediaFile[]> {
    return await this.get(`entities/${id}/mediafiles`);
  }*/

  async getMediafiles(id: string): Promise<MediaFile[]> {
    if(id !== 'noid' ) {
     return await this.get(`entities/${id}/mediafiles`);
   } else{
     return []
   }
 }

  async replaceMetadata(id: String, metadata: MetadataInput[]): Promise<Metadata[]> {
    return await this.put(`entities/${id}/metadata`, metadata);
  }
}
