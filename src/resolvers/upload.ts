import { PublicationStatus } from '../sources/constants'
import { MediaFile, Publication } from '../type-defs'

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