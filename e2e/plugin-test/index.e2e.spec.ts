import {
    assert,
    centerOf,
    down, imageResource,
    Key,
    keyboard,
    mouse,
    Region,
    right,
    screen,
    sleep,
    straightTo,
} from "@nut-tree/nut-js";

import "@nut-tree/template-matcher";

jest.setTimeout(60000);

const openXfceMenu = async () => {
    await mouse.move(straightTo(centerOf(screen.find(imageResource("menu.png")))));
    await mouse.leftClick();
    await mouse.leftClick();
};

const run = async (cmd: string) => {
    await keyboard.type(Key.LeftAlt, Key.F2);
    await keyboard.type(cmd);
    await keyboard.type(Key.Enter);
};

const calculate = async () => {
    await mouse.move(straightTo(centerOf(screen.find(imageResource("plus.png")))));
    await mouse.leftClick();
    await mouse.move(straightTo(centerOf(screen.find(imageResource("one.png")))));
    await mouse.leftClick();
    await mouse.move(straightTo(centerOf(screen.find(imageResource("zero.png")))));
    await mouse.leftClick();
    await mouse.leftClick();
    await mouse.move(straightTo(centerOf(screen.find(imageResource("equals.png")))));
    await mouse.leftClick();
};

const close = async () => {
    await mouse.move(straightTo(centerOf(screen.find(imageResource("close.png")))));
    await mouse.leftClick();
};

describe("E2E tests", () => {
    afterEach(async () => {
        // await keyboard.type(Key.LeftControl, Key.LeftAlt, Key.Left);
    });

    it("should press play", async () => {
        // GIVEN
        screen.config.resourceDirectory = "./e2e/assets";

        // WHEN
        await screen.highlight(screen.find(imageResource("play.png")));

        // THEN
    })

    it("should throw on invalid images", async () => {
        await expect(screen.find(imageResource("mouse.png"))).rejects.toContain("Failed to load image");
    });

    it("should perform some calculations", async () => {
        screen.config.resourceDirectory = "./e2e/assets";
        await assert.isVisible(imageResource("mouse.png"));
        await assert.isVisible(imageResource("desktop.png"));
        await openXfceMenu();
        await run("gnome-calculator");
        await sleep(1500);
        await assert.isVisible(imageResource("calculator.png"));
        await keyboard.type("525");
        await calculate();
        await screen.waitFor(imageResource("result.png"));
        await close();
    });

    it("drag & drop", async () => {
        screen.config.resourceDirectory = "./e2e/assets";

        const expected = new Region(38, 585, 70, 86);
        const maxDiff = 1;

        await assert.isVisible(imageResource("trash.png"));
        await mouse.move(straightTo(centerOf(screen.find(imageResource("trash.png")))));
        await mouse.drag(down(500));
        await mouse.move(right(100));
        await mouse.leftClick();
        const dest = await screen.waitFor(imageResource("moved_trash.png"));
        expect(Math.abs(dest.left - expected.left)).toBeLessThanOrEqual(maxDiff);
        expect(Math.abs(dest.top - expected.top)).toBeLessThanOrEqual(maxDiff);
        expect(Math.abs(dest.width - expected.width)).toBeLessThanOrEqual(maxDiff);
        expect(Math.abs(dest.height - expected.height)).toBeLessThanOrEqual(maxDiff);
    });
});
