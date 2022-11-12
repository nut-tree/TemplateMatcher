import { providerRegistry } from '@nut-tree/nut-js';
import TemplateMatchingFinder from './lib/template-matching-finder.class';

const finder = new TemplateMatchingFinder();

providerRegistry.registerImageFinder(finder);

export default finder;
