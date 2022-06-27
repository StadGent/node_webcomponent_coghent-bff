import { Position, Relation, RelationType } from '../type-defs';
import { filterOutRelationTypes, filterByRelationTypes } from './entities';

const wallFullWidth = 5760
const wallFullHeight = 1080
const zones = 6
const zoneWidth = wallFullWidth / zones

export const calculatePositions = (_assets: Array<Relation>) => {
  const assetsLeft = Math.floor(_assets.length / 2)
  const assetsRight = _assets.length - assetsLeft

  const singleAssetViewLeft = (zoneWidth * 2) / assetsLeft
  const singleAssetViewRight = (zoneWidth * 2) / assetsRight

  const positions: Array<Position> = []

  positions.push(...positionsXForAssets(assetsLeft, singleAssetViewLeft))
  positions.push(...positionsXForAssets(assetsRight, singleAssetViewRight, true))

  return positions
}

const positionsXForAssets = (_assets: number, _width: number, _positiveSide = false) => {
  let positionsX = []
  const firstAssetPosition = zoneWidth + (_width / 2)
  positionsX.push(createPositionObject(-firstAssetPosition, 0, 0))
  for (let index = 1;index < _assets;index++) {
    positionsX.push(createPositionObject(-(firstAssetPosition + (index * zoneWidth)), 0, 0))
  }
  if (_positiveSide) positionsX = positionsX.map(_pos => createPositionObject(Math.abs(_pos.x!), _pos.y!, _pos.z!))
  return positionsX
}

const createPositionObject = (x: number, y: number, z: number) => { return { x: x, y: y, z: z } as Position }

export const updatedComponentRelationsWithPositions = (_relations: Array<Relation>) => {
  const positions = calculatePositions(_relations)
  _relations = _relations.sort((one, two) => one.timestamp_start! - two.timestamp_start!)
  if (_relations.length > 0) {
    for (let index = 0;index < _relations.length;index++) {
      _relations[index].position = positions[index]
    }
  }
  return _relations
}

export const getUpdateRelations = (_relations: Array<Relation>) => {
  let relationOthers = filterOutRelationTypes(_relations, [RelationType.Components])
  let relationComponents = filterByRelationTypes(_relations, [RelationType.Components])
  relationComponents = updatedComponentRelationsWithPositions(relationComponents)

  return [...relationOthers, ...relationComponents]
}