import { register } from 'node:module';

// Keep the Node test suite compatible with the project's Node 20.19+ baseline.
register('./typescript-loader.mjs', import.meta.url);
