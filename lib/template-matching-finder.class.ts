import * as cv from "opencv4nodejs-prebuilt";
import {Image, ImageFinderInterface, MatchRequest, MatchResult} from "@nut-tree/nut-js";
import {matchImages} from "./match-image.function";
import {scaleImage} from "./scale-image.function";
import {scaleLocation} from "./scale-location.function";
import {fromImageWithAlphaChannel, fromImageWithoutAlphaChannel} from "./image-processor.class";

async function loadNeedle(image: Image): Promise<cv.Mat> {
    if (image.hasAlphaChannel) {
        return fromImageWithAlphaChannel(image);
    }
    return fromImageWithoutAlphaChannel(image);
}

async function loadHaystack(matchRequest: MatchRequest): Promise<cv.Mat> {
    if (matchRequest.haystack.hasAlphaChannel) {
        return fromImageWithAlphaChannel(
            matchRequest.haystack
        );
    } else {
        return fromImageWithoutAlphaChannel(
            matchRequest.haystack
        );
    }
}

function throwOnTooLargeNeedle(haystack: cv.Mat, needle: cv.Mat, smallestScaleFactor: number) {
    const scaledRows = smallestScaleFactor * needle.rows;
    const scaledCols = smallestScaleFactor * needle.cols;

    if (scaledRows > haystack.rows || scaledCols > haystack.cols) {
        throw new Error("Search input is too large, try using a smaller template image.");
    }
}

export default class TemplateMatchingFinder implements ImageFinderInterface {
    private scaleSteps = [0.9, 0.8, 0.7, 0.6, 0.5];

    constructor() {
    }

    public async findMatches(matchRequest: MatchRequest): Promise<MatchResult[]> {
        const needle = await loadNeedle(matchRequest.needle);
        if (!needle || needle.empty) {
            throw new Error(
                `Failed to load ${matchRequest.needle.id}, got empty image.`,
            );
        }
        const haystack = await loadHaystack(matchRequest);
        if (!haystack || haystack.empty) {
            throw new Error(
                `Failed to load ${matchRequest.haystack.id}, got empty image.`,
            );
        }

        throwOnTooLargeNeedle(haystack, needle, this.scaleSteps[this.scaleSteps.length - 1]);

        const matchResult = await matchImages(haystack, needle);
        const matchResults = [
            new MatchResult(matchResult.confidence, matchResult.location)
        ];

        if (matchRequest.searchMultipleScales) {
            const scaledResults = await this.searchMultipleScales(needle, haystack);
            matchResults.push(...scaledResults)
        }

        const matches = await Promise.all(matchResults).then(results => {
            results.forEach(matchResult => {
                matchResult.location.left /= matchRequest.haystack.pixelDensity.scaleX;
                matchResult.location.width /= matchRequest.haystack.pixelDensity.scaleX;
                matchResult.location.top /= matchRequest.haystack.pixelDensity.scaleY;
                matchResult.location.height /= matchRequest.haystack.pixelDensity.scaleY;
            });
            return results.sort(
                (first, second) => second.confidence - first.confidence,
            );
        });
        const potentialMatches = matches
            .filter(match => match.confidence >= matchRequest.confidence);
        if (potentialMatches.length === 0) {
            matches.sort((a, b) => a.confidence - b.confidence);
            const bestMatch = matches.pop();
            if (bestMatch) {
                throw new Error(`No match with required confidence ${matchRequest.confidence}. Best match: ${bestMatch.confidence}`)
            } else {
                throw new Error(`Unable to locate ${matchRequest.needle.id}, no match!`);
            }
        }
        return potentialMatches;
    }

    public async findMatch(matchRequest: MatchRequest): Promise<MatchResult> {
        const matches = await this.findMatches(matchRequest);
        return matches[0];
    }

    private async searchMultipleScales(needle: cv.Mat, haystack: cv.Mat) {
        const results: MatchResult[] = [];

        for (const currentScale of this.scaleSteps) {
            const scaledHaystack = await scaleImage(haystack, currentScale);
            const scaledNeedle = await scaleImage(needle, currentScale);
            if (scaledHaystack.cols <= 10 || scaledHaystack.rows <= 10) {
                break;
            }
            if (scaledHaystack.cols * scaledHaystack.rows === 0) {
                break;
            }
            if (scaledHaystack.cols < needle.cols ||
                scaledHaystack.rows < needle.rows) {
                break;
            }
            if (scaledNeedle.cols <= 10 || scaledNeedle.rows <= 10) {
                break;
            }
            if (scaledNeedle.cols * scaledNeedle.rows === 0) {
                break;
            }
            if (haystack.cols < scaledNeedle.cols ||
                haystack.rows < scaledNeedle.rows) {
                break;
            }

            const matchNeedleResult = await matchImages(haystack, scaledNeedle);
            results.push(new MatchResult(
                matchNeedleResult.confidence,
                matchNeedleResult.location,
            ));
            const matchHaystackResult = await matchImages(scaledHaystack, needle);
            results.push(new MatchResult(
                matchHaystackResult.confidence,
                scaleLocation(
                    matchHaystackResult.location,
                    currentScale
                )
            ));
        }
        return results;
    }
}
