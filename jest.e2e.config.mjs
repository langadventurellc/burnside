export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  rootDir: ".",
  testMatch: [
    "<rootDir>/src/**/*.e2e.test.ts"
  ],
  testTimeout: 30000,
  maxWorkers: 2,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  globalSetup: "<rootDir>/src/__tests__/e2e/setup/globalSetup.ts",
  globalTeardown: "<rootDir>/src/__tests__/e2e/setup/globalTeardown.ts",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/e2e/setup/setupEnv.ts"],
};
