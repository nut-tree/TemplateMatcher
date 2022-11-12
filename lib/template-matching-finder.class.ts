import * as cv from 'opencv4nodejs-prebuilt';
import { Image, ImageFinderInterface, MatchRequest, MatchResult } from '@nut-tree/nut-js';
import { MatchedResults, MatchTemplate, MethodEnum, MethodNameType } from './match-image.function';
import { scaleImage } from './scale-image.function';
import { fromImageWithAlphaChannel } from './image-processor.class';
import Reader from './image-reader.class';
import screenshot from 'screenshot-desktop';
import sizeOf from 'buffer-image-size';
import path from 'path';

type OptionsHaystack = {
  -readonly [Property in keyof Pick<MatchRequest, 'haystack'>]?: Image | string;
};
type OptionsNeedle = {
  -readonly [Property in keyof Pick<MatchRequest, 'needle'>]: Image | string;
};
type OptionsConfidnce = {
  -readonly [Property in keyof Pick<MatchRequest, 'confidence'>]?: number;
};
type OptionsSearchMultipleScales = {
  -readonly [Property in keyof Pick<MatchRequest, 'searchMultipleScales'>]?: boolean;
};
type CustomMatchRequest = OptionsHaystack &
  OptionsNeedle &
  OptionsConfidnce &
  OptionsSearchMultipleScales & { customOptions?: { methodType: MethodNameType; scaleSteps: Array<number>; debug: boolean } };

async function loadNeedle(image: Image | string): Promise<cv.Mat> {
  if (typeof image !== 'string') {
    return fromImageWithAlphaChannel(image);
  } else {
    return await new Reader().readToMat(image);
  }
}

async function loadHaystack(image?: Image | string): Promise<cv.Mat> {
  if (typeof image !== 'string' && image) {
    return fromImageWithAlphaChannel(image);
  } else {
    if (!image) {
      const buffer = await screenshot({ format: 'bmp' });
      const dimensions = sizeOf(buffer);
      const mat = await fromImageWithAlphaChannel(new Image(dimensions.width, dimensions.height, buffer, 1, dimensions.type));

      return await mat.flipAsync(0);
    } else {
      const baseName = path.basename(image);
      const pathToHaystack = await screenshot({ filename: `${baseName}.bmp` });

      return await new Reader().readToMat(pathToHaystack);
    }
  }
}

function throwOnTooLargeNeedle(haystack: cv.Mat, needle: cv.Mat, smallestScaleFactor: number) {
  const scaledRows = smallestScaleFactor * needle.rows;
  const scaledCols = smallestScaleFactor * needle.cols;

  if (scaledRows > haystack.rows || scaledCols > haystack.cols) {
    throw new Error('Search input is too large, try using a smaller template image.');
  }
}

export default class TemplateMatchingFinder implements ImageFinderInterface {
  constructor() {}

  private async initData(matchRequest: MatchRequest | CustomMatchRequest) {
    const customMatchRequest = matchRequest as CustomMatchRequest;
    const confidence =
      customMatchRequest.customOptions && customMatchRequest.customOptions?.methodType === MethodEnum.TM_SQDIFF && matchRequest.confidence === 0.99
        ? 0.998
        : (customMatchRequest.customOptions && customMatchRequest.customOptions?.methodType === MethodEnum.TM_CCOEFF_NORMED) ||
          (customMatchRequest.customOptions && customMatchRequest.customOptions?.methodType === MethodEnum.TM_CCORR_NORMED && matchRequest.confidence === 0.99)
        ? 0.8
        : matchRequest.confidence === 0.99 || typeof matchRequest.confidence === 'undefined'
        ? 0.8
        : matchRequest.confidence;
    const searchMultipleScales = customMatchRequest.searchMultipleScales ? customMatchRequest.searchMultipleScales : true;
    const scaleSteps = customMatchRequest.customOptions?.scaleSteps || [1, 0.9, 0.8, 0.7, 0.6, 0.5];
    const methodType = customMatchRequest.customOptions?.methodType || MethodEnum.TM_CCOEFF_NORMED;
    const debug = customMatchRequest.customOptions?.debug || false;

    const needle = await loadNeedle(matchRequest.needle);
    if (!needle || needle.empty) {
      throw new Error(`Failed to load ${typeof matchRequest.needle === 'string' ? matchRequest.needle : matchRequest.needle.id}, got empty image.`);
    }
    const haystack = await loadHaystack(matchRequest.haystack);
    if (!haystack || haystack.empty) {
      throw new Error(
        `Failed to load ${
          matchRequest && matchRequest.haystack && typeof matchRequest.haystack === 'string' && !matchRequest.haystack ? matchRequest.haystack : (matchRequest.haystack as Image).id
        }, got empty image.`,
      );
    }

    if (matchRequest.searchMultipleScales) {
      throwOnTooLargeNeedle(haystack, needle, scaleSteps[scaleSteps.length - 1]);
    }

    return { haystack: haystack, needle: needle, confidence: confidence, scaleSteps: scaleSteps, methodType: methodType, debug: debug, searchMultipleScales: searchMultipleScales };
  }

