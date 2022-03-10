import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  preset: "ts-jest/presets/js-with-ts",
  testMatch: [
    '**/test/**/*.test.(ts)'
  ]
};
export default config;
