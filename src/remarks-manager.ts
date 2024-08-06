// src/remarks-manager.ts

interface UserRemark {
    username: string;
    remark: string;
}

class RemarksManager {
    private remarksList: HTMLDivElement;
    private exportRemarksButton: HTMLButtonElement;
    private importRemarksButton: HTMLButtonElement;
    private importRemarksInput: HTMLInputElement;
    private userRemarks: UserRemark[] = [];

    constructor() {
        this.remarksList = document.getElementById('remarksList') as HTMLDivElement;
        this.exportRemarksButton = document.getElementById('exportRemarks') as HTMLButtonElement;
        this.importRemarksButton = document.getElementById('importRemarksBtn') as HTMLButtonElement;
        this.importRemarksInput = document.getElementById('importRemarks') as HTMLInputElement;
        this.init();
    }

    private init(): void {
        this.loadRemarks();
        this.exportRemarksButton.addEventListener('click', () => this.exportRemarks());
        this.importRemarksButton.addEventListener('click', () => this.importRemarksInput.click());
        this.importRemarksInput.addEventListener('change', (event) => this.importRemarks(event));
    }

    private loadRemarks(): void {
        chrome.storage.sync.get(['userRemarks'], (result) => {
            this.userRemarks = result.userRemarks || [];
            this.displayRemarks();
        });
    }

    private displayRemarks(): void {
        this.remarksList.innerHTML = '';
        this.userRemarks.forEach((remark, index) => {
            const remarkElement = document.createElement('div');
            remarkElement.className = 'remark-item';
            remarkElement.innerHTML = `
                <span>@${remark.username}: ${remark.remark}</span>
                <button class="edit-remark" data-index="${index}">Edit</button>
                <button class="delete-remark" data-index="${index}">Delete</button>
            `;
            this.remarksList.appendChild(remarkElement);
        });

        this.remarksList.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('edit-remark')) {
                this.editRemark(parseInt(target.getAttribute('data-index') || '0'));
            } else if (target.classList.contains('delete-remark')) {
                this.deleteRemark(parseInt(target.getAttribute('data-index') || '0'));
            }
        });
    }

    private editRemark(index: number): void {
        const remark = this.userRemarks[index];
        const newRemark = prompt(`Edit remark for @${remark.username}:`, remark.remark);
        if (newRemark !== null) {
            this.userRemarks[index].remark = newRemark;
            this.saveRemarks();
            this.displayRemarks();
        }
    }

    private deleteRemark(index: number): void {
        if (confirm('Are you sure you want to delete this remark?')) {
            this.userRemarks.splice(index, 1);
            this.saveRemarks();
            this.displayRemarks();
        }
    }

    private saveRemarks(): void {
        chrome.storage.sync.set({ userRemarks: this.userRemarks }, () => {
            console.log('Remarks saved');
        });
    }

    private exportRemarks(): void {
        const dataStr = JSON.stringify(this.userRemarks);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'twitter_remarks.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    private importRemarks(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const importedRemarks = JSON.parse(e.target?.result as string);
                    if (Array.isArray(importedRemarks) && importedRemarks.every(this.isValidRemark)) {
                        this.userRemarks = importedRemarks;
                        this.saveRemarks();
                        this.displayRemarks();
                        alert('Remarks imported successfully!');
                    } else {
                        throw new Error('Invalid format');
                    }
                } catch (error) {
                    alert('Error importing remarks. Please make sure the file is in the correct format.');
                }
            };
            reader.readAsText(file);
        }
    }

    private isValidRemark(remark: any): remark is UserRemark {
        return typeof remark === 'object' &&
            typeof remark.username === 'string' &&
            typeof remark.remark === 'string';
    }
}

// Initialize the remarks manager
document.addEventListener('DOMContentLoaded', () => new RemarksManager());