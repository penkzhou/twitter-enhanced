/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // Module name mapping for imports and static assets
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/src/test/__mocks__/fileMock.js',
  },
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/tests/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/index.ts',
    '!src/**/index.tsx',
    '!src/manifest.json',
    // Exclude UI components initially (add back as we test them)
    '!src/components/ui/**/*',
    '!src/components/RemarkDialog.tsx',
    '!src/components/VideoSelectionDialog.tsx',
    // Exclude pages initially (add back as we test them)
    '!src/pages/**/*.tsx',
    // Include utilities that now have tests
    // '!src/utils/db.ts', // Removed - now has tests
    // '!src/utils/logger.ts', // Removed - now has tests
    // '!src/pages/Background/analytics.ts', // Removed - now has tests
    // Exclude complex modules initially
    '!src/pages/Background/modules/twitter-api.ts',
    '!src/lib/ga.ts',
  ],
  
  // Coverage thresholds (temporarily disabled for CI setup)
  // Will be gradually increased as we add more tests
  coverageThreshold: {
    // Disabled global thresholds for now
    // global: {
    //   branches: 70,
    //   functions: 70,
    //   lines: 70,
    //   statements: 70,
    // },
    
    // Individual file thresholds for tested files
    './src/lib/utils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  
  
  // Chrome extension APIs mocking
  setupFiles: ['jest-webextension-mock'],
  
  // Global test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage output directory
  coverageDirectory: 'coverage',
};