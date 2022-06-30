import { PADDING, wallFullWidth, zoneWidth } from '../resolvers/customStory';
import { Position, Relation, RelationType } from '../type-defs';
import { filterOutRelationTypes, filterByRelationTypes } from './entities';

export type Dimension = { width: number, height: number }

type DynamicPosition = {
  assetsLeft: number,
  assetsRight: number,
  spaceleft: number,
  spaceright: number,
}

export const calculateSpaceForAssets = (_assets: number) => {
  const assetsLeft = Math.floor(_assets / 2)
  const assetsRight = _assets - assetsLeft

  const singleAssetViewLeft = ((wallFullWidth / 2) - (zoneWidth / 2)) / assetsLeft
  const singleAssetViewRight = ((wallFullWidth / 2) - (zoneWidth / 2)) / assetsRight

  return {
    assetsLeft: assetsLeft,
    assetsRight: assetsRight,
    spaceleft: singleAssetViewLeft - PADDING,
    spaceright: singleAssetViewRight - PADDING,
  } as DynamicPosition
}

export const calculatePositions = (_assets: Array<Relation>) => {
  const space = calculateSpaceForAssets(_assets.length)
  
  const positions: Array<Position> = []

  positions.push(...positionsXForAssets(space.assetsLeft, space.spaceleft))
  positions.push(...positionsXForAssets(space.assetsRight, space.spaceright, true))
  return positions
}

const positionsXForAssets = (_assets: number, _width: number, _positiveSide = false) => {
  let positionsX = []
  const firstAssetPosition = (zoneWidth / 2) + (_width / 2)
  positionsX.push(createPositionObject(-firstAssetPosition, 0, 0))
  for (let index = 1;index < _assets;index++) {
    const x = firstAssetPosition + (index * _width)
    positionsX.push(createPositionObject(x && x != Infinity ? -(x) : 0, 0, 0))
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
      _relations[index].x = positions[index].x
      _relations[index].y = positions[index].y
      _relations[index].z = positions[index].z
      // TMP: 
      _relations[index].scale = 1
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

export const calculateScale = async (_width: number, _height: number, _availableSpace: Dimension): Promise<number> => {
  let scale = 1;
  return new Promise((resolve, reject) => {


    if (_width === _height) {
      const factor = _width / _availableSpace.width
      resolve(1 / factor)
    }
    if (_width > _height) {
      const factor = _width / _availableSpace.width
      resolve(1 / factor)
    }

    if (_width < _height) {
      const factor = _height / _availableSpace.height
      resolve(1 / factor)
    }
    if (_width < _availableSpace.width && _width > _height) resolve(scale)
    if (_height < _availableSpace.height && _width < _height) resolve(scale)
    resolve(1)
  })
}