import * as cv from "opencv4nodejs-prebuilt";
import {Image, ImageFinderInterface, ImageReader, MatchRequest, MatchResult, Region} from "@nut-tree/nut-js";
import {determineScaledSearchRegion} from "./determine-searchregion.function";
import ImageReaderImpl from "./image-reader.class";
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
    const searchRegion = determineScaledSearchRegion(matchRequest);
    if (matchRequest.haystack.hasAlphaChannel) {
        return fromImageWithAlphaChannel(
            matchRequest.haystack,
            searchRegion,
        );
    } else {
        return fromImageWithoutAlphaChannel(
            matchRequest.haystack,
            searchRegion,
        );
    }
}

function isValidSearch(needle: cv.Mat, haystack: cv.Mat): boolean {
    return (needle.cols <= haystack.cols) && (needle.rows <= haystack.rows);
}

function createResultForInvalidSearch() {
    return new MatchResult(0,
        new Region(
            0,
            0,
            0,
            0
        ),
        new Error("The provided image sample is larger than the provided search region")
    )
}

export default class TemplateMatchingFinder implements ImageFinderInterface {
    private initialScale = [1.0];
    private scaleSteps = [0.9, 0.8, 0.7, 0.6, 0.5];

    constructor(
        private source: ImageReader = new ImageReaderImpl(),
    ) {
    }

    public async findMatches(matchRequest: MatchRequest): Promise<MatchResult[]> {
        let needle: cv.Mat;
        try {
            const needleInput = await this.source.load(matchRequest.pathToNeedle);
            needle = await loadNeedle(needleInput);
        } catch (e) {
            throw new Error(
                `Failed to load ${matchRequest.pathToNeedle}. Reason: '${e}'.`,
            );
        }
        if (!needle || needle.empty) {
            throw new Error(
                `Failed to load ${matchRequest.pathToNeedle}, got empty image.`,
            );
        }
        const haystack = await loadHaystack(matchRequest);

        const matchResults = this.initialScale.map(
            async () => {
                if (!isValidSearch(needle, haystack)) {
                    return createResultForInvalidSearch();
                }
                const matchResult = await matchImages(haystack, needle);
                return new MatchResult(matchResult.confidence, matchResult.location);
            }
        );

        if (matchRequest.searchMultipleScales) {
            matchResults.push(...this.searchMultipleScales(needle, haystack))
        }

        return Promise.all(matchResults).then(results => {
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
    }

    public async findMatch(matchRequest: MatchRequest): Promise<MatchResult> {

        const matches = await this.findMatches(matchRequest);
        const potentialMatches = matches
            .filter(match => match.confidence >= matchRequest.confidence);
        if (potentialMatches.length === 0) {
            matches.sort((a, b) => a.confidence - b.confidence);
            const bestMatch = matches.pop();
            if (bestMatch) {
                if (bestMatch.error) {
                    throw bestMatch.error
                } else {
                    throw new Error(`No match with required confidence ${matchRequest.confidence}. Best match: ${bestMatch.confidence} at ${bestMatch.location}`)
                }
            } else {
                throw new Error(`Unable to locate ${matchRequest.pathToNeedle}, no match!`);
            }
        }
        return potentialMatches[0];
    }

    private searchMultipleScales(needle: cv.Mat, haystack: cv.Mat) {
        const scaledNeedleResult = this.scaleSteps.map(
            async (currentScale) => {
                const scaledNeedle = await scaleImage(needle, currentScale);
                if (!isValidSearch(scaledNeedle, haystack)) {
                    return createResultForInvalidSearch();
                }
                const matchResult = await matchImages(haystack, scaledNeedle);
                return new MatchResult(
                    matchResult.confidence,
                    matchResult.location,
                );
            }
        );
        const scaledHaystackResult = this.scaleSteps.map(
            async (currentScale) => {
                const scaledHaystack = await scaleImage(haystack, currentScale);
                if (!isValidSearch(needle, scaledHaystack)) {
                    return createResultForInvalidSearch();
                }
                const matchResult = await matchImages(scaledHaystack, needle);
                return new MatchResult(
                    matchResult.confidence,
                    scaleLocation(
                        matchResult.location,
                        currentScale
                    )
                );
            }
        );
        return [...scaledHaystackResult, ...scaledNeedleResult];
    }
}
