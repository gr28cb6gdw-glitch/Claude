/**
 * QR Code Generator Module
 * Uses QRCode.js library for generating customizable QR codes
 */

class QRGenerator {
    constructor() {
        this.currentType = 'url';
        this.qrCanvas = null;
        this.logoImage = null;

        // DOM Elements - Type buttons
        this.typeButtons = document.querySelectorAll('.type-btn');

        // DOM Elements - Input groups
        this.inputGroups = {
            url: document.getElementById('input-url'),
            text: document.getElementById('input-text'),
            email: document.getElementById('input-email'),
            phone: document.getElementById('input-phone'),
            wifi: document.getElementById('input-wifi'),
            vcard: document.getElementById('input-vcard')
        };

        // DOM Elements - Inputs
        this.inputs = {
            url: document.getElementById('url-input'),
            text: document.getElementById('text-input'),
            emailAddress: document.getElementById('email-address'),
            emailSubject: document.getElementById('email-subject'),
            emailBody: document.getElementById('email-body'),
            phone: document.getElementById('phone-input'),
            wifiSsid: document.getElementById('wifi-ssid'),
            wifiPassword: document.getElementById('wifi-password'),
            wifiEncryption: document.getElementById('wifi-encryption'),
            wifiHidden: document.getElementById('wifi-hidden'),
            vcardFirstname: document.getElementById('vcard-firstname'),
            vcardLastname: document.getElementById('vcard-lastname'),
            vcardOrg: document.getElementById('vcard-org'),
            vcardTitle: document.getElementById('vcard-title'),
            vcardPhone: document.getElementById('vcard-phone'),
            vcardEmail: document.getElementById('vcard-email'),
            vcardWebsite: document.getElementById('vcard-website'),
            vcardAddress: document.getElementById('vcard-address')
        };

        // DOM Elements - Customization
        this.fgColor = document.getElementById('fg-color');
        this.fgColorText = document.getElementById('fg-color-text');
        this.bgColor = document.getElementById('bg-color');
        this.bgColorText = document.getElementById('bg-color-text');
        this.qrSize = document.getElementById('qr-size');
        this.sizeValue = document.getElementById('size-value');
        this.errorLevel = document.getElementById('error-level');

        // DOM Elements - Logo
        this.logoUploadArea = document.getElementById('logo-upload-area');
        this.logoInput = document.getElementById('logo-input');
        this.logoPreview = document.getElementById('logo-preview');
        this.logoImageEl = document.getElementById('logo-image');
        this.removeLogo = document.getElementById('remove-logo');

        // DOM Elements - Output
        this.generateBtn = document.getElementById('generate-qr');
        this.qrOutput = document.getElementById('qr-output');
        this.qrActions = document.getElementById('qr-actions');
        this.downloadPng = document.getElementById('download-png');
        this.downloadSvg = document.getElementById('download-svg');
        this.copyQr = document.getElementById('copy-qr');

        this.init();
    }

