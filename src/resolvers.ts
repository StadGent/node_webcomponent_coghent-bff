import {
  Entity,
  Metadata,
  Relation,
  RelationType,
  Resolvers,
  MetaKey,
  ComponentType,
  Maybe,
  MetadataCollection,
  MediaInfo,
  EntitiesResults,
  BoxVisiter,
  StoryInput,
  Ticket,
  MimeType,
  StoryboxBuild,
  EntityInfo,
  EntityTypes,
  Collections,
  MediaFile,
  Publication,
  UploadComposable,
  MetadataInput,
  RelationInput,
  UserAction,
} from './type-defs';
import { Context, DataSources } from './types';
import { AuthenticationError } from 'apollo-server';
import 'apollo-cache-control';
import { environment } from './environment';
import {
  filterByRelationTypes,
  filterOnEntityType,
  filterOutRelationTypes,
  getMetadataOfKey,
  getRelationsFromMetadata,
  mergeMetadata,
  mergeRelations,
} from './parsers/entities';
import {
  setEntitiesIdPrefix,
  setIdAs_Key,
  splitFilenameAndExtension,
  subtitleFileExtensions,
} from './common';
import {
  AudioMIME,
  checkEnumOnType,
  getFileType,
  MIMETYPES,
  VideoMIME,
  PDFMIME,
  ImageMIME,
} from './sources/enum';
import { setMediafileOnAsset } from './resolvers/relationMetadata';
import { sortRelationmetadataOnTimestampStart } from './parsers/story';
import {
  getBasketEntityRelationsAsEntities,
  getEntityData,
  setRelationValueToDefaultTitleOrFullname,
} from './resolvers/entities';
import { createRelationTypeFromData } from './parsers/storybox';
import { prepareCustomStory } from './resolvers/customStory';
import { getVisiterOfEntity } from './resolvers/boxVisiter';
import { getRelationsForUpload } from './resolvers/search';
import {
  getMediafileLink,
  getPublicationKeyFromValue,
  getRightFromMediafile,
} from './resolvers/upload';
import { proxyLinks, SIXTH_COLLECTION } from './sources/constants';

const GraphQLUpload = require('graphql-upload/GraphQLUpload.js');
let sixthCollectionId: null | string = null;

