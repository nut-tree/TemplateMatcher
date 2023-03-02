let cv: any;

try {
  cv = require('opencv4nodejs-prebuilt-install');
} catch {}

import { Region } from '@nut-tree/nut-js';
import { Mat } from 'opencv4nodejs-prebuilt-install/lib/typings/Mat';

export class ScaleImage {
  static lowerBound(value: number, boundary: number, minValue: number): number {
    return value <= boundary ? minValue : value;
  }

  static upperBound(value: number, boundary: number, maxValue: number): number {
    return value >= boundary ? maxValue : value;
  }

  static async scaleImage(image: Mat, scaleFactor: number): Promise<Mat> {
    const boundScaleFactor = ScaleImage.lowerBound(scaleFactor, 0.0, 1.0);
    const scaledRows = Math.floor(image.rows * boundScaleFactor);
    const scaledCols = Math.floor(image.cols * boundScaleFactor);
    return image.resizeAsync(scaledRows, scaledCols, 0, 0, cv.INTER_AREA);
  }

  static scaleLocation(result: Region, scaleFactor: number): Region {
    const boundScaleFactor = ScaleImage.lowerBound(scaleFactor, 0.0, 1.0);
    return new Region(result.left / boundScaleFactor, result.top / boundScaleFactor, result.width, result.height);
  }
}
