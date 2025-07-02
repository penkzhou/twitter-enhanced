import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import * as db from '../../utils/db';
import { format, formatDistanceToNow } from 'date-fns';
import { Logger } from '../../utils/logger';

interface DownloadRecord {
  id: number;
  tweetId: string;
  filename: string;
  downloadDate: string;
  downloadId: number;
  tweetUrl: string;
  tweetText: string;
}

const DownloadRecords: React.FC = () => {
  const [records, setRecords] = useState<DownloadRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(
    null
  );
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [notFoundRecordId, setNotFoundRecordId] = useState<number | null>(null);
  const recordsPerPage = 10;
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    Logger.logPageView('Download Records', 'download_records', {
      page: 'download_records',
    });

    const initializeRecords = async () => {
      const allRecords = await db.getAll();
      setRecords(allRecords);

      const urlParams = new URLSearchParams(window.location.search);
      const recordId = urlParams.get('recordId');
      if (recordId) {
        const id = parseInt(recordId, 10);
        findAndNavigateToRecord(allRecords, id);
      }
    };

    initializeRecords();
  }, []);

  useEffect(() => {
    if (highlightedRecordId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedRecordId, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadRecords = async () => {
    const allRecords = await db.getAll();
    setRecords(allRecords);
    return allRecords;
  };

  const findAndNavigateToRecord = (
    records: DownloadRecord[],
    recordId: number
  ) => {
    const recordIndex = records.findIndex((record) => record.id === recordId);
    if (recordIndex === -1) {
      setNotFoundRecordId(recordId);
      return;
    }

    const pageNumber = Math.floor(recordIndex / recordsPerPage) + 1;
    setCurrentPage(pageNumber);
    setHighlightedRecordId(recordId);
  };

  const filteredRecords = records.filter(
    (record) =>
      record.tweetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.tweetText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    /// transfer dateString to date
    const dateMilliseconds = new Date(Number(dateString)).getTime();
    const date = new Date(dateMilliseconds);
    const formattedDate = format(date, 'PPP');
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    const timeDiff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (timeDiff < 86400) {
      return timeAgo;
    }
    return formattedDate;
  };

  const displayRecords = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredRecords.slice(startIndex, endIndex).map((record) => (
      <TableRow
        key={record.id}
        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          record.id === highlightedRecordId
            ? 'bg-blue-100 dark:bg-blue-900'
            : ''
        }`}
        ref={record.id === highlightedRecordId ? highlightedRowRef : null}
      >
        <TableCell className="py-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
          >
            <a href={record.tweetUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              {chrome.i18n.getMessage('openOriginTweet')}
            </a>
          </Button>
        </TableCell>
        <TableCell className="py-4">
          {formatDate(record.downloadDate)}
        </TableCell>
        <TableCell className="py-4">
          <div className="whitespace-pre-wrap break-words max-w-xs max-h-32 overflow-y-auto">
            {record.tweetText}
          </div>
        </TableCell>
        <TableCell className="py-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => locateFile(record.downloadId)}
            >
              <FileSearch className="w-4 h-4 mr-2" />
              {chrome.i18n.getMessage('locateFile')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openDeleteDialog(record.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const changePage = (delta: number) => {
    setCurrentPage((prevPage) => {
      const newPage = prevPage + delta;
      return Math.max(1, Math.min(newPage, totalPages));
    });
  };

  const locateFile = (downloadId: number) => {
    Logger.logEvent('locate_file', { download_id: downloadId });
    chrome.downloads.show(downloadId);
  };

  const openDeleteDialog = (id: number) => {
    setRecordToDelete(id);
    Logger.logEvent('openDeleteDialog', { record_id: id });
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setRecordToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (recordToDelete !== null) {
      Logger.logEvent('confirmDelete', { record_id: recordToDelete });
      await db.remove(recordToDelete);
      const updatedRecords = await loadRecords();
      closeDeleteDialog();

      // Check if we need to adjust the current page
      if (
        updatedRecords.length <= (currentPage - 1) * recordsPerPage &&
        currentPage > 1
      ) {
        setCurrentPage((prevPage) => prevPage - 1);
      }
    }
  };

  const openClearAllDialog = () => {
    Logger.logEvent('openClearAllDialog', { record_id: recordToDelete });
    setClearAllDialogOpen(true);
  };

  const closeClearAllDialog = () => {
    setClearAllDialogOpen(false);
  };

  const confirmClearAll = async () => {
    Logger.logEvent('clearAllRecords', {});
    await db.clear();
    await loadRecords();
    closeClearAllDialog();
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / recordsPerPage)
  );

  return (
    <>
      <Card className="shadow-lg w-full max-w-6xl">
        <CardHeader className="bg-gray-50 dark:bg-gray-800">
          <CardTitle className="text-2xl font-bold text-center">
            {chrome.i18n.getMessage('downloadRecords')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center">
          {notFoundRecordId && (
            <div className="w-full mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
              <p>
                {chrome.i18n.getMessage('recordNotFound', [
                  notFoundRecordId.toString(),
                ])}
              </p>
            </div>
          )}
          <div className="w-full max-w-md mb-6">
            <Input
              type="text"
              placeholder={chrome.i18n.getMessage('searchRecordsAndTweets')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/5">
                    {chrome.i18n.getMessage('originTweet')}
                  </TableHead>
                  <TableHead className="w-1/5">
                    {chrome.i18n.getMessage('downloadDate')}
                  </TableHead>
                  <TableHead className="w-2/5">
                    {chrome.i18n.getMessage('tweetText')}
                  </TableHead>
                  <TableHead className="w-1/5">
                    {chrome.i18n.getMessage('actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{displayRecords()}</TableBody>
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
              {chrome.i18n.getMessage('pageOf', [
                currentPage.toString(),
                totalPages.toString(),
              ])}
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
          <div className="mt-6 w-full flex justify-center">
            <Button
              variant="destructive"
              onClick={openClearAllDialog}
              className="w-full max-w-md"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {chrome.i18n.getMessage('clearAllRecords')}
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
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {chrome.i18n.getMessage('confirmClearAll')}
            </DialogTitle>
            <DialogDescription>
              {chrome.i18n.getMessage('clearAllRecordsConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 mb-4 text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300">
            <AlertTriangle className="flex-shrink-0 w-5 h-5 mr-2" />
            <span className="text-sm font-medium">
              {chrome.i18n.getMessage('clearAllWarning')}
            </span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeClearAllDialog}>
              {chrome.i18n.getMessage('cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmClearAll}>
              {chrome.i18n.getMessage('clearAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DownloadRecords;
