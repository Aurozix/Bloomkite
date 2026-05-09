const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
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
