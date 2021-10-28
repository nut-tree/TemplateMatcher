import {existsSync} from "fs";
import {FileType, screen, sleep} from "@nut-tree/nut-js";

import "@nut-tree/template-matcher";

jest.setTimeout(10000);

describe("Screen.", () => {
    it("should capture the screen", () => {
        // GIVEN

        // WHEN
        screen.capture("asdf", FileType.PNG).then(filename => {
            // THEN
            expect(filename).not.toBeNull();
            sleep(1000).then(() => {
                expect(existsSync(filename)).toBeTruthy();
            });
        });
    });

    it("should capture the screen and save to JPG", () => {
        // GIVEN

        // WHEN
        screen.capture("asdf", FileType.JPG).then(filename => {
            // THEN
            expect(filename).not.toBeNull();
            sleep(1000).then(() => {
                expect(existsSync(filename)).toBeTruthy();
            });
        });
    });

    it("should capture the screen and save file with prefix", () => {
        // GIVEN
        const prefix = "foo_";

        // WHEN
        screen.capture("asdf", FileType.JPG, "./", prefix).then(filename => {
            // THEN
            expect(filename.includes(prefix)).toBeTruthy();
            expect(filename).not.toBeNull();
            sleep(1000).then(() => {
                expect(existsSync(filename)).toBeTruthy();
            });
        });
    });

    it("should capture the screen and save file with postfix", () => {
        // GIVEN
        const postfix = "_bar";

        // WHEN
        screen.capture("asdf", FileType.JPG, "./", "", postfix).then(filename => {
            // THEN
            expect(filename.includes(postfix)).toBeTruthy();
            expect(filename).not.toBeNull();
            sleep(1000).then(() => {
                expect(existsSync(filename)).toBeTruthy();
            });
        });
    });

    it("should capture the screen and save file with pre- and postfix", () => {
        // GIVEN
        const filename = "asdf";
        const prefix = "foo_";
        const postfix = "_bar";

        // WHEN
        screen.capture("asdf", FileType.JPG, "./", prefix, postfix).then(output => {
            // THEN
            expect(output.includes(`${prefix}${filename}${postfix}`)).toBeTruthy();
            expect(output).not.toBeNull();
            sleep(1000).then(() => {
                expect(existsSync(output)).toBeTruthy();
            });
        });
    });
});
