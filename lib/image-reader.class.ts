import * as cv from 'opencv4nodejs-prebuilt-install';
import { Image, ImageReader } from '@nut-tree/nut-js';

export default class implements ImageReader {
  public async load(path: string): Promise<Image> {
    return new Promise<Image>(async (resolve, reject) => {
      try {
        const image = await cv.imreadAsync(path, cv.IMREAD_UNCHANGED);
        resolve(new Image(image.cols, image.rows, image.getData(), image.channels, path));
      } catch (e) {
        reject(`Failed to load image from '${path}'`);
      }
    });
  }
}

// IMREAD_UNCHANGED : If set, return the loaded image as is (with alpha channel, otherwise it gets cropped).
// IMREAD_GRAYSCALE : If set, always convert image to the single channel grayscale image.
// IMREAD_COLOR : If set, always convert image to the 3 channel BGR color image.
// IMREAD_ANYDEPTH : If set, return 16-bit/32-bit image when the input has the corresponding depth, otherwise convert it to 8-bit.
// IMREAD_ANYCOLOR : If set, the image is read in any possible color format.
