import { openDB, DBSchema, IDBPDatabase, IDBPObjectStore } from 'idb';

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

const DB_NAME = 'DownloadRecordsDB';
const STORE_NAME = 'downloadRecords';
const DB_VERSION = 2; // Increment the version to trigger an upgrade

const dbPromise = openDB<TwitterVideoDownloadRecordDB>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<TwitterVideoDownloadRecordDB>, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
                keyPath: 'id',
                autoIncrement: true,
            });
            store.createIndex('by-tweet-id', 'tweetId');
            store.createIndex('by-download-date', 'downloadDate');
        } else {
            const store = transaction.objectStore(STORE_NAME);
            if (!store.indexNames.contains('by-tweet-id')) {
                store.createIndex('by-tweet-id', 'tweetId');
            }
            if (!store.indexNames.contains('by-download-date')) {
                store.createIndex('by-download-date', 'downloadDate');
            }
        }
    },
});

export async function getAll(): Promise<DownloadRecord[]> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    if (!store.indexNames.contains('by-download-date')) {
        console.warn("Index 'by-download-date' not found. Falling back to getAllFromStore.");
        return getAllFromStore(store);
    }

    console.log("Index 'by-download-date' found. Using it.");

    const index = store.index('by-download-date');
    let cursor = await index.openCursor(null, "prev");
    console.log("Cursor opened.");
    const records: DownloadRecord[] = [];
    while (cursor) {
        records.push(cursor.value);
        cursor = await cursor.continue();
    }
    return records;
}

async function getAllFromStore(store: IDBPObjectStore<TwitterVideoDownloadRecordDB, ["downloadRecords"], "downloadRecords">): Promise<DownloadRecord[]> {
    return store.getAll();
}

export async function add(record: Omit<DownloadRecord, 'id'>): Promise<number> {
    return (await dbPromise).add(STORE_NAME, record as DownloadRecord);
}

export async function update(record: DownloadRecord): Promise<number> {
    return (await dbPromise).put(STORE_NAME, record);
}

export async function remove(id: number): Promise<void> {
    return (await dbPromise).delete(STORE_NAME, id);
}

export async function clear(): Promise<void> {
    return (await dbPromise).clear(STORE_NAME);
}

export async function getByTweetId(tweetId: string): Promise<DownloadRecord | undefined> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    if (!store.indexNames.contains('by-tweet-id')) {
        console.warn("Index 'by-tweet-id' not found. Falling back to getAllFromStore and filtering.");
        const allRecords = await getAllFromStore(store);
        return allRecords.find(record => record.tweetId === tweetId);
    }

    const index = store.index('by-tweet-id');
    return index.get(tweetId);
}