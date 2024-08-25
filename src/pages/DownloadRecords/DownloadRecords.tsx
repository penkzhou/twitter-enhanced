import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileSearch, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

interface DownloadRecord {
    id: number;
    tweetId: string;
    filename: string;
    downloadDate: string;
    downloadId: number;
}

const DownloadRecords: React.FC = () => {
    const [records, setRecords] = useState<DownloadRecord[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const recordsPerPage = 10;

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = () => {
        chrome.storage.local.get(['downloadRecords'], (result) => {
            setRecords(result.downloadRecords || []);
        });
    };

    const filteredRecords = records.filter(record =>
        record.tweetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayRecords = () => {
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        return filteredRecords.slice(startIndex, endIndex).map((record) => (
            <TableRow key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <TableCell className="font-medium py-4">
                    <Badge variant="secondary">{record.tweetId}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate py-4">{record.filename}</TableCell>
                <TableCell className="py-4">{new Date(record.downloadDate).toLocaleString()}</TableCell>
                <TableCell className="py-4">
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => locateFile(record.downloadId)}>
                            <FileSearch className="w-4 h-4 mr-2" />
                            {chrome.i18n.getMessage('locateFile')}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteRecord(record.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        ));
    };

    const changePage = (delta: number) => {
        setCurrentPage(prevPage => prevPage + delta);
    };

    const locateFile = (downloadId: number) => {
        chrome.downloads.show(downloadId);
    };

    const deleteRecord = (id: number) => {
        const updatedRecords = records.filter(record => record.id !== id);
        setRecords(updatedRecords);
        chrome.storage.local.set({ downloadRecords: updatedRecords });
    };

    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    return (
        <div className="flex justify-center items-start min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="shadow-lg w-full max-w-4xl">
                <CardHeader className="bg-gray-50 dark:bg-gray-800">
                    <CardTitle className="text-2xl font-bold text-center">{chrome.i18n.getMessage('downloadRecords')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="mb-6 flex justify-center">
                        <Input
                            type="text"
                            placeholder={chrome.i18n.getMessage('searchRecords')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/4">{chrome.i18n.getMessage('tweetId')}</TableHead>
                                            <TableHead className="w-1/4">{chrome.i18n.getMessage('filename')}</TableHead>
                                            <TableHead className="w-1/4">{chrome.i18n.getMessage('downloadDate')}</TableHead>
                                            <TableHead className="w-1/4">{chrome.i18n.getMessage('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayRecords()}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                        <Button
                            variant="outline"
                            onClick={() => changePage(-1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            {chrome.i18n.getMessage('previousPage')}
                        </Button>
                        <span className="text-sm text-gray-600">
                            {chrome.i18n.getMessage('pageOf', [currentPage.toString(), totalPages.toString()])}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => changePage(1)}
                            disabled={currentPage === totalPages}
                        >
                            {chrome.i18n.getMessage('nextPage')}
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DownloadRecords;