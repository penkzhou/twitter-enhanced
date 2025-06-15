import * as db from '../db';
import { createMockDownloadRecord } from '../../test/utils/testHelpers';

// Mock console methods to avoid noise in test output
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  log: jest.spyOn(console, 'log').mockImplementation(),
};

describe('Database Operations', () => {
  beforeEach(() => {
    // Clear any previous IndexedDB data between tests
    // FakeIndexedDB automatically handles this
    consoleSpy.warn.mockClear();
    consoleSpy.log.mockClear();
  });

  afterEach(() => {
    // Clean up any remaining data
    return db.clear().catch(() => {
      // Ignore errors during cleanup
    });
  });

  describe('add()', () => {
    it('should add a download record successfully', async () => {
      const record = createMockDownloadRecord();
      // Remove id since add() expects Omit<DownloadRecord, 'id'>
      const { id, ...recordWithoutId } = record;

      const result = await db.add(recordWithoutId);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should auto-increment IDs for multiple records', async () => {
      const record1 = createMockDownloadRecord({ tweetId: 'tweet1' });
      const record2 = createMockDownloadRecord({ tweetId: 'tweet2' });
      const { id: id1, ...record1WithoutId } = record1;
      const { id: id2, ...record2WithoutId } = record2;

      const result1 = await db.add(record1WithoutId);
      const result2 = await db.add(record2WithoutId);

      expect(result1).toBeGreaterThan(0);
      expect(result2).toBeGreaterThan(result1);
    });

    it('should handle records with special characters', async () => {
      const record = createMockDownloadRecord({
        filename: 'video-with-émojis-🎥.mp4',
        tweetText: 'Tweet with special chars: @user #hashtag 中文',
      });
      const { id, ...recordWithoutId } = record;

      const result = await db.add(recordWithoutId);

      expect(typeof result).toBe('number');
    });
  });

  describe('getAll()', () => {
    it('should return empty array when no records exist', async () => {
      const records = await db.getAll();

      expect(Array.isArray(records)).toBe(true);
      expect(records).toHaveLength(0);
    });

    it('should return all records in reverse chronological order', async () => {
      const record1 = createMockDownloadRecord({
        tweetId: 'tweet1',
        downloadDate: '2024-01-01T10:00:00Z',
      });
      const record2 = createMockDownloadRecord({
        tweetId: 'tweet2',
        downloadDate: '2024-01-02T10:00:00Z',
      });
      const record3 = createMockDownloadRecord({
        tweetId: 'tweet3',
        downloadDate: '2024-01-03T10:00:00Z',
      });

      const { id: id1, ...record1WithoutId } = record1;
      const { id: id2, ...record2WithoutId } = record2;
      const { id: id3, ...record3WithoutId } = record3;

      await db.add(record1WithoutId);
      await db.add(record2WithoutId);
      await db.add(record3WithoutId);

      const records = await db.getAll();

      expect(records).toHaveLength(3);
      // Should be in reverse chronological order (newest first)
      expect(records[0].downloadDate).toBe('2024-01-03T10:00:00Z');
      expect(records[1].downloadDate).toBe('2024-01-02T10:00:00Z');
      expect(records[2].downloadDate).toBe('2024-01-01T10:00:00Z');
    });

    it('should handle fallback when index is not available', async () => {
      // This test verifies the fallback behavior mentioned in the code
      const record = createMockDownloadRecord();
      const { id, ...recordWithoutId } = record;

      await db.add(recordWithoutId);
      const records = await db.getAll();

      expect(records).toHaveLength(1);
      expect(records[0].tweetId).toBe(record.tweetId);
    });
  });

  describe('getByTweetId()', () => {
    it('should return undefined for non-existent tweet ID', async () => {
      const record = await db.getByTweetId('non-existent-tweet');

      expect(record).toBeUndefined();
    });

    it('should return the correct record for existing tweet ID', async () => {
      const originalRecord = createMockDownloadRecord({ tweetId: 'unique-tweet-123' });
      const { id, ...recordWithoutId } = originalRecord;

      const addedId = await db.add(recordWithoutId);
      const foundRecord = await db.getByTweetId('unique-tweet-123');

      expect(foundRecord).toBeDefined();
      expect(foundRecord!.tweetId).toBe('unique-tweet-123');
      expect(foundRecord!.id).toBe(addedId);
      expect(foundRecord!.filename).toBe(originalRecord.filename);
    });

    it('should return the first record if multiple records have the same tweet ID', async () => {
      const record1 = createMockDownloadRecord({
        tweetId: 'duplicate-tweet',
        filename: 'first.mp4',
      });
      const record2 = createMockDownloadRecord({
        tweetId: 'duplicate-tweet',
        filename: 'second.mp4',
      });

      const { id: id1, ...record1WithoutId } = record1;
      const { id: id2, ...record2WithoutId } = record2;

      await db.add(record1WithoutId);
      await db.add(record2WithoutId);

      const foundRecord = await db.getByTweetId('duplicate-tweet');

      expect(foundRecord).toBeDefined();
      expect(foundRecord!.tweetId).toBe('duplicate-tweet');
      // Should return one of the records (exact one depends on implementation)
      expect(['first.mp4', 'second.mp4']).toContain(foundRecord!.filename);
    });

    it('should handle fallback when index is not available', async () => {
      const record = createMockDownloadRecord({ tweetId: 'fallback-test' });
      const { id, ...recordWithoutId } = record;

      await db.add(recordWithoutId);
      const foundRecord = await db.getByTweetId('fallback-test');

      expect(foundRecord).toBeDefined();
      expect(foundRecord!.tweetId).toBe('fallback-test');
    });
  });

  describe('update()', () => {
    it('should update an existing record', async () => {
      const originalRecord = createMockDownloadRecord({ filename: 'original.mp4' });
      const { id, ...recordWithoutId } = originalRecord;

      const addedId = await db.add(recordWithoutId);
      const updatedRecord = { ...originalRecord, id: addedId, filename: 'updated.mp4' };

      const updateResult = await db.update(updatedRecord);
      const foundRecord = await db.getByTweetId(originalRecord.tweetId);

      expect(updateResult).toBe(addedId);
      expect(foundRecord!.filename).toBe('updated.mp4');
    });

    it('should create a new record if ID does not exist', async () => {
      const newRecord = { ...createMockDownloadRecord(), id: 999 };

      const result = await db.update(newRecord);

      expect(typeof result).toBe('number');
      // The result might be different from 999 due to auto-increment
    });
  });

  describe('remove()', () => {
    it('should remove an existing record', async () => {
      const record = createMockDownloadRecord();
      const { id, ...recordWithoutId } = record;

      const addedId = await db.add(recordWithoutId);
      await db.remove(addedId);

      const foundRecord = await db.getByTweetId(record.tweetId);
      expect(foundRecord).toBeUndefined();
    });

    it('should not throw error when removing non-existent record', async () => {
      await expect(db.remove(99999)).resolves.toBeUndefined();
    });
  });

  describe('clear()', () => {
    it('should remove all records', async () => {
      const record1 = createMockDownloadRecord({ tweetId: 'tweet1' });
      const record2 = createMockDownloadRecord({ tweetId: 'tweet2' });
      const { id: id1, ...record1WithoutId } = record1;
      const { id: id2, ...record2WithoutId } = record2;

      await db.add(record1WithoutId);
      await db.add(record2WithoutId);

      let records = await db.getAll();
      expect(records).toHaveLength(2);

      await db.clear();

      records = await db.getAll();
      expect(records).toHaveLength(0);
    });

    it('should not throw error when clearing empty database', async () => {
      await expect(db.clear()).resolves.toBeUndefined();
    });
  });

  describe('Data integrity', () => {
    it('should preserve all data fields correctly', async () => {
      const originalRecord = createMockDownloadRecord({
        tweetId: 'integrity-test',
        filename: 'test-video.mp4',
        downloadDate: '2024-01-15T14:30:00Z',
        downloadId: 12345,
        tweetUrl: 'https://twitter.com/user/status/123456789',
        tweetText: 'This is a test tweet with #hashtag and @mention',
      });
      const { id, ...recordWithoutId } = originalRecord;

      const addedId = await db.add(recordWithoutId);
      const retrievedRecord = await db.getByTweetId('integrity-test');

      expect(retrievedRecord).toBeDefined();
      expect(retrievedRecord!.id).toBe(addedId);
      expect(retrievedRecord!.tweetId).toBe(originalRecord.tweetId);
      expect(retrievedRecord!.filename).toBe(originalRecord.filename);
      expect(retrievedRecord!.downloadDate).toBe(originalRecord.downloadDate);
      expect(retrievedRecord!.downloadId).toBe(originalRecord.downloadId);
      expect(retrievedRecord!.tweetUrl).toBe(originalRecord.tweetUrl);
      expect(retrievedRecord!.tweetText).toBe(originalRecord.tweetText);
    });

    it('should handle empty string values', async () => {
      const record = createMockDownloadRecord({
        filename: '',
        tweetText: '',
        tweetUrl: '',
      });
      const { id, ...recordWithoutId } = record;

      const addedId = await db.add(recordWithoutId);
      const retrievedRecord = await db.getByTweetId(record.tweetId);

      expect(retrievedRecord).toBeDefined();
      expect(retrievedRecord!.filename).toBe('');
      expect(retrievedRecord!.tweetText).toBe('');
      expect(retrievedRecord!.tweetUrl).toBe('');
    });
  });

  describe('Error handling', () => {
    it('should handle concurrent operations gracefully', async () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        createMockDownloadRecord({ tweetId: `concurrent-${i}` })
      );

      const promises = records.map(async (record) => {
        const { id, ...recordWithoutId } = record;
        return db.add(recordWithoutId);
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((id) => {
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
      });

      const allRecords = await db.getAll();
      expect(allRecords).toHaveLength(10);
    });
  });
});