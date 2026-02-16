// Main Application
class ReportAnalyzer {
    constructor() {
        this.config = {
            apiUrl: 'http://localhost:3002',
            maxFileSize: 50 * 1024 * 1024, // 50MB
            supportedFormats: ['.pdf', '.docx', '.doc', '.txt', '.csv', '.xlsx', '.xls', '.png', '.jpg', '.jpeg']
        };

        this.state = {
            documents: [],
            uploadQueue: [],
            isProcessing: false,
            currentChat: [],
            serverConnected: false,
            aiConnected: true
        };

        this.init();
    }

    async init() {
        console.log('🚀 Initializing Report Analyzer...');

        // Initialize DOM elements
        this.initElements();

        // Initialize event listeners
        this.initEvents();

        // Check server connection
        await this.checkServerConnection();

        // Load existing documents
        await this.loadDocuments();

        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) loadingScreen.style.display = 'none';
            this.showToast('Report Analyzer Ready!', 'success');
        }, 1500);

        // Auto-resize textarea
        this.initTextarea();

        // Make app globally accessible
        window.app = this;
    }

    initElements() {
        this.elements = {
            // Upload elements
            fileInput: document.getElementById('fileInput'),
            uploadArea: document.getElementById('uploadArea'),
            browseBtn: document.getElementById('browseBtn'),
            processBtn: document.getElementById('processBtn'),
            uploadProgress: document.getElementById('uploadProgress'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            fileCount: document.getElementById('fileCount'),

            // Document elements
            documentsList: document.getElementById('documentsList'),
            searchDocs: document.getElementById('searchDocs'),
            totalDocs: document.getElementById('totalDocs'),
            totalSize: document.getElementById('totalSize'),
            lastUpload: document.getElementById('lastUpload'),
            footerDocCount: document.getElementById('footerDocCount'),
            docCount: document.getElementById('docCount'),

            // Chat elements
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            typingIndicator: document.getElementById('typingIndicator'),

            // Status elements
            serverStatus: document.getElementById('serverStatus'),
            serverStatusDot: document.getElementById('serverStatusDot'),
            connectionStatus: document.getElementById('connectionStatus'),
            connectionText: document.getElementById('connectionText'),
            currentTime: document.getElementById('currentTime'),
            aiStatus: document.getElementById('aiStatus'),

            // Action buttons
            clearChatBtn: document.getElementById('clearChatBtn'),
            exportBtn: document.getElementById('exportBtn'),
            suggestBtn: document.getElementById('suggestBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            attachBtn: document.getElementById('attachBtn'),

            // Modals
            processingModal: document.getElementById('processingModal'),
            documentModal: document.getElementById('documentModal'),
            processingTitle: document.getElementById('processingTitle'),
            processingMessage: document.getElementById('processingMessage'),
            documentDetails: document.getElementById('documentDetails'),
            documentModalTitle: document.getElementById('documentModalTitle')
        };
    }

    initEvents() {
        // File upload events
        this.elements.uploadArea.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.fileInput.click();
        });
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.attachBtn.addEventListener('click', () => this.elements.fileInput.click());

        // Drag and drop
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.style.borderColor = '#4285f4';
            this.elements.uploadArea.style.background = 'rgba(66, 133, 244, 0.05)';
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.style.borderColor = '';
            this.elements.uploadArea.style.background = '';
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.style.borderColor = '';
            this.elements.uploadArea.style.background = '';
            this.handleFileDrop(e);
        });

        // Process button
        this.elements.processBtn.addEventListener('click', () => this.processUploadQueue());

        // Chat events
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Action buttons
        this.elements.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.elements.exportBtn.addEventListener('click', () => this.exportChat());
        this.elements.suggestBtn.addEventListener('click', () => this.suggestQuestions());
        this.elements.refreshBtn.addEventListener('click', () => this.refreshDocuments());
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAllDocuments());

        // Document search
        this.elements.searchDocs.addEventListener('input', () => this.filterDocuments());

        // Question chips
        document.querySelectorAll('.question-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const question = e.target.dataset.question;
                this.useQuestion(question);
            });
        });

        // Prompt buttons
        document.querySelectorAll('.prompt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                this.useQuestion(prompt);
            });
        });

        // Modal background click to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Update time
        setInterval(() => this.updateTime(), 1000);
        this.updateTime();
    }

    initTextarea() {
        const textarea = this.elements.messageInput;

        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 150) + 'px';
        });
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            // document.body.style.overflow = 'hidden'; // Optional: Prevent background scrolling if desired, but can be annoying
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            // document.body.style.overflow = '';
        }
    }

    async checkServerConnection() {
        try {
            const response = await fetch(`${this.config.apiUrl}/api/health`);
            const data = await response.json();

            this.state.serverConnected = response.ok;

            if (this.state.serverConnected) {
                this.elements.serverStatus.textContent = 'Connected';
                this.elements.serverStatusDot.classList.add('online');
                this.elements.connectionText.textContent = 'Connected';
                this.elements.connectionStatus.className = 'status-badge';
                this.elements.aiStatus.textContent = data.aiAvailable ? 'AI Ready' : 'AI Offline';

                console.log('✅ Server connected:', data);
                // this.showToast('Server connected successfully', 'success');
            } else {
                throw new Error('Server not responding properly');
            }
        } catch (error) {
            console.error('❌ Server connection error:', error);
            this.state.serverConnected = false;
            this.elements.serverStatus.textContent = 'Disconnected';
            this.elements.serverStatusDot.classList.remove('online');
            this.elements.connectionText.textContent = 'Disconnected';
            this.elements.connectionStatus.style.background = 'rgba(234, 67, 53, 0.1)';
            this.elements.connectionStatus.style.color = '#ea4335';
            this.elements.aiStatus.textContent = 'AI Offline';

            this.showToast('Server connection failed. Make sure the backend server is running.', 'error');
        }
    }

    handleFileSelect(event) {
        const files = event.target.files;
        if (files.length > 0) {
            this.addFilesToQueue(Array.from(files));
        }
        // Reset file input to allow selecting same file again
        event.target.value = '';
    }

    handleFileDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        this.addFilesToQueue(files);
    }

    addFilesToQueue(files) {
        const validFiles = [];

        for (const file of files) {
            // Check file size
            if (file.size > this.config.maxFileSize) {
                this.showToast(`File "${file.name}" is too large (max 50MB)`, 'error');
                continue;
            }

            // Check file extension
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            if (!this.config.supportedFormats.includes(extension)) {
                this.showToast(`File type "${extension}" is not supported`, 'error');
                continue;
            }

            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            this.state.uploadQueue.push(...validFiles);
            this.updateUploadQueue();
            this.showToast(`${validFiles.length} file(s) added to upload queue`, 'success');
        }
    }

    updateUploadQueue() {
        const fileCount = this.state.uploadQueue.length;
        this.elements.fileCount.textContent = `${fileCount} file${fileCount !== 1 ? 's' : ''}`;
        this.elements.processBtn.disabled = fileCount === 0 || this.state.isProcessing;

        if (fileCount > 0) {
            this.elements.uploadProgress.style.display = 'block';
        } else {
            this.elements.uploadProgress.style.display = 'none';
        }
    }

    async processUploadQueue() {
        if (this.state.uploadQueue.length === 0) {
            this.showToast('No files to process', 'warning');
            return;
        }

        if (!this.state.serverConnected) {
            this.showToast('Server not connected', 'error');
            return;
        }

        this.state.isProcessing = true;
        this.elements.processBtn.disabled = true;
        this.openModal('processingModal'); // Show processing modal

        const formData = new FormData();
        this.state.uploadQueue.forEach(file => {
            formData.append('files', file);
        });

        try {
            this.updateProgressBar(30);

            const response = await fetch(`${this.config.apiUrl}/api/upload`, {
                method: 'POST',
                body: formData
            });

            this.updateProgressBar(70);

            const data = await response.json();

            if (response.ok && data.success) {
                this.updateProgressBar(100);

                // Clear upload queue
                this.state.uploadQueue = [];
                this.updateUploadQueue();

                // Reload documents
                await this.loadDocuments();

                // Show success message
                this.showToast(`${data.documents.length} document(s) uploaded successfully`, 'success');

                // Add success message to chat
                this.addAIMessage(`I've successfully processed ${data.documents.length} document(s). You can now ask questions about them!`);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast(`Upload failed: ${error.message}`, 'error');
        } finally {
            this.state.isProcessing = false;
            this.elements.processBtn.disabled = false;
            this.updateProgressBar(0);
            this.closeModal('processingModal'); // Hide processing modal

            // Hide progress bar after a delay
            setTimeout(() => {
                this.elements.uploadProgress.style.display = 'none';
            }, 2000);
        }
    }

    updateProgressBar(percent) {
        this.elements.progressFill.style.width = `${percent}%`;
        this.elements.progressText.textContent = `${percent}%`;
    }

    async loadDocuments() {
        if (!this.state.serverConnected) return;

        try {
            const response = await fetch(`${this.config.apiUrl}/api/documents`);
            const data = await response.json();

            if (response.ok && data.success) {
                this.state.documents = data.documents;
                this.renderDocuments();
                this.updateStats();
                console.log(`📁 Loaded ${data.count} documents`);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }

    renderDocuments() {
        const container = this.elements.documentsList;
        const searchTerm = this.elements.searchDocs.value.toLowerCase();

        if (this.state.documents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>No documents uploaded</p>
                    <small>Upload files to get started</small>
                </div>
            `;
            return;
        }

        const filteredDocs = this.state.documents.filter(doc =>
            doc.filename.toLowerCase().includes(searchTerm)
        );

        if (filteredDocs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No matching documents</p>
                    <small>Try a different search term</small>
                </div>
            `;
            return;
        }

        let html = '';
        filteredDocs.forEach((doc, index) => {
            const size = this.formatFileSize(doc.size);
            const date = new Date(doc.uploaded).toLocaleDateString();
            const icon = this.getFileIcon(doc.filename);

            html += `
                <div class="document-item" data-index="${index}">
                    <i class="fas ${icon} doc-icon"></i>
                    <div class="doc-details">
                        <div class="doc-name">${doc.filename}</div>
                        <div class="doc-meta">${size} • ${date}</div>
                    </div>
                    <div class="doc-actions">
                        <button class="doc-action-btn" onclick="app.viewDocument('${doc.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="doc-action-btn" onclick="app.deleteDocument('${doc.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    filterDocuments() {
        this.renderDocuments();
    }

    updateStats() {
        const totalDocs = this.state.documents.length;
        const totalSize = this.state.documents.reduce((sum, doc) => sum + doc.size, 0);
        const lastUpload = this.state.documents.length > 0 ?
            new Date(this.state.documents[this.state.documents.length - 1].uploaded).toLocaleDateString() :
            '-';

        this.elements.totalDocs.textContent = totalDocs;
        this.elements.totalSize.textContent = this.formatFileSize(totalSize);
        this.elements.lastUpload.textContent = lastUpload;
        this.elements.footerDocCount.textContent = totalDocs;
        this.elements.docCount.textContent = `${totalDocs} Docs`;
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();

        if (!message) {
            this.showToast('Please enter a message', 'warning');
            return;
        }

        if (this.state.documents.length === 0) {
            this.showToast('Please upload documents first to ask questions', 'warning');
            return;
        }

        // Add user message
        this.addUserMessage(message);

        // Clear input
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';

        // Show typing indicator
        this.showTyping();

        try {
            const response = await fetch(`${this.config.apiUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message
                })
            });

            const data = await response.json();

            if (data.success) {
                // Add AI response
                this.addAIMessage(data.response);
            } else {
                throw new Error(data.error || 'Chat failed');
            }

        } catch (error) {
            console.error('Chat error:', error);
            this.addAIMessage(`Sorry, I encountered an error: ${error.message}. Please try again.`);
        } finally {
            this.hideTyping();
        }
    }

    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'assistant-message user-message';
        messageDiv.innerHTML = `
            <div class="message-avatar user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content user-content">
                <div class="message-text">${this.escapeHtml(message)}</div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;

        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Add to chat history
        this.state.currentChat.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });
    }

    addAIMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'assistant-message';

        // Simple formatting
        let formattedMessage = message;

        // Apply markdown if marked.js is available
        if (typeof marked !== 'undefined') {
            formattedMessage = marked.parse(message);
        } else {
            formattedMessage = this.simpleFormatting(message);
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${formattedMessage}</div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;

        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Add to chat history
        this.state.currentChat.push({
            role: 'assistant',
            content: message,
            timestamp: new Date().toISOString()
        });
    }

    simpleFormatting(text) {
        // Replace **bold** with <strong>bold</strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Replace *italic* with <em>italic</em>
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Replace bullet points with list items
        text = text.replace(/^•\s+(.*)/gm, '<li>$1</li>');
        text = text.replace(/^\d+\.\s+(.*)/gm, '<li>$1</li>');
        // Add line breaks
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    showTyping() {
        this.elements.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTyping() {
        this.elements.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    async viewDocument(id) {
        const doc = this.state.documents.find(d => d.id === id);

        if (!doc) {
            this.showToast('Document not found', 'error');
            return;
        }

        // Update Modal Title
        this.elements.documentModalTitle.textContent = doc.filename;

        let details = `
            <div class="document-info">
                <p><strong>Size:</strong> ${this.formatFileSize(doc.size)}</p>
                <p><strong>Uploaded:</strong> ${new Date(doc.uploaded).toLocaleString()}</p>
                <p><strong>Type:</strong> ${doc.type}</p>
                <p><strong>Word Count:</strong> ${doc.wordCount || 'N/A'}</p>
                
                ${doc.analysis?.summary ? `
                    <div class="info-section">
                        <h4>AI Summary</h4>
                        <p>${this.escapeHtml(doc.analysis.summary)}</p>
                    </div>
                ` : ''}
                
                ${doc.analysis?.key_topics && doc.analysis.key_topics.length > 0 ? `
                    <div class="info-section">
                        <h4>Key Topics</h4>
                        <p>${doc.analysis.key_topics.join(', ')}</p>
                    </div>
                ` : ''}
                
                ${doc.analysis?.important_findings && doc.analysis.important_findings.length > 0 ? `
                    <div class="info-section">
                        <h4>Important Findings</h4>
                        <ul>
                            ${doc.analysis.important_findings.map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${doc.analysis?.recommendations && doc.analysis.recommendations.length > 0 ? `
                    <div class="info-section">
                        <h4>Recommendations</h4>
                        <ul>
                            ${doc.analysis.recommendations.map(r => `<li>${this.escapeHtml(r)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${doc.path ? `
                    <div class="info-section">
                        <h4>File Location</h4>
                        <p><a href="${this.config.apiUrl}${doc.path}" target="_blank" class="file-link">
                            <i class="fas fa-external-link-alt"></i> View/Download Original File
                        </a></p>
                    </div>
                ` : ''}
            </div>
        `;

        this.elements.documentDetails.innerHTML = details;
        this.openModal('documentModal');
    }

    async deleteDocument(id) {
        const doc = this.state.documents.find(d => d.id === id);

        if (!doc) {
            this.showToast('Document not found', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.config.apiUrl}/api/documents/${doc.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Remove from state
                const index = this.state.documents.findIndex(d => d.id === id);
                if (index !== -1) {
                    this.state.documents.splice(index, 1);
                }

                // Update UI
                this.renderDocuments();
                this.updateStats();

                this.showToast('Document deleted successfully', 'success');
            } else {
                throw new Error(data.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast(`Delete failed: ${error.message}`, 'error');
        }
    }

    clearChat() {
        if (this.state.currentChat.length === 0) {
            this.showToast('Chat is already empty', 'info');
            return;
        }

        if (confirm('Clear all chat messages?')) {
            // Keep welcome message
            const welcomeMessage = this.elements.chatMessages.querySelector('.welcome-message');
            this.elements.chatMessages.innerHTML = '';

            if (welcomeMessage) {
                this.elements.chatMessages.appendChild(welcomeMessage);
            }

            this.state.currentChat = [];
            this.showToast('Chat cleared', 'success');
        }
    }

    async refreshDocuments() {
        await this.loadDocuments();
        this.showToast('Documents refreshed', 'success');
    }

    async clearAllDocuments() {
        if (this.state.documents.length === 0) {
            this.showToast('No documents to clear', 'info');
            return;
        }

        if (!confirm(`Delete all ${this.state.documents.length} documents? This cannot be undone.`)) {
            return;
        }

        try {
            this.openModal('processingModal');

            // Delete all documents one by one
            for (const doc of this.state.documents) {
                try {
                    await fetch(`${this.config.apiUrl}/api/documents/${doc.serverFilename || doc.id}`, {
                        method: 'DELETE'
                    });
                } catch (error) {
                    console.error(`Error deleting ${doc.filename}:`, error);
                }
            }

            // Clear state
            this.state.documents = [];

            // Update UI
            this.renderDocuments();
            this.updateStats();

            this.closeModal('processingModal');
            this.showToast('All documents deleted', 'success');
        } catch (error) {
            console.error('Clear all error:', error);
            this.closeModal('processingModal');
            this.showToast('Failed to delete all documents', 'error');
        }
    }

    exportChat() {
        if (this.state.currentChat.length === 0) {
            this.showToast('No chat history to export', 'warning');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            documents: this.state.documents.map(doc => ({
                filename: doc.filename,
                uploaded: doc.uploaded,
                summary: doc.analysis?.summary
            })),
            chatHistory: this.state.currentChat,
            stats: {
                totalDocuments: this.state.documents.length,
                totalChatMessages: this.state.currentChat.length
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileName = `chat-export-${new Date().toISOString().split('T')[0]}.json`;

        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', exportFileName);
        link.click();

        this.showToast('Chat exported successfully', 'success');
    }

    suggestQuestions() {
        const questions = [
            "Summarize all uploaded documents",
            "Find financial information in the documents",
            "What are the key findings across all documents?",
            "Compare the different documents",
            "Extract important dates and deadlines",
            "Find statistics and data points",
            "What recommendations are mentioned?",
            "Show me budget allocations",
            "Find information about marketing strategies",
            "What are the growth projections?"
        ];

        const randomQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, 5);

        let message = "Here are some questions you might want to ask:<br><br>";
        randomQuestions.forEach((q, i) => {
            message += `${i + 1}. <strong>"${q}"</strong><br>`;
        });

        message += "<br>Click on any question to use it!";

        this.addAIMessage(message);
    }

    useQuestion(question) {
        this.elements.messageInput.value = question;
        this.elements.messageInput.focus();
        // Auto-resize
        this.elements.messageInput.style.height = 'auto';
        this.elements.messageInput.style.height = Math.min(this.elements.messageInput.scrollHeight, 150) + 'px';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="document.getElementById('${toastId}').remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.style.opacity = '0';
                setTimeout(() => toastElement.remove(), 300);
            }
        }, 5000);
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.elements.currentTime.textContent = timeString;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'pdf': 'fa-file-pdf',
            'docx': 'fa-file-word',
            'doc': 'fa-file-word',
            'txt': 'fa-file-alt',
            'csv': 'fa-file-csv',
            'xlsx': 'fa-file-excel',
            'xls': 'fa-file-excel',
            'png': 'fa-file-image',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image'
        };
        return icons[ext] || 'fa-file';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ReportAnalyzer();
});