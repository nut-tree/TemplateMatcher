import { Image, MatchResult, Region } from '@nut-tree/nut-js';
import { Mat } from 'opencv4nodejs-prebuilt-install';

export enum MethodEnum {
  TM_CCOEFF = 'TM_CCOEFF',
  TM_CCOEFF_NORMED = 'TM_CCOEFF_NORMED',
  TM_CCORR = 'TM_CCORR',
  TM_CCORR_NORMED = 'TM_CCORR_NORMED',
  TM_SQDIFF = 'TM_SQDIFF',
  TM_SQDIFF_NORMED = 'TM_SQDIFF_NORMED',
}
export type MethodNameType = 'TM_CCOEFF' | 'TM_CCOEFF_NORMED' | 'TM_CCORR' | 'TM_CCORR_NORMED' | 'TM_SQDIFF' | 'TM_SQDIFF_NORMED';
export type MatchedResults = { results: Array<MatchResult<Region>>; haystack: Mat };

export interface OptionsSearchParameterType {
  searchMultipleScales?: boolean;
  methodType?: MethodNameType;
  scaleSteps?: Array<number>;
  debug?: boolean;
  roi?: Region;
}
export interface CustomConfigType {
  confidence?: number;
  providerData?: OptionsSearchParameterType;
}

export interface CustomMatchRequest extends CustomConfigType {
  haystack?: Image | string;
  needle: Image | string;
}
