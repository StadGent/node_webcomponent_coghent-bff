import { BoxVisitersAPI } from '../boxVisiters';
import { setEntitiesIdPrefix } from '../common';
import { Relation, RelationType } from '../type-defs';
import { environment as env } from '../environment';
import { AuthenticationError } from 'apollo-server-express';


export class BoxVisitersAuthAPI extends BoxVisitersAPI {

  constructor() {
    super()
  }

  checkAuthSession() {
    if (this.context.session.auth) {
      return
    } else throw new AuthenticationError('\n GRAPHQL | BoxVisitersAuthAPI | Auth session needed for this request.')
  }

  async AddAssetToRelation(
    _code: string,
    _assetId: string,
    _type: RelationType
  ): Promise<Relation> {
    // this.checkAuthSession()
    const relation: Relation = {
      key: setEntitiesIdPrefix(_assetId, true),
      type: _type,
      label: 'asset',
      order: Math.round(Date.now() / 1000),
    };
    const createdRelation = await this.updateRelation(_code, [relation]);
    return createdRelation;
  }

  async getRelationOfType(_id: string, _type: RelationType): Promise<Array<Relation>> {
    // this.checkAuthSession()
    const relations = await this.getRelations(_id)
    return relations.filter(_relation => _relation.type == _type)
  }
}