  public async findMatches(matchRequest: MatchRequest | CustomMatchRequest): Promise<MatchResult[]> {
    let matchResults: Array<MatchResult> = [];
    let { haystack, needle, confidence, scaleSteps, methodType, debug, searchMultipleScales } = await this.initData(matchRequest);

    if (!searchMultipleScales) {
      const overwrittenResults = await MatchTemplate.matchImagesByWriteOverFounded(haystack, needle, confidence, methodType, debug);
      matchResults.push(...overwrittenResults.results);
    } else {
      const scaledResults = await this.searchMultipleScales(haystack, needle, confidence, scaleSteps, methodType, debug);
      matchResults.push(...scaledResults);
    }
    return await this.getValidatedMatches(matchResults, matchRequest as MatchRequest, confidence);
  }

  private async getValidatedMatches(matchResults: Array<MatchResult>, matchRequest: MatchRequest, confidence: number) {
    const matches = await Promise.all(matchResults).then((results) => {
      results.forEach((matchResult) => {
        matchResult.location.left /= matchRequest.haystack ? matchRequest.haystack.pixelDensity.scaleX : 1;
        matchResult.location.width /= matchRequest.haystack ? matchRequest.haystack.pixelDensity.scaleX : 1;
        matchResult.location.top /= matchRequest.haystack ? matchRequest.haystack.pixelDensity.scaleY : 1;
        matchResult.location.height /= matchRequest.haystack ? matchRequest.haystack.pixelDensity.scaleY : 1;
      });
      return results.sort((first, second) => second.confidence - first.confidence);
    });
    const potentialMatches = matches.filter((match) => match.confidence >= confidence);

    if (potentialMatches.length === 0) {
      matches.sort((a, b) => a.confidence - b.confidence);
      const bestMatch = matches.pop();

      if (bestMatch) {
        throw new Error(`No match with required confidence ${confidence}. Best match: ${bestMatch.confidence}`);
      } else {
        throw new Error(`Unable to locate on screen with template ${matchRequest.needle.id}, no match!`);
      }
    }
    return potentialMatches;
  }

  public async findMatch(matchRequest: MatchRequest | CustomMatchRequest): Promise<MatchResult> {
    let { haystack, needle, confidence, scaleSteps, methodType, debug, searchMultipleScales } = await this.initData(matchRequest);

    if (!searchMultipleScales) {
      const matches = await MatchTemplate.matchImages(haystack, needle, methodType, debug);
      const result = await this.getValidatedMatches([matches.data], matchRequest as MatchRequest, confidence);

      return result[0];
    } else {
      const scaledResults = await this.searchMultipleScales(haystack, needle, confidence, scaleSteps, methodType, debug, true);
      return (await this.getValidatedMatches([scaledResults[0]], matchRequest as MatchRequest, confidence))[0];
    }
  }

  private async searchMultipleScales(haystack: cv.Mat, needle: cv.Mat, confidence: number, scaleSteps: Array<number>, methodType: MethodNameType, debug: boolean, firstMach: boolean = false) {
    const results: MatchResult[] = [];

    const needleData = await this.scaleNeedle(haystack, needle, confidence, scaleSteps, methodType, debug, firstMach);
    results.push(...needleData.results);

    if (firstMach && results.length) {
      return results;
    }
    const haystackData = await this.scaleHaystack(needleData.haystack, needle, confidence, scaleSteps, methodType, debug, firstMach);
    results.push(...haystackData.results);

    if (firstMach && results.length) {
      return results;
    }
    return results;
  }

  private async scaleHaystack(haystack: cv.Mat, needle: cv.Mat, confidence: number, scaleSteps: Array<number>, methodType: MethodNameType, debug: boolean, firstMach: boolean = false) {
    const results: MatchResult[] = [];
    let overWrittenScaledHaystackResult = { results: results, haystack: haystack };
    let overwrittenHaystack = haystack;

    for (const currentScale of scaleSteps) {
      let scaledHaystack = await scaleImage(overwrittenHaystack, currentScale);

      if (scaledHaystack.cols <= 10 || scaledHaystack.rows <= 10) {
        break;
      }
      if (scaledHaystack.cols * scaledHaystack.rows === 0) {
        break;
      }
      if (scaledHaystack.cols < needle.cols || scaledHaystack.rows < needle.rows) {
        break;
      }
      overWrittenScaledHaystackResult = await MatchTemplate.matchImagesByWriteOverFounded(scaledHaystack, needle, confidence, methodType, debug, firstMach);
      overwrittenHaystack = overWrittenScaledHaystackResult.haystack;
      results.push(...overWrittenScaledHaystackResult.results);
    }
    return { results: results, haystack: overWrittenScaledHaystackResult.haystack };
  }

  private async scaleNeedle(
    haystack: cv.Mat,
    needle: cv.Mat,
    confidence: number = 0.8,
    scaleSteps: Array<number>,
    methodType: MethodNameType,
    debug: boolean,
    firstMatch: boolean = false,
  ): Promise<MatchedResults> {
    const results: MatchResult[] = [];
    let overWrittenScaledNeedleResult = { results: results, haystack: haystack };

    for (const currentScale of scaleSteps) {
      const scaledNeedle = await scaleImage(needle, currentScale);

      if (scaledNeedle.cols <= 10 || scaledNeedle.rows <= 10) {
        break;
      }
      if (scaledNeedle.cols * scaledNeedle.rows === 0) {
        break;
      }
      if (haystack.cols < scaledNeedle.cols || haystack.rows < scaledNeedle.rows) {
        break;
      }

      overWrittenScaledNeedleResult = await MatchTemplate.matchImagesByWriteOverFounded(haystack, scaledNeedle, confidence, methodType, debug, firstMatch);
      results.push(...overWrittenScaledNeedleResult.results);
    }
    return { results: results, haystack: overWrittenScaledNeedleResult.haystack };
  }
}
