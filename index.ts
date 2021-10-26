import {providerRegistry} from "@nut-tree/nut-js";
import TemplateMatchingFinder from "./lib/template-matching-finder.class";
import ImageReader from "./lib/image-reader.class";
import ImageWriter from "./lib/image-writer.class";

const finder = new TemplateMatchingFinder();
const imageReader = new ImageReader();
const imageWriter = new ImageWriter();

providerRegistry.registerImageFinder(finder);
providerRegistry.registerImageReader(imageReader);
providerRegistry.registerImageWriter(imageWriter);
