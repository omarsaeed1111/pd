class PDFConverter {
    constructor() {
        this.files = [];
        this.currentConversion = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const convertBtn = document.getElementById('convertBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const convertAnotherBtn = document.getElementById('convertAnotherBtn');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        uploadArea.addEventListener('click', () => fileInput.click());
        convertBtn.addEventListener('click', () => this.startConversion());
        downloadBtn.addEventListener('click', () => this.downloadPDF());
        convertAnotherBtn.addEventListener('click', () => this.resetConverter());
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => e.preventDefault());
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.processFiles(files);
        });
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const validFiles = files.filter(file => this.isValidFile(file));
        
        if (validFiles.length !== files.length) {
            this.showNotification('Some files were skipped due to invalid format', 'warning');
        }

        validFiles.forEach(file => {
            if (!this.files.find(f => f.name === file.name && f.size === file.size)) {
                this.files.push(file);
            }
        });

        this.renderFileList();
        this.updateConversionSection();
    }

    isValidFile(file) {
        const validTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/bmp',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/rtf'
        ];
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        return validTypes.includes(file.type) && file.size <= maxSize;
    }

    renderFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">${this.getFileIcon(file.type)}</div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.formatFileSize(file.size)}</p>
                    </div>
                </div>
                <button class="remove-btn" onclick="pdfConverter.removeFile(${index})">×</button>
            `;
            fileList.appendChild(fileItem);
        });
    }

    getFileIcon(fileType) {
        const icons = {
            'image/jpeg': 'JPG',
            'image/png': 'PNG',
            'image/gif': 'GIF',
            'image/bmp': 'BMP',
            'application/msword': 'DOC',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
            'text/plain': 'TXT',
            'application/rtf': 'RTF'
        };
        return icons[fileType] || 'FILE';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
        this.updateConversionSection();
    }

    updateConversionSection() {
        const conversionSection = document.getElementById('conversionSection');
        const convertBtn = document.getElementById('convertBtn');
        
        if (this.files.length > 0) {
            conversionSection.style.display = 'block';
            convertBtn.disabled = false;
        } else {
            conversionSection.style.display = 'none';
            convertBtn.disabled = true;
        }
    }

    async startConversion() {
        if (this.files.length === 0) return;

        const convertBtn = document.getElementById('convertBtn');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        const formData = new FormData();
        this.files.forEach(file => formData.append('files', file));

        try {
            const response = await fetch('http://localhost:3000/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Conversion failed');
            }

            const result = await response.json();
            this.currentConversion = result;

            // Simulate progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    this.showResult();
                }
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
            }, 200);

        } catch (error) {
            this.showNotification('Conversion failed. Please try again.', 'error');
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to PDF';
        }
    }

    showResult() {
        const conversionSection = document.getElementById('conversionSection');
        const resultSection = document.getElementById('resultSection');

        conversionSection.style.display = 'none';
        resultSection.style.display = 'block';
    }

    downloadPDF() {
        if (!this.currentConversion) return;

        const link = document.createElement('a');
        link.href = `http://localhost:3000${this.currentConversion.downloadUrl}`;
        link.download = this.currentConversion.filename;
        link.click();
    }

    resetConverter() {
        this.files = [];
        this.currentConversion = null;
        
        document.getElementById('fileList').innerHTML = '';
        document.getElementById('conversionSection').style.display = 'none';
        document.getElementById('resultSection').style.display = 'none';
        document.getElementById('convertBtn').disabled = false;
        document.getElementById('convertBtn').textContent = 'Convert to PDF';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = '0%';
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pdfConverter = new PDFConverter();
});
