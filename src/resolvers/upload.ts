import { getMetadataOfKey } from '../parsers/entities'
import { PublicationStatus } from '../sources/constants'
import { Entity, KeyValuePair, MediaFile, Metadata, MetaKey, Publication, Relation } from '../type-defs'

const USER_MEDIAFILE_NAME_PREFIX = 'user-uploaded-'
const NO_IMAGE_PATH = './no-image.png'

export const getPublicationKeyFromValue = (publication_status: string) => {
  return new Promise((resolve, reject) => {
    for (const key of Object.values(Publication)) {
      if (publication_status === PublicationStatus[key]) {
        resolve(key)
      }
    }
    resolve(Publication.Private)
  })
}

export const getMediafileLink = (_mediafiles: Array<MediaFile>) => {
  let mediafileLink = NO_IMAGE_PATH
  if (_mediafiles.length >= 1) {
    if (_mediafiles[0].primary_transcode_location) {
      mediafileLink = _mediafiles[0].primary_transcode_location
    } else if (_mediafiles[0].original_file_location)
      mediafileLink = _mediafiles[0].original_file_location
  }
  mediafileLink = encodeURI(mediafileLink)
  return mediafileLink
}

export const getRightFromMediafile = (_mediafiles: Array<MediaFile>, _fileLocation: string | null) => {
  let rights = null
  if (_mediafiles.length >= 1 && _fileLocation !== null) {
    const mediafile = _mediafiles.find(mediafile => mediafile.primary_transcode_location === _fileLocation || mediafile.original_file_location === _fileLocation)
    mediafile !== undefined ? rights = getMetadataOfKey(mediafile as unknown as Entity, MetaKey.Rights) : null
  }
  return rights
}

export const removePrefixFromMetadata = (_metadata: Array<Metadata>) => {
  const updatedMetadata = []
  for (const metadata of _metadata) {
    let stripped = metadata.value

    if (metadata.value !== null) {
      if (stripped!.includes(USER_MEDIAFILE_NAME_PREFIX)) {
        stripped = stripped!.replace(USER_MEDIAFILE_NAME_PREFIX, "")
      }
    }
    updatedMetadata.push({
      key: metadata.key,
      value: stripped,
      label: metadata.label,
    } as Metadata)
  }
  return updatedMetadata
}
