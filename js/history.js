/**
 * QR Code History Module
 * Manages scan history with localStorage persistence
 */

class QRHistory {
    constructor() {
        this.storageKey = 'qr-scan-history';
        this.maxItems = 50;

        // DOM Elements
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history');

        this.init();
    }

    init() {
        // Load and render history
        this.render();

        // Clear history button
        this.clearHistoryBtn.addEventListener('click', () => this.clearAll());
    }

    getItems() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (err) {
            console.error('Error loading history:', err);
            return [];
        }
    }

    saveItems(items) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(items));
        } catch (err) {
            console.error('Error saving history:', err);
        }
    }

    addItem(content, type, label) {
        const items = this.getItems();

        // Check for duplicates
        const existingIndex = items.findIndex(item => item.content === content);
        if (existingIndex !== -1) {
            // Move to top and update timestamp
            const existing = items.splice(existingIndex, 1)[0];
            existing.timestamp = Date.now();
            items.unshift(existing);
        } else {
            // Add new item
            items.unshift({
                id: this.generateId(),
                content,
                type,
                label,
                timestamp: Date.now()
            });
        }

        // Limit history size
        if (items.length > this.maxItems) {
            items.pop();
        }

        this.saveItems(items);
        this.render();
    }

    removeItem(id) {
        const items = this.getItems().filter(item => item.id !== id);
        this.saveItems(items);
        this.render();
        showToast('Item removed from history');
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all history?')) {
            this.saveItems([]);
            this.render();
            showToast('History cleared');
        }
    }

    generateId() {
        return 'hist_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins} minute${mins > 1 ? 's' : ''} ago`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }

        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }

        // Format as date
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    getTypeIcon(type) {
        const icons = {
            url: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>`,
            email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>`,
            phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>`,
            wifi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                     <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                     <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                     <line x1="12" y1="20" x2="12.01" y2="20"></line>
                   </svg>`,
            vcard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>`,
            sms: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>`,
            geo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>`,
            text: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                     <polyline points="14 2 14 8 20 8"></polyline>
                     <line x1="16" y1="13" x2="8" y2="13"></line>
                     <line x1="16" y1="17" x2="8" y2="17"></line>
                   </svg>`
        };
        return icons[type] || icons.text;
    }

    truncateText(text, maxLength = 60) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    render() {
        const items = this.getItems();

        if (items.length === 0) {
            this.historyList.innerHTML = `
                <div class="history-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <p>No scan history yet</p>
                    <small>Scanned QR codes will appear here</small>
                </div>
            `;
            return;
        }

        this.historyList.innerHTML = items.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-icon">
                    ${this.getTypeIcon(item.type)}
                </div>
                <div class="history-content">
                    <div class="history-type">${item.label}</div>
                    <div class="history-text" title="${this.escapeHtml(item.content)}">${this.escapeHtml(this.truncateText(item.content))}</div>
                    <div class="history-date">${this.formatDate(item.timestamp)}</div>
                </div>
                <div class="history-actions">
                    <button class="btn-icon copy-btn" title="Copy" data-content="${this.escapeHtml(item.content)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete-btn" title="Delete" data-id="${item.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Bind action events
        this.historyList.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyContent(btn.dataset.content);
            });
        });

        this.historyList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeItem(btn.dataset.id);
            });
        });

        // Click on item to view details
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const data = items.find(i => i.id === item.dataset.id);
                if (data) {
                    this.showItemDetail(data);
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async copyContent(content) {
        try {
            await navigator.clipboard.writeText(content);
            showToast('Copied to clipboard!', 'success');
        } catch (err) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = content;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Copied to clipboard!', 'success');
        }
    }

    showItemDetail(item) {
        // Switch to scanner tab and display result
        if (window.switchTab) {
            window.switchTab('scanner');
        }

        // Display the result
        const scanResult = document.getElementById('scan-result');
        const resultType = document.getElementById('result-type');
        const resultText = document.getElementById('result-text');
        const openLinkBtn = document.getElementById('open-link');

        resultType.innerHTML = `<span class="type-badge">${item.label}</span>`;
        resultText.textContent = item.content;

        if (item.type === 'url') {
            openLinkBtn.classList.remove('hidden');
        } else {
            openLinkBtn.classList.add('hidden');
        }

        scanResult.classList.remove('hidden');
        scanResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Initialize history when DOM is ready
let qrHistory;
document.addEventListener('DOMContentLoaded', () => {
    qrHistory = new QRHistory();
    window.qrHistory = qrHistory;
});
