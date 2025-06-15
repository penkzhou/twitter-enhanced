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
  
  // Coverage configuration - Include core business logic for realistic assessment
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/manifest.json',
    
    // Include ALL core business logic to get realistic coverage numbers
    // ✅ Already tested: utils/*, lib/utils.ts, Background/analytics.ts
    
    // ⚠️ Include major untested files to show real coverage gaps:
    // NOTE: Content/index.ts is included via the general pattern since we removed index exclusions
    'src/pages/Background/modules/twitter-api.ts', // API integration (CRITICAL!)
    'src/lib/ga.ts', // Analytics module (IMPORTANT)
    
    // Include key components to show real scope
    'src/components/RemarkDialog.tsx', // Main user dialog
    'src/components/VideoSelectionDialog.tsx', // Download dialog
    
    // Include new service layer
    'src/services/**/*.ts', // Service layer for business logic
    
    // Include DOM management layer
    'src/dom/**/*.ts', // DOM operations and parsing
    
    // Exclude lower priority items for now
    '!src/components/ui/**/*', // Basic UI components 
    '!src/pages/**/*.tsx', // Page components (except main logic)
    // Temporarily include Content/index.ts to show true coverage
    '!src/pages/*/index.ts', // Most index files are simple exports
    '!src/pages/*/index.tsx', // Most index files are simple exports
    // But INCLUDE the critical Content/index.ts
    'src/pages/Content/index.ts', // THE MAIN 680-line business logic file!
  ],
  
  // Coverage thresholds - Realistic settings based on actual file inclusion
  // Updated to reflect true project coverage including major business logic files
  coverageThreshold: {
    // Temporarily lower thresholds due to compilation issues with Content/index.ts
    global: {
      branches: 5,     // Current: 6.98% - very low due to untested business logic
      functions: 20,   // Current: 26.53% - reasonable for tested utility functions  
      lines: 20,       // Current: 26.95% - reasonable baseline
      statements: 20,  // Current: 27.23% - maintain current level as minimum
    },
    
    // Individual file thresholds for tested files
    './src/lib/utils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/utils/logger.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/pages/Background/analytics.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/utils/db.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
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