import { Rights, Publication } from '../type-defs';

export const License: Record<Rights, string> = {
  [Rights.Cc0]: 'CC0 1.0',
  [Rights.Undetermined]: 'To be determined',
};

export const PublicationStatus: Record<Publication, string> = {
  [Publication.Public]: 'publiek',
  [Publication.Private]: 'niet-publiek',
  [Publication.Validate]: 'te valideren',
  [Publication.Declined]: 'afgewezen',
};

export const SKIP_RELATIONS = 'skip_relations';
export const SIXTH_COLLECTION = 'sixth_collection';
