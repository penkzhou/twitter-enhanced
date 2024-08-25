import React, { useState, useEffect } from 'react';
import './DownloadRecords.css';

interface DownloadRecord {
    id: number;
    tweetId: string;
    filename: string;
    downloadDate: string;
}

const DownloadRecords: React.FC = () => {
    const [records, setRecords] = useState<DownloadRecord[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = () => {
        chrome.storage.local.get(['downloadRecords'], (result) => {
            setRecords(result.downloadRecords || []);
        });
    };

    const displayRecords = () => {
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        return records.slice(startIndex, endIndex).map((record) => (
            <div key={record.id} className="record-item">
                <div className="record-content">
                    <span className="tweet-id">Tweet ID: {record.tweetId}</span>
                    <span className="filename">{record.filename}</span>
                    <span className="download-date">{record.downloadDate}</span>
                </div>
                <div className="record-actions">
                    <button onClick={() => locateFile(record.filename)}>{chrome.i18n.getMessage('locateFile')}</button>
                </div>
            </div>
        ));
    };

    const changePage = (delta: number) => {
        setCurrentPage(prevPage => prevPage + delta);
    };

    const locateFile = (filename: string) => {
        chrome.downloads.search({ filename: filename }, (downloads) => {
            if (downloads && downloads.length > 0) {
                chrome.downloads.show(downloads[0].id);
            } else {
                alert(chrome.i18n.getMessage('fileNotFound'));
            }
        });
    };

    const totalPages = Math.ceil(records.length / recordsPerPage);

    return (
        <div className="container">
            <h1>{chrome.i18n.getMessage('downloadRecords')}</h1>
            <div id="recordsList">{displayRecords()}</div>
            <div className="pagination">
                <button onClick={() => changePage(-1)} disabled={currentPage === 1}>{chrome.i18n.getMessage('previousPage')}</button>
                <span>{chrome.i18n.getMessage('pageOf', [currentPage.toString(), totalPages.toString()])}</span>
                <button onClick={() => changePage(1)} disabled={currentPage === totalPages}>{chrome.i18n.getMessage('nextPage')}</button>
            </div>
        </div>
    );
};

export default DownloadRecords;