export const resolvers: Resolvers<Context> = {
  Upload: GraphQLUpload,
  Query: {
    PrintBoxTicket: (_source, { code }, { dataSources }) => {
      const ticket = dataSources.TicketsAPI.print(code);
      const body = {
        data: ticket,
      };
      return { code: code, body: JSON.stringify(body) } as Ticket;
    },
    ActiveBox: async (_source, { id }, { dataSources }) => {
      let _id = null;
      id ? (_id = id) : null;
      const stories = await getActiveStories(dataSources, _id);
      return { count: stories.length, results: stories } as EntitiesResults;
    },
    BoxVisiters: async (_source, _args, { dataSources }) => {
      const visiters = await dataSources.BoxVisitersAPI.getBoxVisiters();
      return visiters;
    },
    BoxVisiterByCode: async (_source, { code }, { dataSources }) => {
      const visiter = await dataSources.BoxVisitersAPI.getByCode(code);
      const relations = await dataSources.BoxVisitersAPI.getRelations(code);
      const storyBoxes = filterByRelationTypes(relations, [
        RelationType.StoryBox,
      ]).reverse();
      if (storyBoxes && visiter) {
        let entity = await dataSources.EntitiesAPI.getEntitiesOfRelationIds(
          storyBoxes.map((_relation) => _relation.key)
        );
        visiter.storyboxes = entity;
      }
      return visiter;
    },
    BoxVisiterRelationsByType: async (
      _source,
      { code, type },
      { dataSources }
    ) => {
      const relations = await dataSources.BoxVisitersAPI.getRelations(code);
      return filterByRelationTypes(relations, [type]).reverse();
    },
    BasketByCustomFrameId: async (_source, { frameId }, { dataSources }) => {
      const relations =
        await dataSources.BoxVisitersAPI.getBasketItemsByFrameId(frameId);
      return relations;
    },
    CreateBoxVisiter: async (_source, { storyId }, { dataSources }) => {
      const visiter = await dataSources.BoxVisitersAPI.create(storyId);
      return visiter;
    },
    Stories: async (_source, _args, { dataSources }) => {
      return dataSources.EntitiesAPI.getStories();
    },
    GetStoryById: async (_source, { id }, { dataSources }) => {
      await prepareCustomStory(dataSources, id);
      const story = await dataSources.EntitiesAPI.getEntity(id);
      return story;
    },
    CreateEntity: async (_source, { entityInfo }, { dataSources }) => {
      const entity = await dataSources.EntitiesAPI.createEntity(
        entityInfo as EntityInfo
      );
      return entity;
    },
    Entity: async (_source, { id }, { dataSources }, info) => {
      info.cacheControl.setCacheHint({ maxAge: 3600 });
      const result = id ? await dataSources.EntitiesAPI.getEntity(id) : null;
      try {
        if (result) {
          //@ts-ignore
          result.ldesResource = result.data['foaf:page'] || '';
        }
      } catch (e) {
        console.log(e);
      }

      return result;
    },
    Entities: async (
      _source,
      { limit, skip, searchValue, fetchPolicy },
      { dataSources }
    ) => {
      return dataSources.SearchAPI.getEntities(
        limit || 20,
        skip || 0,
        searchValue,
        fetchPolicy || ''
      );
    },
    User: async (_source, {}, { dataSources, session }) => {
      if (!session.auth?.accessToken) {
        throw new AuthenticationError('Not authenticated');
      }
      return dataSources.UserAPI.getMe(session.auth.accessToken);
    },
    RelationsAsEntities: async (_source, { id }, { dataSources }) => {
      return await getBasketEntityRelationsAsEntities(id, dataSources);
    },
    LinkStorybox: async (_source, { code }, { dataSources }) => {
      const link = await dataSources.StoryBoxAPI.linkStorybox(code);
      return link;
    },
    CreateStorybox: async (_source, { storyboxInfo }, { dataSources }) => {
      let frame: Entity | null = null;
      if (Object.keys(storyboxInfo).length > 0) {
        if (storyboxInfo.frameId === null) {
          frame = await dataSources.StoryBoxAPI.create(
            storyboxInfo as StoryboxBuild
          );
        } else {
          frame = await dataSources.StoryBoxAPI.update(
            storyboxInfo as StoryboxBuild
          );
        }
      }
      frame != null ? (frame = setIdAs_Key(frame) as Entity) : null;
      return frame;
    },
    Storybox: async (_source, _args, { dataSources }) => {
      const userStorybox = await dataSources.StoryBoxAPI.userStorybox();
      return userStorybox;
    },
    AddEntityAsRelation: async (
      _source,
      { entityId, entityRelationId },
      { dataSources }
    ) => {
      const relation = createRelationTypeFromData(
        RelationType.Components,
        entityRelationId,
        'entities/'
      );
      return await dataSources.EntitiesAPI.addRelation(entityId, relation);
    },
    LinkTestimonyToAsset: async (
      _source,
      { assetId, testimonyId },
      { dataSources }
    ) => {
      const relations = await dataSources.TestimonyAPI.linkTestimonyWithAsset(
        assetId,
        testimonyId
      );
      return relations;
    },
    GetTestimoniesOfUser: async (_source, {}, { dataSources }) => {
      const userTestimonies: Entity[] =
        await dataSources.EntitiesAPI.getEntitiesByEntityType(
          EntityTypes.Testimony,
          true
        );
      await Promise.all(
        userTestimonies.map(async (testimony) => {
          await dataSources.TestimonyAPI.getParentEntityForTestimony(testimony);
        })
      );
      return userTestimonies;
    },
    GetTestimoniesOfAsset: async (_source, { assetId }, { dataSources }) => {
      return await dataSources.TestimonyAPI.getTestimoniesByAssetId(assetId);
    },
    LinkFrameToVisiter: async (_source, { frameId }, { dataSources }) => {
      return frameId != ''
        ? await dataSources.StoryBoxAPI.linkFrameToVisiter(frameId)
        : null;
    },
    GetvisiterOfEntity: async (_source, { id }, { dataSources }) => {
      const parentEntity = await dataSources.EntitiesAPI.getEntity(id);
      return await getVisiterOfEntity(parentEntity, dataSources);
    },
    CheckIfUploadIsDuplicate: async (
      _source,
      { base64Image },
      { dataSources }
    ) => {
      const isDuplicate =
        await dataSources.StorageStaticAPI.checkIfUploadedIsDuplicate(
          base64Image
        );
      return isDuplicate;
    },
    CreateSubtitlesForUpload: async (parent, { frameId }, { dataSources }) => {
      const subtitlesResult: string =
        await dataSources.StoryBoxAPI.createSubtitlesForUpload(frameId);
      return { result: subtitlesResult };
    },
    GetUploadRelations: async (_source, { searchValue }, { dataSources }) => {
      const filters = getRelationsForUpload(searchValue);
      const data = await dataSources.SearchAPI.getByAdvancedFilters(
        20,
        filters
      );
      if (data && data.results) {
        for (const entity of data.results) {
          if (
            entity?.type === EntityTypes.Getty ||
            entity?.type === EntityTypes.Person
          ) {
            entity!.id = `entities/${entity?.id}`;
          }
        }
      }
      return data;
    },
    GetMyUploadedAssets: async (_source, {}, { dataSources }) => {
      let uploadedEntities = await dataSources.UserAPI.myAssetCreations();
      return uploadedEntities;
    },
    UploadObjectFromEntity: async (_source, { entityId }, { dataSources }) => {
      const uploadComposable: UploadComposable = {};
      const entity = await dataSources.EntitiesAPI.getEntity(entityId);
      if (entity) {
        Promise.allSettled([
          (uploadComposable.metadata =
            await dataSources.EntitiesAPI.getMetadata(entity.id)),
          (uploadComposable.relations =
            await dataSources.EntitiesAPI.getRelationOfType(
              entity.id,
              RelationType.Components
            )),
        ]);
        uploadComposable.relations.length >= 1
          ? await setRelationValueToDefaultTitleOrFullname(
              uploadComposable.relations as Array<Relation>,
              dataSources
            )
          : null;

        const action = getMetadataOfKey(entity, MetaKey.UserAction);
        action !== undefined
          ? (uploadComposable.action = action?.value! as UserAction)
          : null;

        if (
          uploadComposable.metadata &&
          uploadComposable.metadata.length >= 1
        ) {
          let publicationStatus: null | Metadata = null;

          entity !== undefined
            ? (publicationStatus = getMetadataOfKey(
                entity,
                MetaKey.PublicationStatus
              ))
            : null;

          if (publicationStatus !== undefined) {
            const key = await getPublicationKeyFromValue(
              publicationStatus!.value!
            );
            let mediafiles: Array<MediaFile> = [];
            if (key === Publication.Public) {
              mediafiles.push(
                ...(await dataSources.EntitiesAPI.getMediafiles(entity.id))
              );
            } else if (
              key === Publication.Private ||
              key === Publication.Validate
            ) {
              mediafiles.push(
                ...(await dataSources.EntitiesAPI.getMediafiles(
                  entity.id,
                  false
                ))
              );
            }
            uploadComposable.file_location = getMediafileLink(mediafiles);
            const right = getRightFromMediafile(
              mediafiles,
              uploadComposable.file_location as string | null
            );
            right !== null
              ? (uploadComposable.liscense = right.value)
              : (uploadComposable.liscense = right);
          }
        }
      }
      return uploadComposable;
    },
    async PublishStorybox(parent, { frameId }, { dataSources }) {
      return await dataSources.StoryBoxAPI.publishStorybox(frameId);
    },
  },
  Mutation: {
    replaceMetadata: async (_source, { id, metadata }, { dataSources }) => {
      return dataSources.EntitiesAPI.replaceMetadata(id, metadata);
    },
    AddStoryToBoxVisiter: async (
      _source,
      { code, storyId },
      { dataSources }
    ) => {
      let updatedVisiter: BoxVisiter | null;
      const visiterRelations = await dataSources.BoxVisitersAPI.getRelations(
        code
      );
      const storyMatches = visiterRelations?.filter(
        (_relation) =>
          _relation.key.replace('entities/', '') == storyId &&
          _relation.type == RelationType.Stories
      );
      if (storyMatches.length > 0) {
        console.log(
          `Story with id ${storyId} was already added tot the box_visiter.`
        );
        updatedVisiter = await dataSources.BoxVisitersAPI.getByCode(code);
      } else {
        const storyToAdd = await dataSources.EntitiesAPI.getEntity(storyId);
        const frameRelationsOfStory =
          await dataSources.EntitiesAPI.getRelationOfType(
            storyToAdd.id,
            RelationType.Frames
          );
        updatedVisiter = await dataSources.BoxVisitersAPI.AddStory(code, {
          id: storyId,
          total_frames: frameRelationsOfStory.length,
        } as StoryInput);
      }
      return updatedVisiter;
    },
    AddRelation: async (
      _source,
      { entityId, relation, collection },
      { dataSources }
    ) => {
      return await dataSources.EntitiesAPI.addRelation(
        entityId,
        relation,
        collection == 'entities' ? 'entities' : 'box_visits'
      );
    },
    AddFrameToStoryBoxVisiter: async (
      _source,
      { code, frameInput },
      { dataSources }
    ) => {
      return await dataSources.BoxVisitersAPI.AddFrameToStory(code, frameInput);
    },
    AddAssetToBoxVisiter: async (
      _source,
      { code, assetId, type },
      { dataSources }
    ) => {
      const visiter = await dataSources.BoxVisitersAPI.getByCode(code);
      let storyboxId: string | null = null;
      let storyboxAssets: Array<Relation> = [];
      if (visiter && type === RelationType.Components) {
        const boxVisiterRelations: Relation[] =
          await dataSources.BoxVisitersAPI.getRelations(code);

        let storyboxRelations = filterByRelationTypes(boxVisiterRelations, [
          RelationType.StoryBox,
        ]);
        storyboxRelations.length === 1
          ? (storyboxId = setEntitiesIdPrefix(storyboxRelations[0].key, false))
          : null;

        if (storyboxId == null) {
          const frame = await dataSources.StoryBoxAPI.createFrame(
            'Verhaal',
            'Verhaal gecreeerd op de touchtable in de Coghent box.'
          );
          storyboxId = frame.id;
          const storyboxRelation = createRelationTypeFromData(
            RelationType.StoryBox,
            frame.id,
            'entities/'
          );
          storyboxAssets = await dataSources.EntitiesAPI.addRelation(
            visiter.id,
            storyboxRelation,
            'box_visits'
          );
        }
        const assetRelation = createRelationTypeFromData(
          type,
          assetId,
          'entities/'
        );
        await dataSources.EntitiesAPI.addRelation(storyboxId, assetRelation);
        storyboxAssets = await dataSources.EntitiesAPI.getRelationOfType(
          storyboxId,
          RelationType.Components
        );
      } else if (visiter && type === RelationType.Visited) {
        const visitedRelation = createRelationTypeFromData(
          type,
          assetId,
          'entities/'
        );
        await dataSources.EntitiesAPI.addRelation(
          visiter.id,
          visitedRelation,
          'box_visits'
        );
        storyboxAssets = await dataSources.EntitiesAPI.getRelations(
          visiter.id,
          'box_visits'
        );
      }
      return storyboxAssets;
    },
    DeleteBoxVisiterBasketItem: async (
      _source,
      { code, relationId },
      { dataSources }
    ) => {
      const visiterRelations = await dataSources.EntitiesAPI.getRelations(
        code,
        'box_visits'
      );
      let updatedRelations: Relation[] = [];
      if (visiterRelations.length > 0) {
        try {
          const found = visiterRelations.find(
            (relation) => relation.type === RelationType.StoryBox
          );
          if (found) {
            const frameId: string = found.key.replace('entities/', '');
            await dataSources.EntitiesAPI.deleteRelations(frameId, [
              { key: 'entities/' + relationId, type: RelationType.Components },
            ]);
            updatedRelations = await dataSources.EntitiesAPI.getRelations(
              frameId
            );
          }
        } catch (error) {
          console.error(
            `Could not find storybox for boxvisit with code: ${code}`
          );
        }
      }
      return updatedRelations;
    },
    DeleteEntity: async (_source, { id }, { dataSources }) => {
      return await dataSources.EntitiesAPI.deleteEntity(id);
    },
    UpdatedScannedOfBoxvisiter: async (_source, { code }, { dataSources }) => {
      return await dataSources.BoxVisitersAPI.updatedScanned(code);
    },
    AddTouchTableTime: async (_source, { _code }, { dataSources }) => {
      const updatedVisitor = await dataSources.BoxVisitersAPI.AddTouchTableTime(
        _code
      );
      return updatedVisitor;
    },
    UploadMediafile: async (
      _source,
      { media, file, relations, metadata },
      { dataSources }
    ) => {
      relations ? relations : (relations = []);

      if (!sixthCollectionId) {
        sixthCollectionId =
          await dataSources.EntitiesStaticAPI.getSixthCollectionEntityId();
      }
      const objectId: string =
        await dataSources.EntitiesStaticAPI.getNextAvailableSixthCollectionObjectId();

      let uploadedFile: null | MediaFile = null;
      const mediafile = await dataSources.EntitiesAPI.createMediafile(media);
      const uploaded = await dataSources.StorageStaticAPI.uploadMediafile(
        mediafile._key,
        file
      );
      if (sixthCollectionId) {
        relations.push({
          key: setEntitiesIdPrefix(sixthCollectionId, true),
          value: SIXTH_COLLECTION,
          type: RelationType.IsIn,
          label: 'MaterieelDing.beheerder',
        } as RelationInput);
      }
      const objectNumberMetadataItem = {
        key: MetaKey.ObjectNumber,
        value: objectId.replace('cogent:', ''),
      };
      const fullMetadata = [];
      if (metadata && metadata.length) {
        fullMetadata.push(...metadata, objectNumberMetadataItem);
      } else {
        fullMetadata.push(objectNumberMetadataItem);
      }
      if (uploaded !== null) {
        const entity = await dataSources.EntitiesAPI.createFullEntity(
          EntityTypes.Asset,
          fullMetadata as Array<Metadata>,
          relations as Array<Relation>,
          objectId
        );

        if (entity) {
          sixthCollectionId
            ? null
            : console.log(
                `Couldn't add ${SIXTH_COLLECTION} as a relation for entity ${entity.id}. Museum not found`
              );
          const mediaFileEntity = (await dataSources.EntitiesAPI.getEntity(
            mediafile._key,
            Collections.Mediafiles
          )) as unknown as MediaFile;
          await dataSources.EntitiesAPI.addMediafilesToEntity(
            entity.id,
            mediaFileEntity
          );
          uploadedFile = mediaFileEntity;
        }
      }
      return uploadedFile;
    },
    CreateTestimony: async (
      _source,
      { entityInfo, assetId },
      { dataSources }
    ) => {
      const testimony = await dataSources.TestimonyAPI.createTestimony(
        entityInfo
      );
      await dataSources.TestimonyAPI.linkTestimonyWithAsset(
        assetId,
        testimony.id
      );
      const testimoniesOfAsset =
        await dataSources.TestimonyAPI.getTestimoniesByAssetId(assetId);
      return testimoniesOfAsset;
    },
    UpdateEntity: async (
      parent,
      { id, metadata, relations },
      { dataSources }
    ) => {
      const original_entity = await getEntityData(id, dataSources);
      let updatedRelations: Array<Relation> = [];
      const mergedMetadata = mergeMetadata(
        original_entity.metadata,
        metadata as Array<Metadata>
      );
      const otherRelations = filterOutRelationTypes(original_entity.relations, [
        RelationType.Components,
      ]);
      updatedRelations = [...otherRelations, ...(relations as Array<Relation>)];

      Promise.allSettled([
        relations.length >= 1
          ? (updatedRelations = await dataSources.EntitiesAPI.replaceRelations(
              id,
              updatedRelations as Array<Relation>
            ))
          : null,
        metadata.length >= 1
          ? await dataSources.EntitiesAPI.replaceMetadata(
              id,
              mergedMetadata as Array<MetadataInput>
            )
          : null,
      ]);
      const entity = await dataSources.EntitiesAPI.getEntity(id);
      return entity;
    },
  },
  BoxVisiter: {
    async relations(parent, _args, { dataSources }) {
      return await dataSources.BoxVisitersAPI.getRelations(parent.code);
    },
    async relationByType(parent, { type }, { dataSources }) {
      const relations = await dataSources.BoxVisitersAPI.getRelations(
        parent.code
      );
      return relations.filter((_relation) => _relation.type == type).reverse();
    },
  },
  Entity: {
    mediafiles(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getMediafiles(parent.id);
    },
    nonPublicMediafiles(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getMediafiles(parent.id, false);
    },
    metadata(parent, { key }, { dataSources }) {
      if (key) {
        return filterMetaData(parent.metadata, key, dataSources);
      } else {
        return [];
      }
    },
    primary_mediafile_info: async (parent, _args, { dataSources }) => {
      let _mediainfo: MediaInfo = { width: '0', height: '0' };

      if (parent.primary_width != null && parent.primary_height != null) {
        _mediainfo.height = parent.primary_height;
        _mediainfo.width = parent.primary_width;
      } else {
        if (parent.primary_mediafile) {
          _mediainfo = await dataSources.IiifAPI.getInfo(
            parent.primary_mediafile
          );
        } else if (parent.primary_mediafile_location) {
          const DOWNLOAD = 'download/';
          const endIndexOfDownload =
            parent.primary_mediafile_location.indexOf(DOWNLOAD) +
            DOWNLOAD.length;
          const filename = parent.primary_mediafile_location
            .split('')
            .splice(endIndexOfDownload)
            .join('');
          _mediainfo = await dataSources.IiifAPI.getInfo(filename);
        } else {
          _mediainfo = await dataSources.IiifAPI.getInfo('');
        }
      }

      // if (parent.primary_mediafile?.includes('.mp3')) {
      //   _mediainfo = { width: '0', height: '0' } as MediaInfo;
      // } else {
      //   _mediainfo = await dataSources.IiifAPI.getInfo(
      //     parent.primary_mediafile ? parent.primary_mediafile : ''
      //   );
      // }
      return _mediainfo;
    },
    metadataByLabel: async (parent, { key }, { dataSources }) => {
      if (key) {
        const data = await filterMetaData(
          parent.metadata,
          key,
          dataSources,
          'label'
        );

        return data.map((metadata) => {
          delete metadata.type;
          return metadata;
        });
      } else {
        return [];
      }
    },
    metadataCollection: async (parent, { key, label }, { dataSources }) => {
      const data: MetadataCollection[] = [];
      const metaData = await await exlcudeMetaData(parent.metadata, key, label);
      metaData.forEach((element) => {
        if (element.value) {
          const label = element.label || element.key;
          if (data.some((collectionItem) => collectionItem.label == label)) {
            const sameCollectionItem = data.find(
              (collectionItem) => collectionItem.label == label
            );
            sameCollectionItem?.data?.push(element);
          } else {
            data.push({
              label: label,
              data: [element],
              nested: element.type === 'components' ? true : false,
            });
          }
        }
      });
      return data;
    },
    relations(parent, _args, { dataSources }) {
      return dataSources.EntitiesAPI.getRelations(parent.id);
    },
    relationMetadata: async (parent, _args, { dataSources }) => {
      let components = await dataSources.EntitiesAPI.getEntityRelations(
        parent.id
      );
      components = components.map((component) => {
        if (
          component.timestamp_start &&
          component.timestamp_end &&
          !component.timestamp_zoom &&
          component.timestamp_start + 1 < component.timestamp_end
        ) {
          component['timestamp_zoom'] = component.timestamp_start + 1;
        }
        //@ts-ignore
        if (component.x) {
          component.position = {
            //@ts-ignore
            x: component.x,
            //@ts-ignore
            y: component.y,
            //@ts-ignore
            z: component.z,
          };
        }

        return component;
      });
      let mediafileRelations = components.filter((_component) =>
        _component.key.includes('mediafiles/')
      );
      for (const _relation of mediafileRelations) {
        const mediafile = await dataSources.EntitiesAPI.getMediafilesById(
          _relation.key.replace('mediafiles/', '')
        );
        if (mediafile.filename) {
          const filename = splitFilenameAndExtension(mediafile.filename);
          if (
            mediafile.mimetype &&
            getFileType(mediafile.mimetype as string) === 'audio'
          ) {
            _relation[
              'audioFile'
            ] = `${proxyLinks.mediafiles}/${mediafile.filename}`;
          }

          if (subtitleFileExtensions.includes(filename.extension)) {
            _relation[
              'subtitleFile'
            ] = `${proxyLinks.mediafiles}/${mediafile.filename}`;
          }
        }
      }

      return sortRelationmetadataOnTimestampStart(components);
    },
    components: async (parent, _args, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let components = await getComponents(dataSources, data);
      return components;
    },
    componentsOfType: async (parent, { key }, { dataSources }) => {
      let data = await dataSources.EntitiesAPI.getRelations(parent.id);
      let components: Array<Entity> = [];

      if (
        !key ||
        !Object.values(ComponentType).includes(key as ComponentType)
      ) {
        components = await getComponents(dataSources, data);
      } else {
        const allComponents = await getComponents(dataSources, data);
        allComponents.map((component) => {
          if (
            component.metadata.filter(
              (meta) => meta?.key === 'type' && meta.value === key
            ).length > 0
          )
            components.push(component);
        });
      }
      return components;
    },
    assets: async (parent, _args, { dataSources }) => {
      const relations = getRelationsFromMetadata(
        parent,
        RelationType.Components
      );

      let assets = await dataSources.EntitiesAPI.getEntitiesOfRelationIds(
        relations.map((_relation) => _relation.key)
      );
      const updatedAssets = await setMediafileOnAsset(
        dataSources,
        assets,
        parent.id
      );

      return updatedAssets;
    },
    frames: async (parent, _args, { dataSources }) => {
      const relations = getRelationsFromMetadata(parent, RelationType.Frames);

      return await dataSources.EntitiesAPI.getEntitiesOfRelationIds(
        relations.map((_relation) => _relation.key)
      );
    },
    collections: async (parent, _args, { dataSources }) => {
      const matches = parent.metadata?.filter(
        (_meta) => _meta?.label == 'MaterieelDing.beheerder'
      );
      return matches as Array<Relation>;
    },
  },
  MediaFile: {
    mediainfo: async (parent, _args, { dataSources }) => {
      let _mediainfo: MediaInfo;
      const filename = splitFilenameAndExtension(parent.filename as string);
      if (
        (parent.mimetype &&
          getFileType(parent.mimetype as string) === 'audio') ||
        subtitleFileExtensions.includes(filename.extension)
      ) {
        _mediainfo = { width: '0', height: '0' } as MediaInfo;
      } else {
        _mediainfo = await dataSources.IiifAPI.getInfo(
          parent.filename ? parent.filename : ''
        );
      }
      return _mediainfo;
    },
    mediatype: async (parent, _args, { dataSources }) => {
      let mimetype = { type: '', mime: undefined } as any;
      if (parent.mimetype) {
        mimetype.type = parent.mimetype;
        for (let index = 0; index < Object.values(MIMETYPES).length; index++) {
          if (Object.values(MIMETYPES)[index] === parent.mimetype) {
            mimetype.mime = Object.keys(MIMETYPES)[index];
            checkEnumOnType(mimetype.type, AudioMIME)
              ? (mimetype.audio = true)
              : (mimetype.audio = false);
            checkEnumOnType(mimetype.type, VideoMIME)
              ? (mimetype.video = true)
              : (mimetype.video = false);
            checkEnumOnType(mimetype.type, PDFMIME)
              ? (mimetype.pdf = true)
              : (mimetype.pdf = false);
            checkEnumOnType(mimetype.type, ImageMIME)
              ? (mimetype.image = true)
              : (mimetype.image = false);
          }
        }
      }
      return mimetype as MimeType;
    },
  },
  Metadata: {
    nestedMetaData: async (parent, _args, { dataSources }) => {
      if (parent.type && parent.type !== 'isIn') {
        const response = await dataSources.EntitiesAPI.getEntity(
          parent.key.replace('entities/', '')
        );
        return response;
      }
      return null;
    },
  },
};
const getComponents = async (
  dataSources: DataSources,
  data: Relation[]
): Promise<Entity[]> => {
  if (data.length > 0) {
    const components: Entity[] = [];
    const componentsRelations: Relation[] = data.filter(
      (relation: Relation) =>
        relation && [RelationType.Components].includes(relation.type)
    );
    for (const relation of componentsRelations) {
      const entity = await dataSources.EntitiesAPI.getEntity(
        relation.key.replace('entities/', '')
      );
      components.push(entity);
    }
    return components;
  } else {
    return [];
  }
};

