import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const tokensDir = resolve(here, '..', 'tokens');
export const resolverPath = resolve(tokensDir, 'resolver.json');
