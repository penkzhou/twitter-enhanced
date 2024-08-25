import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DownloadRecord {
    id: number;
    tweetId: string;
    filename: string;
    downloadDate: string;
    downloadId: number;
    tweetUrl: string;
    tweetText: string;
}

interface TwitterVideoDownloadRecordDB extends DBSchema {
    downloadRecords: {
        key: number;
        value: DownloadRecord;
        indexes: { 'by-tweet-id': string, 'by-download-date': string };
    };
}

const dbPromise = openDB<TwitterVideoDownloadRecordDB>('DownloadRecordsDB', 1, {
    upgrade(db: IDBPDatabase<TwitterVideoDownloadRecordDB>) {
        const store = db.createObjectStore('downloadRecords', {
            keyPath: 'id',
            autoIncrement: true,
        });
        store.createIndex('by-tweet-id', 'tweetId');
        store.createIndex('by-download-date', 'downloadDate');
    },
});

export async function getAll(): Promise<DownloadRecord[]> {
    return (await dbPromise).getAll('downloadRecords');
}

export async function add(record: Omit<DownloadRecord, 'id'>): Promise<number> {
    return (await dbPromise).add('downloadRecords', record as DownloadRecord);
}

export async function update(record: DownloadRecord): Promise<number> {
    return (await dbPromise).put('downloadRecords', record);
}

export async function remove(id: number): Promise<void> {
    return (await dbPromise).delete('downloadRecords', id);
}

export async function clear(): Promise<void> {
    return (await dbPromise).clear('downloadRecords');
}