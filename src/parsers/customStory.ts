import { ASSET_MARGIN, PADDING, wallFullWidth, zoneWidth } from '../resolvers/customStory';
import { Position, Relation, RelationType } from '../type-defs';
import { filterOutRelationTypes, filterByRelationTypes } from './entities';
import { createTimingForAsset } from './storybox';

const MINIMUM_DURATION = 5

export type Dimension = { width: number, height: number }

type DynamicPosition = {
  assetsLeft: number,
  assetsRight: number,
  spaceleft: number,
  spaceright: number,
}

export const calculateSpaceForAssets = (_assets: number) => {
  let assetsLeft = 1
  let assetsRight = 0

  let singleAssetViewLeft = ((wallFullWidth / 2) - (zoneWidth / 2))
  let singleAssetViewRight = 0
  if (_assets > 1) {
    assetsLeft = Math.floor(_assets / 2)
    assetsRight = _assets - assetsLeft

    singleAssetViewLeft = ((wallFullWidth / 2) - (zoneWidth / 2)) / assetsLeft
    singleAssetViewRight = ((wallFullWidth / 2) - (zoneWidth / 2)) / assetsRight
  }

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
  positions.sort((posA, posB) => posA.x! - posB.x!)
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

const updateRelationsWithMinimumDuration = (_relations: Array<Relation>, _minimumDuration: number) => {
  const updatedRelations: Array<Relation> = []
  let updateAllFollowingTimestamps = false
  for (let index = 0;index < _relations.length;index++) {
    const updatedRelation = {} as Relation
    Object.assign(updatedRelation, _relations[index])
    let previousEndTime = 0
    if (updatedRelations.length >= 1) {
      previousEndTime = updatedRelations[updatedRelations.length - 1].timestamp_end!
    }
    if (updateAllFollowingTimestamps === false) {
      if (
        !updatedRelation.timestamp_start ||
        !updatedRelation.timestamp_end ||
        !updatedRelation.timestamp_zoom) {
        updateAllFollowingTimestamps = true
        const _ = createTimingForAsset(previousEndTime + 1, MINIMUM_DURATION)
        updatedRelation.timestamp_start = _.start
        updatedRelation.timestamp_zoom = _.zoom
        updatedRelation.timestamp_end = _.end

      } else if (
        updatedRelation.timestamp_start &&
        updatedRelation.timestamp_end &&
        updatedRelation.timestamp_zoom &&
        (updatedRelation.timestamp_end! - updatedRelation.timestamp_zoom!) < _minimumDuration) {
        updateAllFollowingTimestamps = true
        const _ = createTimingForAsset(previousEndTime + 1, MINIMUM_DURATION)
        updatedRelation.timestamp_start = _.start
        updatedRelation.timestamp_zoom = _.zoom
        updatedRelation.timestamp_end = _.end
      }
    } else {
      const _ = createTimingForAsset(previousEndTime + 1, MINIMUM_DURATION)
      updatedRelation.timestamp_start = _.start
      updatedRelation.timestamp_zoom = _.zoom
      updatedRelation.timestamp_end = _.end
    }
    updatedRelations.push(updatedRelation)
  }
  console.log(`\n==`)
  console.log(`\n _relations updated`, updatedRelations)
  console.log(`\n==`)
}

export const getUpdateRelations = (_relations: Array<Relation>) => {
  let relationOthers = filterOutRelationTypes(_relations, [RelationType.Components])
  let relationComponents = filterByRelationTypes(_relations, [RelationType.Components])
  relationComponents = updatedComponentRelationsWithPositions(relationComponents)
  updateRelationsWithMinimumDuration(relationComponents, MINIMUM_DURATION)
  return [...relationOthers, ...relationComponents]
}

export const calculateScale = async (_width: number, _height: number, _availableSpace: Dimension): Promise<number> => {
  let scale = 0;
  return new Promise((resolve, reject) => {
    if (_width === null || _height === null) resolve(1)
    while (((_width * scale) <= _availableSpace.width - ASSET_MARGIN) && (_height * scale) <= _availableSpace.height - ASSET_MARGIN) {
      if (scale < 1) {
        scale += 0.0001
      }
    }
    resolve(scale)
  })
}