import * as cv from "opencv4nodejs-prebuilt";
import {Image, ImageReader} from "@nut-tree/nut-js";

export default class implements ImageReader {
    public async load(path: string): Promise<Image> {
        return new Promise<Image>(async (resolve, reject) => {
            try {
                const image = await cv.imreadAsync(path, cv.IMREAD_UNCHANGED);
                resolve(
                    new Image(
                        image.cols,
                        image.rows,
                        image.getData(),
                        image.channels,
                        path,
                        image.getData().length / (image.cols * image.rows),
                        image.getData().length / image.rows / 8
                    )
                );
            } catch (e) {
                reject(`Failed to load image from '${path}'`);
            }
        });
    }
}
