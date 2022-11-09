# nut.js Template Matching Image Finder

| |GitHub Actions|
|:-: |:-: |
|Master |![Create tagged release](https://github.com/nut-tree/TemplateMatcher/workflows/Create%20tagged%20release/badge.svg)|
|Develop|![Create snapshot release](https://github.com/nut-tree/TemplateMatcher/workflows/Create%20snapshot%20release/badge.svg)|

![Supported node LTS versions](https://img.shields.io/badge/node%40lts-erbium%2C%20fermium%2C%20gallium-green)
![Supported Electron versions](https://img.shields.io/badge/electron-8.x.x%20--%2013.x.x-green)

### It's plugin for [nutjs project](https://www.npmjs.com/package/@nut-tree/nut-js)  with some features like

- incresed accuracy (x10)
- incresed perfomance (~x2)
- added some customOptions for arguments `params?: OptionalSearchParameters` in [nutjs](https://github.com/nut-tree/nut.js/blob/develop/lib/optionalsearchparameters.class.ts)

#### Installation

`npm i @udarrr/template-matcher`

and then just use it in your project once

`import "@udarrr/template-matcher"` or `require("@udarrr/template-matcher")`

#### Options

`
{
    customOptions: {methodType: MethodNameType; scaleSteps: Array<number>; debug: boolean},
}
`

- methodType: "TM_CCOEFF" | "TM_CCOEFF_NORMED" | "TM_CCORR" | "TM_CCORR_NORMED" | "TM_SQDIFF" | "TM_SQDIFF_NORMED" by default "TM_CCOEFF_NORMED"
- scaleSteps:  [0.9]; by default  [1, 0.9, 0.8, 0.7, 0.6, 0.5]
- debug: true | false by default false

for "TM_SQDIFF" | "TM_SQDIFF_NORMED" confidence by default 0.98

for "TM_CCOEFF" | "TM_CCOEFF_NORMED" | "TM_CCORR" | "TM_CCORR_NORMED" by default 0.8
