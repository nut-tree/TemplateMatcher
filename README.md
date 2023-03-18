# OpenCV 4.1.1 Template Matching Image Finder

![Tested](https://github.com/udarrr/TemplateMatcher/workflows/Tests/badge.svg)
![Released](https://github.com/udarrr/TemplateMatcher/workflows/Create%20tagged%20release/badge.svg)
![Supported node LTS versions](https://img.shields.io/badge/node@arch64-12%2C%2013%2C%2014%2C%2015%2C%2016%2C%2017%2C%2018%2C%2019-green)

### It's plugin for [nutjs project](https://www.npmjs.com/package/@nut-tree/nut-js) or standalone with some features like

- increased accuracy
- increased performance
- added some customOptions for arguments `providerData` in [nutjs](https://github.com/nut-tree/nut.js/blob/develop/lib/optionalsearchparameters.class.ts) implemented in nutjs > version 3, also available in standalone
- added standalone

#### Installation for nutjs

```nodejs
npm i @udarrr/template-matcher
```

and then just use it in your project once

```javascript
import "@udarrr/template-matcher"` or `require("@udarrr/template-matcher")
```

#### Installation for standalone

```nodejs
npm i @udarrr/template-matcher
```

and connect finder to your project

```javascript
import finder from "@udarrr/template-matcher";

//some examples
const matcheImages = await finder.findMatch({haystack: pathToImage, needle: pathToTemplate});
const matcheWithScreen = await finder.findMatch({needle: pathToTemplate});

const matchesImages = await finder.findMatches({haystack: pathToImage, needle: pathToTemplate});
const matchesWithScreen = await finder.findMatches({needle: pathToTemplate});
```

#### Options

```javascript
//@udarrr/template-matcher@2.0.1 with nutjs 3.1.1 options 
{
    confidence?: number,
    providerData?: {
                       searchMultipleScales?: boolean,
                       methodType?: MethodNameType; 
                       scaleSteps?: Array<number>; 
                       roi?: Region; 
                       debug?: boolean
                    },
}
```

```typescript
//standalone @udarrr/template-matcher@2.0.1
{
    haystack?: string | Image,
    needle: string | Image,
    confidence?: number,
    providerData?: {
                       searchMultipleScales?: boolean,
                       methodType?: MethodNameType; 
                       scaleSteps?: Array<number>; 
                       roi?: Region; 
                       debug?: boolean
                    },
}
```

```javascript
// methodType: "TM_CCOEFF" | "TM_CCOEFF_NORMED" | "TM_CCORR" | "TM_CCORR_NORMED" | "TM_SQDIFF" | "TM_SQDIFF_NORMED" by default "TM_CCOEFF_NORMED"
// scaleSteps:  [0.9]; by default  [1, 0.9, 0.8, 0.7, 0.6, 0.5]
// debug: true | false by default false

// for "TM_SQDIFF" | "TM_SQDIFF_NORMED" confidence by default 0.98
// for "TM_CCOEFF" | "TM_CCOEFF_NORMED" | "TM_CCORR" | "TM_CCORR_NORMED" by default 0.8
```
