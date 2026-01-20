/**
 * QR Code Scanner Module
 * Uses html5-qrcode library for camera-based scanning and image file scanning
 */

class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.cameras = [];
        this.currentCameraIndex = 0;
        this.lastScanResult = null;

        // DOM Elements
        this.scannerVideo = document.getElementById('scanner-video');
        this.startBtn = document.getElementById('start-scanner');
        this.stopBtn = document.getElementById('stop-scanner');
        this.switchCameraBtn = document.getElementById('switch-camera');
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.scanResult = document.getElementById('scan-result');
        this.resultType = document.getElementById('result-type');
        this.resultText = document.getElementById('result-text');
        this.copyResultBtn = document.getElementById('copy-result');
        this.openLinkBtn = document.getElementById('open-link');
        this.saveToHistoryBtn = document.getElementById('save-to-history');

        this.init();
    }

    init() {
        // Initialize html5-qrcode
        this.html5QrCode = new Html5Qrcode('scanner-video');

        // Bind event listeners
        this.startBtn.addEventListener('click', () => this.startScanning());
        this.stopBtn.addEventListener('click', () => this.stopScanning());
        this.switchCameraBtn.addEventListener('click', () => this.switchCamera());

        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Result action events
        this.copyResultBtn.addEventListener('click', () => this.copyResult());
        this.openLinkBtn.addEventListener('click', () => this.openLink());
        this.saveToHistoryBtn.addEventListener('click', () => this.saveToHistory());

        // Get available cameras
        this.getCameras();
    }

    async getCameras() {
        try {
            const devices = await Html5Qrcode.getCameras();
            this.cameras = devices;

            if (devices.length > 1) {
                this.switchCameraBtn.style.display = 'inline-flex';
            }
        } catch (err) {
            console.log('Error getting cameras:', err);
        }
    }

    async startScanning() {
        if (this.isScanning) return;

        try {
            // Hide placeholder
            const placeholder = this.scannerVideo.querySelector('.scanner-placeholder');
            if (placeholder) placeholder.style.display = 'none';

            // Show overlay
            const overlay = this.scannerVideo.querySelector('.scanner-overlay');
            if (overlay) overlay.classList.add('active');

            // Configuration
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.333,
                showTorchButtonIfSupported: true
            };

            // Try to use back camera first on mobile
            let cameraId;
            if (this.cameras.length > 0) {
                // Find back camera
                const backCamera = this.cameras.find(
                    camera => camera.label.toLowerCase().includes('back') ||
                              camera.label.toLowerCase().includes('rear')
                );
                cameraId = backCamera ? backCamera.id : this.cameras[this.currentCameraIndex].id;
            } else {
                cameraId = { facingMode: 'environment' };
            }

            await this.html5QrCode.start(
                cameraId,
                config,
                (decodedText, decodedResult) => this.onScanSuccess(decodedText, decodedResult),
                (errorMessage) => this.onScanFailure(errorMessage)
            );

            this.isScanning = true;
            this.updateButtons();

        } catch (err) {
            console.error('Error starting scanner:', err);
            this.showPlaceholder();
            showToast('Failed to start camera. Please check permissions.', 'error');
        }
    }

    async stopScanning() {
        if (!this.isScanning) return;

        try {
            await this.html5QrCode.stop();
            this.isScanning = false;
            this.updateButtons();
            this.showPlaceholder();

            // Hide overlay
            const overlay = this.scannerVideo.querySelector('.scanner-overlay');
            if (overlay) overlay.classList.remove('active');

        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    }

    async switchCamera() {
        if (this.cameras.length < 2) return;

        this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;

        if (this.isScanning) {
            await this.stopScanning();
            await this.startScanning();
        }

        showToast(`Switched to: ${this.cameras[this.currentCameraIndex].label || 'Camera ' + (this.currentCameraIndex + 1)}`);
    }

    showPlaceholder() {
        const placeholder = this.scannerVideo.querySelector('.scanner-placeholder');
        if (placeholder) placeholder.style.display = 'flex';
    }

    updateButtons() {
        this.startBtn.disabled = this.isScanning;
        this.stopBtn.disabled = !this.isScanning;
        this.switchCameraBtn.disabled = !this.isScanning || this.cameras.length < 2;
    }

    onScanSuccess(decodedText, decodedResult) {
        // Avoid duplicate scans
        if (this.lastScanResult === decodedText) return;
        this.lastScanResult = decodedText;

        // Play success sound (optional)
        this.playBeep();

        // Vibrate on mobile (if supported)
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Display result
        this.displayResult(decodedText);

        // Auto-stop scanning after successful scan
        setTimeout(() => {
            this.stopScanning();
        }, 500);
    }

    onScanFailure(errorMessage) {
        // Silent failure - just continue scanning
    }

    displayResult(text) {
        const type = this.detectType(text);

        // Update type badge
        this.resultType.innerHTML = `<span class="type-badge">${type.label}</span>`;

        // Update result text
        this.resultText.textContent = text;

        // Show/hide open link button
        if (type.type === 'url') {
            this.openLinkBtn.classList.remove('hidden');
        } else {
            this.openLinkBtn.classList.add('hidden');
        }

        // Show result section
        this.scanResult.classList.remove('hidden');

        // Scroll to result
        this.scanResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        showToast('QR Code scanned successfully!', 'success');
    }

    detectType(text) {
        // URL detection
        if (/^https?:\/\//i.test(text) || /^www\./i.test(text)) {
            return { type: 'url', label: 'URL' };
        }

        // Email detection
        if (/^mailto:/i.test(text) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            return { type: 'email', label: 'Email' };
        }

        // Phone detection
        if (/^tel:/i.test(text) || /^(\+)?[\d\s\-()]{10,}$/.test(text)) {
            return { type: 'phone', label: 'Phone' };
        }

        // WiFi detection
        if (/^WIFI:/i.test(text)) {
            return { type: 'wifi', label: 'WiFi' };
        }

        // vCard detection
        if (/^BEGIN:VCARD/i.test(text)) {
            return { type: 'vcard', label: 'vCard' };
        }

        // SMS detection
        if (/^sms:/i.test(text) || /^smsto:/i.test(text)) {
            return { type: 'sms', label: 'SMS' };
        }

        // Geo location
        if (/^geo:/i.test(text)) {
            return { type: 'geo', label: 'Location' };
        }

        // Default to text
        return { type: 'text', label: 'Text' };
    }

    // File upload handling
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.scanImageFile(files[0]);
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.scanImageFile(file);
        }
        // Reset input
        e.target.value = '';
    }

    async scanImageFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file', 'error');
            return;
        }

        try {
            showToast('Scanning image...', 'info');

            const result = await this.html5QrCode.scanFile(file, true);
            this.displayResult(result);

        } catch (err) {
            console.error('Error scanning image:', err);
            showToast('No QR code found in image', 'error');
        }
    }

    // Result actions
    async copyResult() {
        const text = this.resultText.textContent;

        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Copied to clipboard!', 'success');
        }
    }

    openLink() {
        let url = this.resultText.textContent;

        // Add protocol if missing
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        window.open(url, '_blank', 'noopener,noreferrer');
    }

    saveToHistory() {
        const text = this.resultText.textContent;
        const type = this.detectType(text);

        // Use the history module to save
        if (window.qrHistory) {
            window.qrHistory.addItem(text, type.type, type.label);
            showToast('Saved to history!', 'success');
        }
    }

    playBeep() {
        // Create a short beep sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            setTimeout(() => oscillator.stop(), 100);
        } catch (err) {
            // Audio not supported - fail silently
        }
    }
}

// Initialize scanner when DOM is ready
let qrScanner;
document.addEventListener('DOMContentLoaded', () => {
    qrScanner = new QRScanner();
});
