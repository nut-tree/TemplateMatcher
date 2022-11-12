import * as cv from "opencv4nodejs-prebuilt";
import {ColorMode, Image, Region} from "@nut-tree/nut-js";

export function determineROI(img: Image, roi: Region): cv.Rect {
    return new cv.Rect(
        Math.min(Math.max(roi.left, 0), img.width),
        Math.min(Math.max(roi.top, 0), img.height),
        Math.min(roi.width, img.width - roi.left),
        Math.min(roi.height, img.height - roi.top));
}

export function validateSearchRegion(search: Region, screen: Region) {
    if (
      search.left < 0 ||
      search.top < 0 ||
      search.width < 0 ||
      search.height < 0
    ) {
      throw new Error(`Negative values in search region ${search}`);
    }
    if (
      isNaN(search.left) ||
      isNaN(search.top) ||
      isNaN(search.width) ||
      isNaN(search.height)
    ) {
      throw new Error(`NaN values in search region ${search}`);
    }
    if (search.width < 2 || search.height < 2) {
      throw new Error(
        `Search region ${search} is not large enough. Must be at least two pixels in both width and height.`
      );
    }
    if (
      search.left + search.width > screen.width ||
      search.top + search.height > screen.height
    ) {
      throw new Error(
        `Search region ${search} extends beyond screen boundaries (${screen.width}x${screen.height})`
      );
    }
  }
  

/**
 * fromImageWithAlphaChannel should provide a way to create a library specific
 * image with alpha channel from an abstract Image object holding raw data and image dimension
 *
 * @param {Image} img The input Image
 * @param {Region} [roi] An optional Region to specify a ROI
 * @returns {Promise<any>} An image
 * @memberof VisionProviderInterface
 */
export const fromImageWithAlphaChannel = async (
    img: Image,
    roi?: Region,
): Promise<cv.Mat> => {
    let mat: cv.Mat;
    if (img.colorMode === ColorMode.RGB) {
        mat = await new cv.Mat(img.data, img.height, img.width, cv.CV_8UC4).cvtColorAsync(cv.COLOR_RGBA2GRAY);
    } else {
        mat = await new cv.Mat(img.data, img.height, img.width, cv.CV_8UC4).cvtColorAsync(cv.COLOR_BGRA2GRAY);
    }
    if (roi) {
        return mat.getRegion(determineROI(img, roi));
    } else {
        return mat;
    }
};

/**
 * fromImageWithoutAlphaChannel should provide a way to create a library specific
 * image without alpha channel from an abstract Image object holding raw data and image dimension
 *
 * @param {Image} img The input Image
 * @param {Region} [roi] An optional Region to specify a ROI
 * @returns {Promise<any>} An image
 * @memberof VisionProviderInterface
 */
export const fromImageWithoutAlphaChannel = async (
    img: Image,
    roi?: Region,
): Promise<cv.Mat> => {
    let mat: cv.Mat;
    if (img.colorMode === ColorMode.RGB) {
        mat = await new cv.Mat(img.data, img.height, img.width, cv.CV_8UC3).cvtColorAsync(cv.COLOR_RGB2GRAY);
    } else {
        mat = await new cv.Mat(img.data, img.height, img.width, cv.CV_8UC3).cvtColorAsync(cv.COLOR_BGR2GRAY);
    }
    if (roi) {
        return mat.getRegion(determineROI(img, roi));
    } else {
        return mat;
    }
};
