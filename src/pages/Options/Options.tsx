import React, { useState, useEffect, useRef } from 'react';
import { Logger } from '../../utils/logger';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';
import '../../globals.css';

interface UserRemark {
  username: string;
  remark: string;
}

interface OptionsProps {
  title: string;
}

/**
 * Detect system dark mode preference
 */
const detectDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// SVG Icon Components
const EditIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-4 w-4', className)}
    fill="currentColor"
  >
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-4 w-4', className)}
    fill="currentColor"
  >
    <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-[18px] w-[18px]', className)}
    fill="currentColor"
  >
    <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z" />
  </svg>
);

const Options: React.FC<OptionsProps> = ({ title: _title }) => {
  const [userRemarks, setUserRemarks] = useState<UserRemark[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEditRemark, setCurrentEditRemark] = useState<UserRemark | null>(
    null
  );
  const [remarkToDelete, setRemarkToDelete] = useState<number | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(detectDarkMode);
  const remarksPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRemarks();
    Logger.logPageView('Remark Management', 'options', {
      page: 'remark_management',
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loadRemarks = () => {
    chrome.storage.sync.get(['userRemarks'], (result) => {
      setUserRemarks((result.userRemarks as UserRemark[] | undefined) || []);
    });
  };

  const saveRemarks = (remarks: UserRemark[]) => {
    Logger.logEvent('save_remarks_on_options', { remarks: remarks });
    chrome.storage.sync.set({ userRemarks: remarks }, () => {
      console.log('Remarks saved');
    });
  };

  const changePage = (delta: number) => {
    setCurrentPage((prevPage) => {
      const newPage = prevPage + delta;
      return Math.max(1, Math.min(newPage, totalPages));
    });
  };

  const openEditDialog = (index: number) => {
    Logger.logEvent('openEditDialogOnOptions', { index: index });
    const remark = userRemarks[index];
    setCurrentEditRemark(remark);
    setNewRemark(remark.remark);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentEditRemark(null);
    setNewRemark('');
  };

  const handleEditRemark = () => {
    if (currentEditRemark) {
      const updatedRemarks = userRemarks.map((remark) =>
        remark.username === currentEditRemark.username
          ? { ...remark, remark: newRemark }
          : remark
      );
      setUserRemarks(updatedRemarks);
      saveRemarks(updatedRemarks);
      closeEditDialog();
    }
  };

  const openDeleteDialog = (index: number) => {
    setRemarkToDelete(index);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setRemarkToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = () => {
    if (remarkToDelete !== null) {
      Logger.logEvent('deleteRemarkOnOptions', { index: remarkToDelete });
      const updatedRemarks = userRemarks.filter((_, i) => i !== remarkToDelete);
      setUserRemarks(updatedRemarks);
      saveRemarks(updatedRemarks);

      if (
        updatedRemarks.length <= (currentPage - 1) * remarksPerPage &&
        currentPage > 1
      ) {
        setCurrentPage((prevPage) => prevPage - 1);
      }
      closeDeleteDialog();
    }
  };

  const exportRemarks = () => {
    Logger.logEvent('exportRemarksOnOptions', { remarks: userRemarks });
    const dataStr = JSON.stringify(userRemarks);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'twitter_remarks.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importRemarks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Logger.logEvent('importRemarksOnOptions', { file: file.name });
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const importedRemarks = JSON.parse(e.target?.result as string);
          if (
            Array.isArray(importedRemarks) &&
            importedRemarks.every(isValidRemark)
          ) {
            setUserRemarks(importedRemarks);
            saveRemarks(importedRemarks);
            setCurrentPage(1);
            alert(chrome.i18n.getMessage('importSuccessful'));
          } else {
            throw new Error('Invalid format');
          }
        } catch {
          alert(chrome.i18n.getMessage('importError'));
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isValidRemark = (remark: unknown): remark is UserRemark => {
    return (
      typeof remark === 'object' &&
      remark !== null &&
      'username' in remark &&
      'remark' in remark &&
      typeof (remark as UserRemark).username === 'string' &&
      typeof (remark as UserRemark).remark === 'string'
    );
  };

  const totalPages = Math.max(
    1,
    Math.ceil(userRemarks.length / remarksPerPage)
  );

  const startIndex = (currentPage - 1) * remarksPerPage;
  const endIndex = startIndex + remarksPerPage;
  const currentRemarks = userRemarks.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-twitter-bg p-6 font-sans transition-colors">
      <div className="mx-auto max-w-[800px]">
        {/* Main Card */}
        <Card className="overflow-hidden rounded-2xl border-twitter-card-border bg-twitter-card shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.4)]">
          <CardHeader className="border-b border-twitter-card-border px-6 py-5">
            <CardTitle className="text-center text-2xl font-bold text-twitter-blue">
              {chrome.i18n.getMessage('manageRemarks')}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {/* Remarks List */}
            <div className="flex flex-col gap-3">
              {currentRemarks.map((remark, index) => {
                const actualIndex = startIndex + index;
                return (
                  <div
                    key={actualIndex}
                    className="group rounded-xl border border-twitter-card-border bg-twitter-item-bg p-4 transition-colors hover:bg-twitter-item-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <UserIcon className="text-twitter-text-secondary" />
                          <a
                            href={`https://twitter.com/${remark.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[15px] font-bold text-twitter-blue hover:underline"
                          >
                            @{remark.username}
                          </a>
                        </div>
                        <p className="mt-2 text-[15px] leading-relaxed text-twitter-text">
                          {remark.remark}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(actualIndex)}
                          className="rounded-full border-twitter-input-border bg-transparent text-[13px] font-semibold text-twitter-text hover:bg-twitter-item-hover"
                        >
                          <EditIcon className="mr-1.5" />
                          {chrome.i18n.getMessage('editRemarkInOptions')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openDeleteDialog(actualIndex)}
                          className="rounded-full bg-destructive text-[13px] font-semibold text-white hover:bg-destructive/90"
                        >
                          <TrashIcon className="mr-1.5" />
                          {chrome.i18n.getMessage('deleteRemarkInOptions')}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {currentRemarks.length === 0 && (
                <div className="py-12 text-center text-[15px] text-twitter-text-secondary">
                  {chrome.i18n.getMessage('noRemarks') || 'No remarks yet'}
                </div>
              )}
            </div>

            {/* Pagination */}
            {userRemarks.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => changePage(-1)}
                  disabled={currentPage === 1}
                  className="rounded-full border-twitter-input-border bg-transparent text-sm font-semibold text-twitter-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeftIcon className="mr-1" />
                  {chrome.i18n.getMessage('previousPage')}
                </Button>

                <span className="text-sm text-twitter-text-secondary">
                  {chrome.i18n.getMessage('pageOf', [
                    currentPage.toString(),
                    totalPages.toString(),
                  ])}
                </span>

                <Button
                  variant="outline"
                  onClick={() => changePage(1)}
                  disabled={currentPage === totalPages}
                  className="rounded-full border-twitter-input-border bg-transparent text-sm font-semibold text-twitter-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {chrome.i18n.getMessage('nextPage')}
                  <ChevronRightIcon className="ml-1" />
                </Button>
              </div>
            )}

            {/* Export/Import Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <Button
                onClick={exportRemarks}
                className="rounded-full bg-twitter-success px-6 py-3 text-[15px] font-bold text-white hover:bg-twitter-success-hover"
              >
                <DownloadIcon className="mr-2" />
                {chrome.i18n.getMessage('exportRemarks')}
              </Button>
              <Button
                onClick={triggerFileInput}
                className="rounded-full bg-twitter-blue px-6 py-3 text-[15px] font-bold text-white hover:bg-twitter-blue-hover"
              >
                <UploadIcon className="mr-2" />
                {chrome.i18n.getMessage('importRemarks')}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={importRemarks}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[400px] rounded-2xl border-twitter-card-border bg-twitter-card p-0">
          <DialogHeader className="border-b border-twitter-card-border px-4 py-3">
            <DialogTitle className="text-xl font-bold text-twitter-text">
              {chrome.i18n.getMessage('editRemark')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {chrome.i18n.getMessage('editRemarkFor', [
                currentEditRemark?.username || '',
              ])}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <p className="mb-4 text-[15px] text-twitter-text-secondary">
              {chrome.i18n.getMessage('editRemarkFor', [
                currentEditRemark?.username || '',
              ])}
            </p>
            <Input
              type="text"
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              placeholder={chrome.i18n.getMessage('enterNewRemark')}
              className="rounded border-twitter-input-border bg-twitter-card text-[15px] text-twitter-text placeholder:text-twitter-text-secondary focus:border-twitter-blue focus:ring-twitter-blue"
            />
          </div>
          <DialogFooter className="border-t border-twitter-card-border px-4 py-3">
            <Button
              variant="outline"
              onClick={closeEditDialog}
              className="rounded-full border-twitter-input-border bg-transparent font-bold text-twitter-text hover:bg-twitter-item-hover"
            >
              {chrome.i18n.getMessage('cancel')}
            </Button>
            <Button
              onClick={handleEditRemark}
              className="rounded-full bg-twitter-blue font-bold text-white hover:bg-twitter-blue-hover"
            >
              {chrome.i18n.getMessage('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[400px] rounded-2xl border-twitter-card-border bg-twitter-card p-0">
          <DialogHeader className="border-b border-twitter-card-border px-4 py-3">
            <DialogTitle className="text-xl font-bold text-twitter-text">
              {chrome.i18n.getMessage('confirmDelete')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {chrome.i18n.getMessage('deleteRemarkConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-5">
            <p className="text-[15px] leading-relaxed text-twitter-text-secondary">
              {chrome.i18n.getMessage('deleteRemarkConfirm')}
            </p>
          </div>
          <DialogFooter className="border-t border-twitter-card-border px-4 py-3">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              className="rounded-full border-twitter-input-border bg-transparent font-bold text-twitter-text hover:bg-twitter-item-hover"
            >
              {chrome.i18n.getMessage('cancel')}
            </Button>
            <Button
              onClick={confirmDelete}
              className="rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              {chrome.i18n.getMessage('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Options;
