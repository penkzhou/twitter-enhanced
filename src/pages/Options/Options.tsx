import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Trash2, Edit2, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import { Logger } from '../../utils/logger';

interface UserRemark {
  username: string;
  remark: string;
}

interface OptionsProps {
  title: string;
}

const Options: React.FC<OptionsProps> = ({ title }) => {
  const [userRemarks, setUserRemarks] = useState<UserRemark[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditRemark, setCurrentEditRemark] = useState<UserRemark | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const remarksPerPage = 10;

  useEffect(() => {
    loadRemarks();
    // Fire the page_load event when the component mounts
    Logger.logPageView("Remark Management", "options", { page: "remark_management" });
  }, []);

  const loadRemarks = () => {
    chrome.storage.sync.get(['userRemarks'], (result) => {
      setUserRemarks(result.userRemarks || []);
    });
  };

  const saveRemarks = (remarks: UserRemark[]) => {
    chrome.storage.sync.set({ userRemarks: remarks }, () => {
      console.log('Remarks saved');
    });
  };

  const displayRemarks = () => {
    const startIndex = (currentPage - 1) * remarksPerPage;
    const endIndex = startIndex + remarksPerPage;
    return userRemarks.slice(startIndex, endIndex).map((remark, index) => (
      <Card key={startIndex + index} className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-500 font-bold">@{remark.username}</p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{remark.remark}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(startIndex + index)}>
                <Edit2 className="w-4 h-4 mr-2" />
                {chrome.i18n.getMessage('editRemarkInOptions')}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteRemark(startIndex + index)}>
                <Trash2 className="w-4 h-4 mr-2" />
                {chrome.i18n.getMessage('deleteRemarkInOptions')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const changePage = (delta: number) => {
    setCurrentPage(prevPage => prevPage + delta);
  };

  const openEditDialog = (index: number) => {
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
      const updatedRemarks = userRemarks.map(remark =>
        remark.username === currentEditRemark.username ? { ...remark, remark: newRemark } : remark
      );
      setUserRemarks(updatedRemarks);
      saveRemarks(updatedRemarks);
      closeEditDialog();
    }
  };

  const deleteRemark = (index: number) => {
    if (window.confirm(chrome.i18n.getMessage('deleteRemarkConfirm'))) {
      const updatedRemarks = userRemarks.filter((_, i) => i !== index);
      setUserRemarks(updatedRemarks);
      saveRemarks(updatedRemarks);
      if (updatedRemarks.length <= (currentPage - 1) * remarksPerPage && currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1);
      }
    }
  };

  const exportRemarks = () => {
    const dataStr = JSON.stringify(userRemarks);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'twitter_remarks.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importRemarks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const importedRemarks = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedRemarks) && importedRemarks.every(isValidRemark)) {
            setUserRemarks(importedRemarks);
            saveRemarks(importedRemarks);
            setCurrentPage(1);
            alert(chrome.i18n.getMessage('importSuccessful'));
          } else {
            throw new Error('Invalid format');
          }
        } catch (error) {
          alert(chrome.i18n.getMessage('importError'));
        }
      };
      reader.readAsText(file);
    }
  };

  const isValidRemark = (remark: any): remark is UserRemark => {
    return typeof remark === 'object' &&
      typeof remark.username === 'string' &&
      typeof remark.remark === 'string';
  };

  const totalPages = Math.ceil(userRemarks.length / remarksPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-500">{chrome.i18n.getMessage('manageRemarks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayRemarks()}
          </div>
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => changePage(-1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {chrome.i18n.getMessage('previousPage')}
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="flex justify-center space-x-4 mt-8">
            <Button onClick={exportRemarks} className="bg-green-500 hover:bg-green-600">
              <Download className="w-4 h-4 mr-2" />
              {chrome.i18n.getMessage('exportRemarks')}
            </Button>
            <label htmlFor="importRemarks" className="cursor-pointer">
              <span className="inline-block">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Upload className="w-4 h-4 mr-2" />
                  {chrome.i18n.getMessage('importRemarks')}
                </Button>
              </span>
            </label>
            <input
              type="file"
              id="importRemarks"
              accept=".json"
              className="hidden"
              onChange={importRemarks}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{chrome.i18n.getMessage('editRemark')}</DialogTitle>
            <DialogDescription>
              {chrome.i18n.getMessage('editRemarkFor', [currentEditRemark?.username || ''])}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            placeholder={chrome.i18n.getMessage('enterNewRemark')}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              {chrome.i18n.getMessage('cancel')}
            </Button>
            <Button onClick={handleEditRemark}>
              {chrome.i18n.getMessage('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Options;