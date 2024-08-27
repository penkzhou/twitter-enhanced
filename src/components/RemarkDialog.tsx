import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

export interface RemarkDialogProps {
    onSave: (username: string, remark: string) => void;
    onCancel: () => void;
    username: string;
    existingRemark?: string;
    isOpen: boolean;
}

const RemarkDialog: React.FC<RemarkDialogProps> = ({ onSave, onCancel, username, existingRemark, isOpen }) => {
    const [remark, setRemark] = useState(existingRemark || '');

    useEffect(() => {
        if (isOpen) {
            setRemark(existingRemark || '');
        }
    }, [isOpen, existingRemark]);

    const handleSave = useCallback(() => {
        onSave(username, remark.trim());
    }, [onSave, username, remark]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    }, [handleSave, onCancel]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {existingRemark ? chrome.i18n.getMessage('editRemark') : chrome.i18n.getMessage('addRemark')}
                    </h2>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-6"
                        placeholder={chrome.i18n.getMessage('enterRemark')}
                        value={remark}
                        onChange={e => setRemark(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <div className="flex justify-end space-x-3">
                        <button
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
                            onClick={onCancel}
                        >
                            {chrome.i18n.getMessage('cancel')}
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                            onClick={handleSave}
                        >
                            {chrome.i18n.getMessage('save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RemarkDialog;