import { Region } from '@nut-tree/nut-js';
import * as cv from 'opencv4nodejs-prebuilt-install';

export class ScaleImage {
  static lowerBound(value: number, boundary: number, minValue: number): number {
    return value <= boundary ? minValue : value;
  }

  static upperBound(value: number, boundary: number, maxValue: number): number {
    return value >= boundary ? maxValue : value;
  }

  static async scaleImage(image: cv.Mat, scaleFactor: number): Promise<cv.Mat> {
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
