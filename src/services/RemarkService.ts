import { Logger } from '../utils/logger';

export interface UserRemark {
  username: string;
  remark: string;
}

export interface IRemarkService {
  getRemarks(): Promise<UserRemark[]>;
  saveRemark(username: string, remark: string): Promise<void>;
  removeRemark(username: string): Promise<void>;
  findRemark(username: string): UserRemark | undefined;
  hasRemark(username: string): boolean;
}

export class RemarkService implements IRemarkService {
  private userRemarks: UserRemark[] = [];

  constructor() {
    this.loadRemarks();
  }

  async getRemarks(): Promise<UserRemark[]> {
    if (this.userRemarks.length === 0) {
      await this.loadRemarks();
    }
    return this.userRemarks;
  }

  async saveRemark(username: string, remark: string): Promise<void> {
    const trimmedRemark = remark.trim();

    if (trimmedRemark === '') {
      await this.removeRemark(username);
      return;
    }

    const existingRemarkIndex = this.userRemarks.findIndex(
      (r) => r.username === username
    );

    if (existingRemarkIndex !== -1) {
      this.userRemarks[existingRemarkIndex].remark = trimmedRemark;
    } else {
      this.userRemarks.push({ username, remark: trimmedRemark });
    }

    await this.persistRemarks();
    Logger.logEvent('remark_saved', {
      username,
      remark: trimmedRemark,
      total_remarks: this.userRemarks.length,
    });
  }

  async removeRemark(username: string): Promise<void> {
    const initialLength = this.userRemarks.length;
    this.userRemarks = this.userRemarks.filter((r) => r.username !== username);

    if (this.userRemarks.length < initialLength) {
      await this.persistRemarks();
      Logger.logEvent('remark_removed', {
        username,
        total_remarks: this.userRemarks.length,
      });
    }
  }

  findRemark(username: string): UserRemark | undefined {
    return this.userRemarks.find((r) => r.username === username);
  }

  hasRemark(username: string): boolean {
    return this.userRemarks.some((r) => r.username === username);
  }

  private async loadRemarks(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['userRemarks'], (result) => {
        this.userRemarks = result.userRemarks || [];
        resolve();
      });
    });
  }

  private async persistRemarks(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ userRemarks: this.userRemarks }, () => {
        resolve();
      });
    });
  }
}
