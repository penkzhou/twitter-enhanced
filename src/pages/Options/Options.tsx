import React, { useState, useEffect } from 'react';
import './Options.css';

interface UserRemark {
  username: string;
  remark: string;
}

const Options: React.FC = () => {
  const [userRemarks, setUserRemarks] = useState<UserRemark[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const remarksPerPage = 10;

  useEffect(() => {
    loadRemarks();
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
      <div key={startIndex + index} className="remark-item">
        <div className="remark-content">
          <div className="remark-text">
            <span className="username">@{remark.username}</span>
            <p className="remark">{remark.remark}</p>
          </div>
        </div>
        <div className="remark-actions">
          <button onClick={() => editRemark(startIndex + index)}>{chrome.i18n.getMessage('editRemarkInOptions')}</button>
          <button onClick={() => deleteRemark(startIndex + index)}>{chrome.i18n.getMessage('deleteRemarkInOptions')}</button>
        </div>
      </div>
    ));
  };

  const changePage = (delta: number) => {
    setCurrentPage(prevPage => prevPage + delta);
  };

  const editRemark = (index: number) => {
    const remark = userRemarks[index];
    const newRemark = prompt(chrome.i18n.getMessage('editRemarkPrompt', remark.username), remark.remark);
    if (newRemark !== null) {
      const updatedRemarks = [...userRemarks];
      updatedRemarks[index].remark = newRemark;
      setUserRemarks(updatedRemarks);
      saveRemarks(updatedRemarks);
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
    <div className="container">
      <h1>{chrome.i18n.getMessage('manageRemarks')}</h1>
      <div id="remarksList">{displayRemarks()}</div>
      <div className="pagination">
        <button onClick={() => changePage(-1)} disabled={currentPage === 1}>{chrome.i18n.getMessage('previousPage')}</button>
        <span>{chrome.i18n.getMessage('pageOf', [currentPage.toString(), totalPages.toString()])}</span>
        <button onClick={() => changePage(1)} disabled={currentPage === totalPages}>{chrome.i18n.getMessage('nextPage')}</button>
      </div>
      <button onClick={exportRemarks} id="exportRemarks">{chrome.i18n.getMessage('exportRemarks')}</button>
      <input
        type="file"
        id="importRemarks"
        accept=".json"
        style={{ display: 'none' }}
        onChange={importRemarks}
      />
      <button id="importRemarksBtn" onClick={() => document.getElementById('importRemarks')?.click()}>
        {chrome.i18n.getMessage('importRemarks')}
      </button>
    </div>
  );
};

export default Options;