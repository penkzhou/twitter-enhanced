// Mock the idb module before any imports
jest.mock('idb', () => ({
  openDB: jest.fn(),
}));

describe('Database Branch Coverage with Mocks', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Database upgrade path coverage', () => {
    it('should handle upgrade when object store already exists and indexes are missing', () => {
      const mockTransaction = {
        objectStore: jest.fn(),
      };

      const mockObjectStore = {
        createIndex: jest.fn(),
        indexNames: {
          contains: jest.fn((name: string) => {
            // Simulate missing indexes
            return false;
          }),
        },
      };

      mockTransaction.objectStore.mockReturnValue(mockObjectStore);

      const mockDb = {
        objectStoreNames: {
          contains: jest.fn((name: string) => {
            // Object store already exists
            return name === 'downloadRecords';
          }),
        },
        createObjectStore: jest.fn(),
      };

      // Import the db module
      const db = require('../db');

      // Get the upgrade function from the openDB call
      const { openDB } = require('idb');
      expect(openDB).toHaveBeenCalled();

      const upgradeCallback = openDB.mock.calls[0][2].upgrade;

      // Call the upgrade function with our mocks
      upgradeCallback(mockDb, 1, 2, mockTransaction);

      // Verify the else branch was taken (object store exists)
      expect(mockDb.createObjectStore).not.toHaveBeenCalled();
      expect(mockTransaction.objectStore).toHaveBeenCalledWith(
        'downloadRecords'
      );

      // Verify both indexes were created
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith(
        'by-tweet-id',
        'tweetId'
      );
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith(
        'by-download-date',
        'downloadDate'
      );
    });

    it('should handle upgrade with existing indexes', () => {
      const mockTransaction = {
        objectStore: jest.fn(),
      };

      const mockObjectStore = {
        createIndex: jest.fn(),
        indexNames: {
          contains: jest.fn(() => true), // All indexes exist
        },
      };

      mockTransaction.objectStore.mockReturnValue(mockObjectStore);

      const mockDb = {
        objectStoreNames: {
          contains: jest.fn(() => true), // Object store exists
        },
        createObjectStore: jest.fn(),
      };

      const db = require('../db');
      const { openDB } = require('idb');
      const upgradeCallback = openDB.mock.calls[0][2].upgrade;

      upgradeCallback(mockDb, 1, 2, mockTransaction);

      // Verify no indexes were created since they already exist
      expect(mockObjectStore.createIndex).not.toHaveBeenCalled();
    });

    it('should create object store when it does not exist', () => {
      const mockObjectStore = {
        createIndex: jest.fn(),
      };

      const mockDb = {
        objectStoreNames: {
          contains: jest.fn(() => false), // No object store exists
        },
        createObjectStore: jest.fn().mockReturnValue(mockObjectStore),
      };

      const mockTransaction = {};

      const db = require('../db');
      const { openDB } = require('idb');
      const upgradeCallback = openDB.mock.calls[0][2].upgrade;

      upgradeCallback(mockDb, 0, 2, mockTransaction);

      // Verify object store was created
      expect(mockDb.createObjectStore).toHaveBeenCalledWith('downloadRecords', {
        keyPath: 'id',
        autoIncrement: true,
      });

      // Verify indexes were created
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith(
        'by-tweet-id',
        'tweetId'
      );
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith(
        'by-download-date',
        'downloadDate'
      );
    });
  });

  describe('getAll() fallback path', () => {
    it('should use getAllFromStore when index is missing', async () => {
      const mockRecords = [
        { id: 1, tweetId: 'test1' },
        { id: 2, tweetId: 'test2' },
      ];

      const mockObjectStore = {
        indexNames: {
          contains: jest.fn(() => false), // Index missing
        },
        getAll: jest.fn().mockResolvedValue(mockRecords),
        index: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockObjectStore),
      };

      const mockDb = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
      };

      const { openDB } = require('idb');
      openDB.mockResolvedValue(mockDb);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const db = require('../db');
      const result = await db.getAll();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Index 'by-download-date' not found. Falling back to getAllFromStore."
      );
      expect(mockObjectStore.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockRecords);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getByTweetId() fallback path', () => {
    it('should use getAllFromStore and filter when index is missing', async () => {
      const mockRecords = [
        { id: 1, tweetId: 'test1' },
        { id: 2, tweetId: 'test2' },
        { id: 3, tweetId: 'test3' },
      ];

      const mockObjectStore = {
        indexNames: {
          contains: jest.fn(() => false), // Index missing
        },
        getAll: jest.fn().mockResolvedValue(mockRecords),
        index: jest.fn(),
      };

      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockObjectStore),
      };

      const mockDb = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
      };

      const { openDB } = require('idb');
      openDB.mockResolvedValue(mockDb);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const db = require('../db');
      const result = await db.getByTweetId('test2');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Index 'by-tweet-id' not found. Falling back to getAllFromStore and filtering."
      );
      expect(mockObjectStore.getAll).toHaveBeenCalled();
      expect(result).toEqual({ id: 2, tweetId: 'test2' });

      // Test non-existent
      const notFound = await db.getByTweetId('non-existent');
      expect(notFound).toBeUndefined();

      consoleWarnSpy.mockRestore();
    });
  });
});