    init() {
        // Type button events
        this.typeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchType(btn.dataset.type));
        });

        // Color picker sync
        this.fgColor.addEventListener('input', () => {
            this.fgColorText.value = this.fgColor.value;
        });
        this.fgColorText.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(this.fgColorText.value)) {
                this.fgColor.value = this.fgColorText.value;
            }
        });
        this.bgColor.addEventListener('input', () => {
            this.bgColorText.value = this.bgColor.value;
        });
        this.bgColorText.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(this.bgColorText.value)) {
                this.bgColor.value = this.bgColorText.value;
            }
        });

        // Size slider
        this.qrSize.addEventListener('input', () => {
            this.sizeValue.textContent = this.qrSize.value;
        });

        // Logo upload
        this.logoUploadArea.addEventListener('click', () => this.logoInput.click());
        this.logoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
        this.removeLogo.addEventListener('click', () => this.clearLogo());

        // Generate button
        this.generateBtn.addEventListener('click', () => this.generate());

        // Download/export buttons
        this.downloadPng.addEventListener('click', () => this.downloadAsPng());
        this.downloadSvg.addEventListener('click', () => this.downloadAsSvg());
        this.copyQr.addEventListener('click', () => this.copyToClipboard());

        // Auto-generate on input (debounced)
        this.setupAutoGenerate();
    }

    switchType(type) {
        this.currentType = type;

        // Update buttons
        this.typeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // Update input groups
        Object.entries(this.inputGroups).forEach(([key, group]) => {
            group.classList.toggle('active', key === type);
        });
    }

    setupAutoGenerate() {
        let timeout;
        const debounce = (fn, delay) => {
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn.apply(this, args), delay);
            };
        };

        // Add listeners to all inputs
        Object.values(this.inputs).forEach(input => {
            if (input) {
                const eventType = input.type === 'checkbox' ? 'change' : 'input';
                input.addEventListener(eventType, debounce(() => {
                    if (this.getContent()) {
                        this.generate();
                    }
                }, 500));
            }
        });

        // Color and size changes
        [this.fgColor, this.bgColor, this.qrSize, this.errorLevel].forEach(el => {
            el.addEventListener('change', debounce(() => {
                if (this.getContent()) {
                    this.generate();
                }
            }, 300));
        });
    }

    getContent() {
        switch (this.currentType) {
            case 'url':
                return this.inputs.url.value.trim();

            case 'text':
                return this.inputs.text.value.trim();

            case 'email':
                const email = this.inputs.emailAddress.value.trim();
                if (!email) return '';

                let mailto = `mailto:${email}`;
                const subject = this.inputs.emailSubject.value.trim();
                const body = this.inputs.emailBody.value.trim();

                const params = [];
                if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                if (body) params.push(`body=${encodeURIComponent(body)}`);

                if (params.length > 0) {
                    mailto += '?' + params.join('&');
                }
                return mailto;

            case 'phone':
                const phone = this.inputs.phone.value.trim();
                return phone ? `tel:${phone}` : '';

            case 'wifi':
                const ssid = this.inputs.wifiSsid.value.trim();
                if (!ssid) return '';

                const password = this.inputs.wifiPassword.value;
                const encryption = this.inputs.wifiEncryption.value;
                const hidden = this.inputs.wifiHidden.checked;

                // WiFi QR code format: WIFI:T:WPA;S:mynetwork;P:mypass;H:true;;
                let wifi = `WIFI:T:${encryption};S:${this.escapeWifiString(ssid)};`;
                if (encryption !== 'nopass' && password) {
                    wifi += `P:${this.escapeWifiString(password)};`;
                }
                if (hidden) {
                    wifi += 'H:true;';
                }
                wifi += ';';
                return wifi;

            case 'vcard':
                const firstName = this.inputs.vcardFirstname.value.trim();
                const lastName = this.inputs.vcardLastname.value.trim();

                if (!firstName && !lastName) return '';

                let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
                vcard += `N:${lastName};${firstName};;;\n`;
                vcard += `FN:${firstName} ${lastName}\n`;

                const org = this.inputs.vcardOrg.value.trim();
                if (org) vcard += `ORG:${org}\n`;

                const title = this.inputs.vcardTitle.value.trim();
                if (title) vcard += `TITLE:${title}\n`;

                const vcardPhone = this.inputs.vcardPhone.value.trim();
                if (vcardPhone) vcard += `TEL:${vcardPhone}\n`;

                const vcardEmail = this.inputs.vcardEmail.value.trim();
                if (vcardEmail) vcard += `EMAIL:${vcardEmail}\n`;

                const website = this.inputs.vcardWebsite.value.trim();
                if (website) vcard += `URL:${website}\n`;

                const address = this.inputs.vcardAddress.value.trim();
                if (address) vcard += `ADR:;;${address};;;;\n`;

                vcard += 'END:VCARD';
                return vcard;

            default:
                return '';
        }
    }

    escapeWifiString(str) {
        // Escape special characters in WiFi strings
        return str.replace(/[\\;,:\"]/g, '\\$&');
    }

    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            this.logoImage = new Image();
            this.logoImage.onload = () => {
                this.logoImageEl.src = event.target.result;
                this.logoPreview.classList.remove('hidden');
                this.logoUploadArea.style.display = 'none';

                // Regenerate if QR exists
                if (this.getContent()) {
                    this.generate();
                }
            };
            this.logoImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    clearLogo() {
        this.logoImage = null;
        this.logoInput.value = '';
        this.logoPreview.classList.add('hidden');
        this.logoUploadArea.style.display = 'flex';

        // Regenerate if QR exists
        if (this.getContent()) {
            this.generate();
        }
    }

    async generate() {
        const content = this.getContent();

        if (!content) {
            showToast('Please enter content for the QR code', 'error');
            return;
        }

        const size = parseInt(this.qrSize.value);
        const fgColor = this.fgColor.value;
        const bgColor = this.bgColor.value;
        const errorCorrectionLevel = this.errorLevel.value;

        try {
            // Clear previous QR code
            this.qrOutput.innerHTML = '';

            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.id = 'qr-canvas';

            // Generate QR code
            await QRCode.toCanvas(canvas, content, {
                width: size,
                margin: 2,
                color: {
                    dark: fgColor,
                    light: bgColor
                },
                errorCorrectionLevel: errorCorrectionLevel
            });

            // Add logo if present
            if (this.logoImage) {
                this.addLogoToCanvas(canvas);
            }

            this.qrCanvas = canvas;
            this.qrOutput.appendChild(canvas);
            this.qrActions.classList.remove('hidden');

            showToast('QR code generated!', 'success');

        } catch (err) {
            console.error('Error generating QR code:', err);
            showToast('Error generating QR code. Content may be too long.', 'error');
        }
    }

    addLogoToCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const canvasSize = canvas.width;

        // Logo size (20% of QR code)
        const logoSize = canvasSize * 0.2;
        const logoX = (canvasSize - logoSize) / 2;
        const logoY = (canvasSize - logoSize) / 2;

        // Draw white background for logo
        const padding = 5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            logoX - padding,
            logoY - padding,
            logoSize + padding * 2,
            logoSize + padding * 2
        );

        // Draw logo
        ctx.drawImage(this.logoImage, logoX, logoY, logoSize, logoSize);
    }

    async downloadAsPng() {
        if (!this.qrCanvas) {
            showToast('Please generate a QR code first', 'error');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.png`;
            link.href = this.qrCanvas.toDataURL('image/png');
            link.click();

            showToast('PNG downloaded!', 'success');
        } catch (err) {
            console.error('Error downloading PNG:', err);
            showToast('Error downloading image', 'error');
        }
    }

    async downloadAsSvg() {
        const content = this.getContent();

        if (!content) {
            showToast('Please generate a QR code first', 'error');
            return;
        }

        try {
            const svg = await QRCode.toString(content, {
                type: 'svg',
                width: parseInt(this.qrSize.value),
                margin: 2,
                color: {
                    dark: this.fgColor.value,
                    light: this.bgColor.value
                },
                errorCorrectionLevel: this.errorLevel.value
            });

            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.svg`;
            link.href = url;
            link.click();

            URL.revokeObjectURL(url);
            showToast('SVG downloaded!', 'success');
        } catch (err) {
            console.error('Error downloading SVG:', err);
            showToast('Error downloading SVG', 'error');
        }
    }

    async copyToClipboard() {
        if (!this.qrCanvas) {
            showToast('Please generate a QR code first', 'error');
            return;
        }

        try {
            // Convert canvas to blob
            const blob = await new Promise(resolve => {
                this.qrCanvas.toBlob(resolve, 'image/png');
            });

            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            showToast('QR code copied to clipboard!', 'success');
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            showToast('Error copying to clipboard. Try downloading instead.', 'error');
        }
    }
}

// Initialize generator when DOM is ready
let qrGenerator;
document.addEventListener('DOMContentLoaded', () => {
    qrGenerator = new QRGenerator();
});
