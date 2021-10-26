import {MatchRequest, Region} from "@nut-tree/nut-js";

export function determineScaledSearchRegion(matchRequest: MatchRequest): Region {
    const searchRegion = matchRequest.searchRegion;
    const scaleX = matchRequest.haystack.pixelDensity.scaleX || 1.0;
    const scaleY = matchRequest.haystack.pixelDensity.scaleY || 1.0;
    searchRegion.width *= scaleX;
    searchRegion.height *= scaleY;
    return searchRegion;
}
