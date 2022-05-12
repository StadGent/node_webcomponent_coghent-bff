export enum ImageMIME {
  IMGJPG = 'image/jpeg',
  IMGTIFF = 'image/tiff',
  IMGPNG = 'image/png',
  IMGAVIF = 'image/avif',
  IMGBMP = 'image/bmp',
  IMGWEBP = 'image/webp',
}
export enum AudioMIME {
  AUDIOMPEG = 'audio/mpeg',
  AUDIOMP3 = 'audio/mp3',
  AUDIOAAC = 'audio/aac',
  AUDIOOGG = 'audio/ogg',
  AUDIOOCTET = 'audio/octet-stream',
  AUDIOOPUS = 'audio/opus',
  AUDIOWAV = 'audio/wav',
  AUDIOXWAV = 'audio/x-wav',
}
export enum VideoMIME {
  VIDEOMP4 = 'video/mp4',
  VIDEOWAV = 'video/wav',
  VIDEOMOV = 'video/quicktime',
}
export enum PDFMIME {
  APPLICATIONPDF = 'application/pdf',
}
export enum OtherMIME {
  UNTYPED = 'untyped',
  TEXTPLAIN = 'text/plain',
}
export const MIMETYPES = {
  ...ImageMIME,
  ...AudioMIME,
  ...VideoMIME,
  ...OtherMIME,
  ...PDFMIME,
};
export type MIMETYPES = typeof MIMETYPES;
export const checkEnumOnType = (
  _type: string,
  _enum: typeof AudioMIME | typeof VideoMIME | typeof ImageMIME | typeof PDFMIME
) => {
  let isOfTypeEnum = false;
  for (let index = 0; index < Object.values(_enum).length; index++) {
    if (Object.values(_enum)[index] === _type) {
      isOfTypeEnum = true;
    }
  }
  return isOfTypeEnum;
};
export const getFileType = (_mimetype: string) => {
  let type = null;
  const filteredType = Object.values(MIMETYPES).filter(
    (type) => type === _mimetype
  );
  if (filteredType[0]) {
    checkEnumOnType(_mimetype, AudioMIME) ? (type = 'audio') : type;
    checkEnumOnType(_mimetype, VideoMIME) ? (type = 'video') : type;
    checkEnumOnType(_mimetype, ImageMIME) ? (type = 'image') : type;
    checkEnumOnType(_mimetype, PDFMIME) ? (type = 'pdf') : type;
  }
  return type;
};
// import { GraphQLEnumType } from 'graphql'
// export const AudioMimeType = new GraphQLEnumType({
//   name: 'AudioMimeType',
//   values: {
//     AUDIOMPEG: { value: 'audio/mpeg' },
//   }
// })
// export const VideoMimeType = new GraphQLEnumType({
//   name: 'VideoMimeType',
//   values: {
//     VIDEOMP4: { value: 'video/mp4' },
//     VIDEOWAV: { value: 'video/wav' },
//   }
// })
// export const ImageMimeType = new GraphQLEnumType({
//   name: 'ImageMimeType',
//   values: {
//     IMGJPG: { value: 'image/jpeg' },
//     IMGTIFF: { value: 'image/tiff' },
//     IMGPNG: { value: 'image/png' },
//   }
// })
