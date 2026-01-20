/**
 * QR Code Pro - Main Application
 * Handles tab navigation, toast notifications, and global utilities
 */

// Tab Navigation
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        // Update buttons
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update content
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });

        // Stop scanner when switching away from scanner tab
        if (tabId !== 'scanner' && window.qrScanner && window.qrScanner.isScanning) {
            window.qrScanner.stopScanning();
        }
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Expose switchTab globally for history module
    window.switchTab = switchTab;
}

// Toast Notification System
let toastTimeout;

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Clear existing timeout
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    // Update toast
    toastMessage.textContent = message;
    toast.className = 'toast';

    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'error') {
        toast.classList.add('error');
    }

    // Show toast
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Hide after 3 seconds
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make showToast available globally
window.showToast = showToast;

// Keyboard Shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in input fields
        if (e.target.matches('input, textarea, select')) return;

        // Alt + 1: Scanner tab
        if (e.altKey && e.key === '1') {
            e.preventDefault();
            window.switchTab('scanner');
        }

        // Alt + 2: Generator tab
        if (e.altKey && e.key === '2') {
            e.preventDefault();
            window.switchTab('generator');
        }

        // Alt + 3: History tab
        if (e.altKey && e.key === '3') {
            e.preventDefault();
            window.switchTab('history');
        }

        // Escape: Stop scanner
        if (e.key === 'Escape' && window.qrScanner && window.qrScanner.isScanning) {
            window.qrScanner.stopScanning();
        }
    });
}

// Service Worker Registration (for PWA support)
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                // Check if service worker file exists before registering
                const response = await fetch('/sw.js', { method: 'HEAD' });
                if (response.ok) {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('ServiceWorker registered:', registration.scope);
                }
            } catch (err) {
                // Service worker not available - fail silently
                console.log('ServiceWorker not available');
            }
        });
    }
}

// Check Camera Permissions
async function checkCameraPermission() {
    try {
        const result = await navigator.permissions.query({ name: 'camera' });

        if (result.state === 'denied') {
            showToast('Camera permission denied. Please enable it in your browser settings.', 'error');
        }

        result.addEventListener('change', () => {
            if (result.state === 'denied') {
                showToast('Camera permission revoked.', 'error');
                if (window.qrScanner && window.qrScanner.isScanning) {
                    window.qrScanner.stopScanning();
                }
            }
        });
    } catch (err) {
        // Permissions API not supported
        console.log('Permissions API not supported');
    }
}

// Prevent Zoom on Double Tap (Mobile)
function preventDoubleZoom() {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// Handle visibility change (pause scanner when tab is hidden)
function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.qrScanner && window.qrScanner.isScanning) {
            window.qrScanner.stopScanning();
            showToast('Scanner paused (tab hidden)');
        }
    });
}

// Initialize clipboard API polyfill for older browsers
function initClipboardPolyfill() {
    if (!navigator.clipboard) {
        navigator.clipboard = {
            writeText: async (text) => {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();

                try {
                    document.execCommand('copy');
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        };
    }
}

// Detect if running as PWA
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

// Update UI based on PWA status
function updatePWAUI() {
    if (isPWA()) {
        document.body.classList.add('is-pwa');
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initKeyboardShortcuts();
    initClipboardPolyfill();
    checkCameraPermission();
    preventDoubleZoom();
    handleVisibilityChange();
    updatePWAUI();
    initServiceWorker();

    console.log('QR Code Pro initialized');
});

// Handle online/offline status
window.addEventListener('online', () => {
    showToast('You are back online!', 'success');
});

window.addEventListener('offline', () => {
    showToast('You are offline. Some features may be limited.', 'error');
});
