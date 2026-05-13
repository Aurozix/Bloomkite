const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // next-auth, @auth/*, oauth4webapi, jose, and @panva/hkdf ship ESM-only;
    // Jest can't parse them. The tests that touch auth mock it via jest.setup.ts.
    '^next-auth(/.*)?$': '<rootDir>/__tests__/__mocks__/next-auth.ts',
    '^@auth/.*$': '<rootDir>/__tests__/__mocks__/empty.ts',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'lib/**/*.tsx',
    'app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './lib/calculators/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './app/api/auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testTimeout: 10000,
}

module.exports = createJestConfig(customJestConfig)
