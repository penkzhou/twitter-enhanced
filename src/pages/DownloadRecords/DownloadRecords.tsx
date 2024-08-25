import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileSearch, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import * as db from '../../utils/db';
import { format, formatDistanceToNow } from 'date-fns';

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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
    const recordsPerPage = 10;

    useEffect(() => {
        loadRecords();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const loadRecords = async () => {
        const allRecords = await db.getAll();
        setRecords(allRecords);
    };

    const filteredRecords = records.filter(record =>
        record.tweetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        /// this should output the date with difference from now in one of the following formats:
        /// 0. "2 min ago" or "3 hours ago"
        ///1. "Today"
        /// 2. "Yesterday"
        /// 3. "2 days ago"
        /// 4. "2023-03-29 12:00"
        const date = new Date(dateString);
        const formattedDate = format(date, 'PPP'); // e.g., "Apr 29, 2023"
        const timeAgo = formatDistanceToNow(date, { addSuffix: true }); // e.g., "2 days ago"
        /// get time diff in seconds
        const timeDiff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        /// if timeDiff less than one day return timeAgo
        if (timeDiff < 86400) {
            return timeAgo;
        }
        return formattedDate;
    };

    const displayRecords = () => {
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        return filteredRecords.slice(startIndex, endIndex).map((record) => (
            <TableRow key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <TableCell className="font-medium py-4">
                    <Badge variant="secondary">{record.tweetId}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate py-4">{record.filename}</TableCell>
                <TableCell className="py-4">{formatDate(record.downloadDate)}</TableCell>
                <TableCell className="py-4">
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => locateFile(record.downloadId)}>
                            <FileSearch className="w-4 h-4 mr-2" />
                            {chrome.i18n.getMessage('locateFile')}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(record.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        ));
    };

    const changePage = (delta: number) => {
        setCurrentPage(prevPage => {
            const newPage = prevPage + delta;
            return Math.max(1, Math.min(newPage, totalPages));
        });
    };

    const locateFile = (downloadId: number) => {
        chrome.downloads.show(downloadId);
    };

    const openDeleteDialog = (id: number) => {
        setRecordToDelete(id);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setRecordToDelete(null);
        setDeleteDialogOpen(false);
    };

    const confirmDelete = async () => {
        if (recordToDelete !== null) {
            await db.remove(recordToDelete);
            await loadRecords();
            closeDeleteDialog();
        }
    };

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));

    return (
        <>
            <Card className="shadow-lg w-full max-w-4xl">
                <CardHeader className="bg-gray-50 dark:bg-gray-800">
                    <CardTitle className="text-2xl font-bold text-center">{chrome.i18n.getMessage('downloadRecords')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center">
                    <div className="w-full max-w-md mb-6">
                        <Input
                            type="text"
                            placeholder={chrome.i18n.getMessage('searchRecords')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="w-full overflow-x-auto">
                        <Table className="w-full">
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
                    <div className="flex items-center justify-between mt-6 w-full max-w-md">
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
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{chrome.i18n.getMessage('confirmDelete')}</DialogTitle>
                        <DialogDescription>
                            {chrome.i18n.getMessage('deleteRecordConfirmation')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDeleteDialog}>
                            {chrome.i18n.getMessage('cancel')}
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            {chrome.i18n.getMessage('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DownloadRecords;