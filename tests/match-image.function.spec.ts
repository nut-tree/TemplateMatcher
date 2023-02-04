import * as cv from 'opencv4nodejs-prebuilt-install';
import { mockPartial } from 'sneer';
import { MatchTemplate, MethodEnum } from '../lib/match-image.function';

jest.mock('jimp', () => {});

describe('matchImages', () => {
  it('should return minLoc position and needle size', async () => {
    // GIVEN
    const minLocX = 100;
    const minLocY = 1000;
    const matchMock = mockPartial<cv.Mat>({
      minMaxLocAsync: jest.fn(() =>
        Promise.resolve({
          maxLoc: new cv.Point2(200, 2000),
          maxVal: 100,
          minLoc: new cv.Point2(minLocX, minLocY),
          minVal: 0,
        }),
      ),
    });
    const haystackMock = mockPartial<cv.Mat>({
      matchTemplateAsync: jest.fn(() => Promise.resolve(matchMock)),
    });
    const needleMock = mockPartial<cv.Mat>({
      cols: 123,
      rows: 456,
    });

    // WHEN
    const result = await MatchTemplate.matchImages(haystackMock, needleMock, MethodEnum.TM_SQDIFF_NORMED);

    // THEN
    expect(result.data.location.left).toEqual(minLocX);
    expect(result.data.location.top).toEqual(minLocY);
    expect(result.data.location.width).toEqual(needleMock.cols);
    expect(result.data.location.height).toEqual(needleMock.rows);
  });
});
