import { RemarkService, UserRemark } from '../RemarkService';
import { Logger } from '../../utils/logger';

jest.mock('../../utils/logger');

const mockChromeStorage = {
  sync: {
    get: jest.fn(),
    set: jest.fn(),
  },
};

Object.defineProperty(global, 'chrome', {
  value: {
    storage: mockChromeStorage,
  },
  writable: true,
});

describe('RemarkService', () => {
  let remarkService: RemarkService;
  let mockLoggerLogEvent: jest.MockedFunction<typeof Logger.logEvent>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggerLogEvent = Logger.logEvent as jest.MockedFunction<
      typeof Logger.logEvent
    >;

    mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
      callback({});
    });
    mockChromeStorage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });

    remarkService = new RemarkService();
  });

  describe('getRemarks', () => {
    it('should return empty array when no remarks exist', async () => {
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const remarks = await remarkService.getRemarks();

      expect(remarks).toEqual([]);
      expect(mockChromeStorage.sync.get).toHaveBeenCalledWith(
        ['userRemarks'],
        expect.any(Function)
      );
    });

    it('should return existing remarks from storage', async () => {
      const existingRemarks: UserRemark[] = [
        { username: 'user1', remark: 'Test remark 1' },
        { username: 'user2', remark: 'Test remark 2' },
      ];

      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({ userRemarks: existingRemarks });
      });

      const remarks = await remarkService.getRemarks();

      expect(remarks).toEqual(existingRemarks);
    });

    it('should load remarks only once when called multiple times', async () => {
      const existingRemarks: UserRemark[] = [
        { username: 'user1', remark: 'Test remark' },
      ];

      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({ userRemarks: existingRemarks });
      });

      await remarkService.getRemarks();
      await remarkService.getRemarks();

      expect(mockChromeStorage.sync.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveRemark', () => {
    it('should save a new remark', async () => {
      const username = 'testuser';
      const remark = 'Test remark';

      await remarkService.saveRemark(username, remark);

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        { userRemarks: [{ username, remark }] },
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenCalledWith('remark_saved', {
        username,
        remark,
        total_remarks: 1,
      });
    });

    it('should update existing remark', async () => {
      const username = 'testuser';
      const initialRemark = 'Initial remark';
      const updatedRemark = 'Updated remark';

      await remarkService.saveRemark(username, initialRemark);
      await remarkService.saveRemark(username, updatedRemark);

      expect(mockChromeStorage.sync.set).toHaveBeenLastCalledWith(
        { userRemarks: [{ username, remark: updatedRemark }] },
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenLastCalledWith('remark_saved', {
        username,
        remark: updatedRemark,
        total_remarks: 1,
      });
    });

    it('should trim whitespace from remarks', async () => {
      const username = 'testuser';
      const remarkWithSpaces = '  Test remark  ';
      const trimmedRemark = 'Test remark';

      await remarkService.saveRemark(username, remarkWithSpaces);

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        { userRemarks: [{ username, remark: trimmedRemark }] },
        expect.any(Function)
      );
    });

    it('should remove remark when saving empty string', async () => {
      const username = 'testuser';

      await remarkService.saveRemark(username, 'Initial remark');
      await remarkService.saveRemark(username, '');

      expect(mockChromeStorage.sync.set).toHaveBeenLastCalledWith(
        { userRemarks: [] },
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenLastCalledWith('remark_removed', {
        username,
        total_remarks: 0,
      });
    });

    it('should remove remark when saving whitespace-only string', async () => {
      const username = 'testuser';

      await remarkService.saveRemark(username, 'Initial remark');
      await remarkService.saveRemark(username, '   ');

      expect(mockChromeStorage.sync.set).toHaveBeenLastCalledWith(
        { userRemarks: [] },
        expect.any(Function)
      );
    });
  });

  describe('removeRemark', () => {
    it('should remove existing remark', async () => {
      const username1 = 'user1';
      const username2 = 'user2';

      await remarkService.saveRemark(username1, 'Remark 1');
      await remarkService.saveRemark(username2, 'Remark 2');
      await remarkService.removeRemark(username1);

      expect(mockChromeStorage.sync.set).toHaveBeenLastCalledWith(
        { userRemarks: [{ username: username2, remark: 'Remark 2' }] },
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenLastCalledWith('remark_removed', {
        username: username1,
        total_remarks: 1,
      });
    });

    it('should handle removing non-existent remark gracefully', async () => {
      const username = 'nonexistent';

      await remarkService.removeRemark(username);

      expect(mockLoggerLogEvent).not.toHaveBeenCalledWith(
        'remark_removed',
        expect.any(Object)
      );
    });

    it('should remove all remarks when called on each user', async () => {
      await remarkService.saveRemark('user1', 'Remark 1');
      await remarkService.saveRemark('user2', 'Remark 2');

      await remarkService.removeRemark('user1');
      await remarkService.removeRemark('user2');

      expect(mockChromeStorage.sync.set).toHaveBeenLastCalledWith(
        { userRemarks: [] },
        expect.any(Function)
      );
    });
  });

  describe('findRemark', () => {
    it('should find existing remark', async () => {
      const username = 'testuser';
      const remark = 'Test remark';

      await remarkService.saveRemark(username, remark);
      const foundRemark = remarkService.findRemark(username);

      expect(foundRemark).toEqual({ username, remark });
    });

    it('should return undefined for non-existent remark', () => {
      const foundRemark = remarkService.findRemark('nonexistent');

      expect(foundRemark).toBeUndefined();
    });

    it('should find remark among multiple remarks', async () => {
      await remarkService.saveRemark('user1', 'Remark 1');
      await remarkService.saveRemark('user2', 'Remark 2');
      await remarkService.saveRemark('user3', 'Remark 3');

      const foundRemark = remarkService.findRemark('user2');

      expect(foundRemark).toEqual({ username: 'user2', remark: 'Remark 2' });
    });
  });

  describe('hasRemark', () => {
    it('should return true for existing remark', async () => {
      const username = 'testuser';

      await remarkService.saveRemark(username, 'Test remark');
      const hasRemark = remarkService.hasRemark(username);

      expect(hasRemark).toBe(true);
    });

    it('should return false for non-existent remark', () => {
      const hasRemark = remarkService.hasRemark('nonexistent');

      expect(hasRemark).toBe(false);
    });

    it('should return false after remark is removed', async () => {
      const username = 'testuser';

      await remarkService.saveRemark(username, 'Test remark');
      await remarkService.removeRemark(username);
      const hasRemark = remarkService.hasRemark(username);

      expect(hasRemark).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle chrome storage errors gracefully', async () => {
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        throw new Error('Storage error');
      });

      await expect(remarkService.getRemarks()).rejects.toThrow('Storage error');
    });

    it('should handle chrome storage set errors gracefully', async () => {
      mockChromeStorage.sync.set.mockImplementation(() => {
        throw new Error('Storage set error');
      });

      await expect(remarkService.saveRemark('user', 'remark')).rejects.toThrow(
        'Storage set error'
      );
    });
  });
});
