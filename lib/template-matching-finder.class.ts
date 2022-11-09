import * as cv from 'opencv4nodejs-prebuilt';
import { Image, ImageFinderInterface, MatchRequest, MatchResult } from '@nut-tree/nut-js';
import { MatchedResults, MatchTemplate, MethodEnum, MethodNameType } from './match-image.function';
import { scaleImage } from './scale-image.function';
import { fromImageWithAlphaChannel } from './image-processor.class';

type CustomMatchRequest = MatchRequest & { customOptions?: { methodType: MethodNameType; scaleSteps: Array<number>; debug: boolean } };

async function loadNeedle(image: Image): Promise<cv.Mat> {
  return fromImageWithAlphaChannel(image);
}

async function loadHaystack(matchRequest: MatchRequest): Promise<cv.Mat> {
  return fromImageWithAlphaChannel(matchRequest.haystack);
}

function throwOnTooLargeNeedle(haystack: cv.Mat, needle: cv.Mat, smallestScaleFactor: number) {
  const scaledRows = smallestScaleFactor * needle.rows;
  const scaledCols = smallestScaleFactor * needle.cols;

  if (scaledRows > haystack.rows || scaledCols > haystack.cols) {
    throw new Error('Search input is too large, try using a smaller template image.');
  }
}

export default class TemplateMatchingFinder implements ImageFinderInterface {
  private scaleSteps = [1, 0.9, 0.8, 0.7, 0.6, 0.5];

  constructor() {}

  private async initData(matchRequest: MatchRequest | CustomMatchRequest) {
    let confidence =
      (((matchRequest as CustomMatchRequest).customOptions && (matchRequest as CustomMatchRequest).customOptions?.methodType === MethodEnum.TM_SQDIFF_NORMED) ||
        ((matchRequest as CustomMatchRequest).customOptions && (matchRequest as CustomMatchRequest).customOptions?.methodType === MethodEnum.TM_SQDIFF)) &&
      matchRequest.confidence === 0.99
        ? 0.998
        : ((matchRequest as CustomMatchRequest).customOptions && (matchRequest as CustomMatchRequest).customOptions?.methodType === MethodEnum.TM_CCOEFF_NORMED) ||
          ((matchRequest as CustomMatchRequest).customOptions && (matchRequest as CustomMatchRequest).customOptions?.methodType === MethodEnum.TM_CCORR_NORMED && matchRequest.confidence === 0.99)
        ? 0.8
        : matchRequest.confidence === 0.99
        ? 0.8
        : matchRequest.confidence;
    let scaleSteps = (matchRequest as CustomMatchRequest).customOptions?.scaleSteps || this.scaleSteps;

    const needle = await loadNeedle(matchRequest.needle);
    if (!needle || needle.empty) {
      throw new Error(`Failed to load ${matchRequest.needle.id}, got empty image.`);
    }
    const haystack = await loadHaystack(matchRequest);
    if (!haystack || haystack.empty) {
      throw new Error(`Failed to load ${matchRequest.haystack.id}, got empty image.`);
    }

    if (matchRequest.searchMultipleScales) {
      throwOnTooLargeNeedle(haystack, needle, scaleSteps[scaleSteps.length - 1]);
    }

    return { haystack: haystack, needle: needle, confidence: confidence, scaleSteps: scaleSteps };
  }

  public async findMatches(matchRequest: MatchRequest | CustomMatchRequest): Promise<MatchResult[]> {
    let matchResults: Array<MatchResult> = [];
    let { haystack, needle, confidence, scaleSteps } = await this.initData(matchRequest);

    if (!matchRequest.searchMultipleScales) {
      const overwrittenResults = await MatchTemplate.matchImagesByWriteOverFounded(
        haystack,
        needle,
        confidence,
        (matchRequest as CustomMatchRequest).customOptions?.methodType,
        (matchRequest as CustomMatchRequest).customOptions?.debug,
      );
      matchResults.push(...overwrittenResults.results);
    } else {
      const scaledResults = await this.searchMultipleScales(
        haystack,
        needle,
        confidence,
        scaleSteps,
        (matchRequest as CustomMatchRequest).customOptions?.methodType,
        (matchRequest as CustomMatchRequest).customOptions?.debug,
      );
      matchResults.push(...scaledResults);
    }
    return await this.getValidatedMatches(matchResults, matchRequest, confidence);
  }

  private async getValidatedMatches(matchResults: Array<MatchResult>, matchRequest: MatchRequest, confidence: number) {
    const matches = await Promise.all(matchResults).then((results) => {
      results.forEach((matchResult) => {
        matchResult.location.left /= matchRequest.haystack.pixelDensity.scaleX;
        matchResult.location.width /= matchRequest.haystack.pixelDensity.scaleX;
        matchResult.location.top /= matchRequest.haystack.pixelDensity.scaleY;
        matchResult.location.height /= matchRequest.haystack.pixelDensity.scaleY;
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
    let { haystack, needle, confidence, scaleSteps } = await this.initData(matchRequest);

    if (!matchRequest.searchMultipleScales) {
      const matches = await MatchTemplate.matchImages(haystack, needle, (matchRequest as CustomMatchRequest).customOptions?.methodType, (matchRequest as CustomMatchRequest).customOptions?.debug);
      const result = await this.getValidatedMatches([matches.data], matchRequest, confidence);

      return result[0];
    } else {
      const scaledResults = await this.searchMultipleScales(
        haystack,
        needle,
        confidence,
        scaleSteps,
        (matchRequest as CustomMatchRequest).customOptions?.methodType,
        (matchRequest as CustomMatchRequest).customOptions?.debug,
        true,
      );
      return (await this.getValidatedMatches([scaledResults[0]], matchRequest, confidence))[0];
    }
  }

  private async searchMultipleScales(
    haystack: cv.Mat,
    needle: cv.Mat,
    confidence: number = 0.8,
    scaleSteps: Array<number> = this.scaleSteps,
    methodType: MethodNameType = MethodEnum.TM_CCOEFF_NORMED,
    debug: boolean = false,
    firstMach: boolean = false,
  ) {
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

  private async scaleHaystack(
    haystack: cv.Mat,
    needle: cv.Mat,
    confidence: number = 0.8,
    scaleSteps: Array<number> = this.scaleSteps,
    methodType: MethodNameType = MethodEnum.TM_CCOEFF_NORMED,
    debug: boolean = false,
    firstMach: boolean = false,
  ) {
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
    scaleSteps: Array<number> = this.scaleSteps,
    methodType: MethodNameType = MethodEnum.TM_CCOEFF_NORMED,
    debug: boolean = false,
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