const filterMetaData = async (
  metadata: Maybe<Metadata>[],
  key: any,
  dataSources: DataSources,
  keyOrLabel: 'key' | 'label' = 'key'
) => {
  const data = metadata.filter((meta) => {
    return meta && key.includes(meta[keyOrLabel]);
  }) as Metadata[];

  if (key.includes('unMapped' as MetaKey.UnMapped)) {
    const other = metadata.filter(
      (meta) => meta && !Object.values(MetaKey).includes(meta.key)
    ) as Metadata[];
    for (const meta of other) {
      if (meta.value)
        data.push({
          key: 'unMapped' as MetaKey.UnMapped,
          value: meta.value,
          unMappedKey: meta.key,
          lang: meta.lang,
          label: meta.label,
          type: meta.type,
        });
    }
  }

  data.sort((x, y) => key.indexOf(x.key) - key.indexOf(y.key));
  return data;
};

const exlcudeMetaData = async (
  metadata: Maybe<Metadata>[],
  key: any,
  label: any = []
) => {
  const dataFilterdOnKey = metadata.filter(
    (meta) => meta && !key.includes(meta.key)
  ) as Metadata[];
  const dataFilterdOnLabel = dataFilterdOnKey.filter(
    (meta) => meta && !label.includes(meta.label)
  ) as Metadata[];
  return dataFilterdOnLabel;
};

const getActiveStories = async (
  dataSources: DataSources,
  _id: string | null
) => {
  const boxStories = await dataSources.EntitiesAPI.getRelations(
    _id != null ? _id : environment.activeBoxEntity
  );
  let activeStories = boxStories.filter((_relation) => _relation?.active);
  if (activeStories.length > Number(environment.maxStories)) {
    activeStories = activeStories.slice(0, Number(environment.maxStories));
  }
  let stories: Array<Entity> = [];
  for (const story of activeStories) {
    try {
      const entity = await dataSources.EntitiesAPI.getEntity(
        story.key.replace('entities/', '')
      );
      stories.push(entity);
    } catch (error) {
      console.error(`Couldn't find entity with id: ${story.key}`);
    }
  }
  return stories;
};
function getEntitiesOfRelationIds() {
  throw new Error('Function not implemented.');
}
