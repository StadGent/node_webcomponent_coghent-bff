import { getMetadataOfKey } from '../parsers/entities';
import { PublicationStatus } from '../sources/constants';
import {
  Entity,
  KeyValuePair,
  MediaFile,
  Metadata,
  MetadataInput,
  MetaKey,
  Publication,
  Relation,
} from '../type-defs';

const NO_IMAGE_PATH = './no-image.png';

export const getPublicationKeyFromValue = (publication_status: string) => {
  return new Promise((resolve, reject) => {
    for (const key of Object.values(Publication)) {
      if (publication_status === PublicationStatus[key]) {
        resolve(key);
      }
    }
    resolve(Publication.Private);
  });
};

export const getMediafileLink = (_mediafiles: Array<MediaFile>) => {
  let mediafileLink = NO_IMAGE_PATH;
  if (_mediafiles.length >= 1) {
    if (_mediafiles[0].transcode_file_location) {
      mediafileLink = _mediafiles[0].transcode_file_location;
    } else if (_mediafiles[0].original_file_location)
      mediafileLink = _mediafiles[0].original_file_location;
  }
  mediafileLink = encodeURI(mediafileLink);
  return mediafileLink;
};

export const getRightFromMediafile = (
  _mediafiles: Array<MediaFile>,
  _fileLocation: string | null
) => {
  let rights = null;
  if (_mediafiles.length >= 1 && _fileLocation !== null) {
    const mediafile = _mediafiles.find(
      (mediafile) =>
        mediafile.transcode_file_location === _fileLocation ||
        mediafile.original_file_location === _fileLocation
    );
    mediafile !== undefined
      ? (rights = getMetadataOfKey(
          mediafile as unknown as Entity,
          MetaKey.Rights
        ))
      : null;
  }
  return rights;
};

export const addObjectNumberToMetadata = (objectId: String, metadata: any) => {
  const newMetadata: [Metadata] | any[] = [];
  if (metadata) {
    newMetadata.push(metadata);
  }
  const metadataItem = {
    key: MetaKey.ObjectNumber,
    value: objectId.replace('cogent:', ''),
  };
  newMetadata.push(metadataItem);
  return newMetadata;
};
