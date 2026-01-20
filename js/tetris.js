/**
 * Tetris Game Module
 * A complete Tetris implementation with modern features
 */

class TetrisGame {
    constructor() {
        // Game constants
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;
        this.PREVIEW_BLOCK_SIZE = 20;

        // Tetromino shapes and colors
        this.SHAPES = {
            I: { shape: [[1, 1, 1, 1]], color: '#00f5ff' },
            O: { shape: [[1, 1], [1, 1]], color: '#ffeb3b' },
            T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#9c27b0' },
            S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#4caf50' },
            Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#f44336' },
            J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#2196f3' },
            L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#ff9800' }
        };

        this.SHAPE_NAMES = Object.keys(this.SHAPES);

        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPieces = [];
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.started = false;
        this.dropInterval = null;
        this.lastDropTime = 0;

        // Scoring
        this.POINTS = {
            SINGLE: 100,
            DOUBLE: 300,
            TRIPLE: 500,
            TETRIS: 800,
            SOFT_DROP: 1,
            HARD_DROP: 2
        };

        // DOM Elements
        this.canvas = document.getElementById('tetris-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas ? this.nextCanvas.getContext('2d') : null;
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas ? this.holdCanvas.getContext('2d') : null;

        this.scoreEl = document.getElementById('tetris-score');
        this.levelEl = document.getElementById('tetris-level');
        this.linesEl = document.getElementById('tetris-lines');
        this.overlay = document.getElementById('tetris-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMessage = document.getElementById('overlay-message');

        this.startBtn = document.getElementById('tetris-start');
        this.pauseBtn = document.getElementById('tetris-pause');
        this.restartBtn = document.getElementById('tetris-restart');

        // Mobile controls
        this.btnLeft = document.getElementById('btn-left');
        this.btnRight = document.getElementById('btn-right');
        this.btnDown = document.getElementById('btn-down');
        this.btnRotate = document.getElementById('btn-rotate');
        this.btnDrop = document.getElementById('btn-drop');
        this.btnHold = document.getElementById('btn-hold');

        this.init();
    }

    init() {
        if (!this.canvas) return;

        // Set up canvas scaling for retina displays
        this.setupCanvas();

        // Initialize board
        this.resetBoard();

        // Bind events
        this.bindEvents();

        // Initial render
        this.render();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;

        // Main canvas
        this.canvas.width = this.COLS * this.BLOCK_SIZE * dpr;
        this.canvas.height = this.ROWS * this.BLOCK_SIZE * dpr;
        this.canvas.style.width = `${this.COLS * this.BLOCK_SIZE}px`;
        this.canvas.style.height = `${this.ROWS * this.BLOCK_SIZE}px`;
        this.ctx.scale(dpr, dpr);

        // Next canvas
        if (this.nextCanvas) {
            this.nextCanvas.width = 100 * dpr;
            this.nextCanvas.height = 300 * dpr;
            this.nextCanvas.style.width = '100px';
            this.nextCanvas.style.height = '300px';
            this.nextCtx.scale(dpr, dpr);
        }

        // Hold canvas
        if (this.holdCanvas) {
            this.holdCanvas.width = 100 * dpr;
            this.holdCanvas.height = 100 * dpr;
            this.holdCanvas.style.width = '100px';
            this.holdCanvas.style.height = '100px';
            this.holdCtx.scale(dpr, dpr);
        }
    }

    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Button controls
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.start());
        }
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.togglePause());
        }
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.restart());
        }

        // Mobile controls
        if (this.btnLeft) {
            this.btnLeft.addEventListener('click', () => this.movePiece(-1, 0));
            this.btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); this.movePiece(-1, 0); });
        }
        if (this.btnRight) {
            this.btnRight.addEventListener('click', () => this.movePiece(1, 0));
            this.btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); this.movePiece(1, 0); });
        }
        if (this.btnDown) {
            this.btnDown.addEventListener('click', () => this.softDrop());
            this.btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); this.softDrop(); });
        }
        if (this.btnRotate) {
            this.btnRotate.addEventListener('click', () => this.rotatePiece());
            this.btnRotate.addEventListener('touchstart', (e) => { e.preventDefault(); this.rotatePiece(); });
        }
        if (this.btnDrop) {
            this.btnDrop.addEventListener('click', () => this.hardDrop());
            this.btnDrop.addEventListener('touchstart', (e) => { e.preventDefault(); this.hardDrop(); });
        }
        if (this.btnHold) {
            this.btnHold.addEventListener('click', () => this.hold());
            this.btnHold.addEventListener('touchstart', (e) => { e.preventDefault(); this.hold(); });
        }
    }

    handleKeyDown(e) {
        if (!this.started || this.gameOver) return;

        // Check if tetris tab is active
        const tetrisTab = document.getElementById('tetris-tab');
        if (!tetrisTab || !tetrisTab.classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.softDrop();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'c':
            case 'C':
                e.preventDefault();
                this.hold();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }

    resetBoard() {
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null));
    }

    start() {
        this.resetBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.started = true;
        this.holdPiece = null;
        this.canHold = true;

        // Generate initial pieces
        this.nextPieces = [];
        for (let i = 0; i < 3; i++) {
            this.nextPieces.push(this.randomPiece());
        }

        // Spawn first piece
        this.spawnPiece();

        // Update UI
        this.updateStats();
        this.hideOverlay();
        if (this.pauseBtn) this.pauseBtn.disabled = false;

        // Start game loop
        this.lastDropTime = performance.now();
        this.gameLoop();
    }

    restart() {
        this.stop();
        this.start();
    }

    stop() {
        this.started = false;
        if (this.dropInterval) {
            cancelAnimationFrame(this.dropInterval);
            this.dropInterval = null;
        }
    }

    togglePause() {
        if (!this.started || this.gameOver) return;

        this.paused = !this.paused;

        if (this.paused) {
            this.showOverlay('PAUSED', 'Press P or click Resume to continue');
            if (this.pauseBtn) this.pauseBtn.textContent = 'Resume';
        } else {
            this.hideOverlay();
            if (this.pauseBtn) this.pauseBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                Pause`;
            this.lastDropTime = performance.now();
            this.gameLoop();
        }
    }

    randomPiece() {
        const name = this.SHAPE_NAMES[Math.floor(Math.random() * this.SHAPE_NAMES.length)];
        return {
            name,
            shape: this.SHAPES[name].shape.map(row => [...row]),
            color: this.SHAPES[name].color
        };
    }

    spawnPiece() {
        this.currentPiece = this.nextPieces.shift();
        this.nextPieces.push(this.randomPiece());

        // Position at top center
        this.currentPiece.x = Math.floor((this.COLS - this.currentPiece.shape[0].length) / 2);
        this.currentPiece.y = 0;

        this.canHold = true;

        // Check for game over
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.endGame();
        }

        this.renderNext();
    }

    movePiece(dx, dy) {
        if (!this.started || this.paused || this.gameOver) return false;

        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;

        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.render();
            return true;
        }
        return false;
    }

    rotatePiece() {
        if (!this.started || this.paused || this.gameOver) return;

        const rotated = this.rotate(this.currentPiece.shape);

        // Try rotation with wall kicks
        const kicks = [0, -1, 1, -2, 2];
        for (const kick of kicks) {
            if (!this.checkCollision(this.currentPiece.x + kick, this.currentPiece.y, rotated)) {
                this.currentPiece.shape = rotated;
                this.currentPiece.x += kick;
                this.render();
                return;
            }
        }
    }

    rotate(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = shape[y][x];
            }
        }
        return rotated;
    }

    softDrop() {
        if (this.movePiece(0, 1)) {
            this.score += this.POINTS.SOFT_DROP;
            this.updateStats();
        } else {
            this.lockPiece();
        }
    }

    hardDrop() {
        if (!this.started || this.paused || this.gameOver) return;

        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        this.score += dropDistance * this.POINTS.HARD_DROP;
        this.updateStats();
        this.lockPiece();
    }

    hold() {
        if (!this.started || this.paused || this.gameOver || !this.canHold) return;

        const current = {
            name: this.currentPiece.name,
            shape: this.SHAPES[this.currentPiece.name].shape.map(row => [...row]),
            color: this.currentPiece.color
        };

        if (this.holdPiece) {
            this.currentPiece = this.holdPiece;
            this.currentPiece.x = Math.floor((this.COLS - this.currentPiece.shape[0].length) / 2);
            this.currentPiece.y = 0;
        } else {
            this.spawnPiece();
        }

        this.holdPiece = current;
        this.canHold = false;
        this.renderHold();
        this.render();
    }

    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    // Check boundaries
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return true;
                    }

                    // Check collision with placed pieces
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        // Place piece on board
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const y = this.currentPiece.y + row;
                    const x = this.currentPiece.x + col;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }

        // Clear lines
        this.clearLines();

        // Spawn next piece
        this.spawnPiece();
    }

    clearLines() {
        let linesCleared = 0;

        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== null)) {
                // Remove the line
                this.board.splice(row, 1);
                // Add empty line at top
                this.board.unshift(Array(this.COLS).fill(null));
                linesCleared++;
                row++; // Check same row again
            }
        }

        if (linesCleared > 0) {
            // Update score
            const points = [0, this.POINTS.SINGLE, this.POINTS.DOUBLE, this.POINTS.TRIPLE, this.POINTS.TETRIS];
            this.score += (points[linesCleared] || this.POINTS.TETRIS) * this.level;

            // Update lines and level
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;

            this.updateStats();

            // Show toast for tetris
            if (linesCleared === 4 && typeof showToast === 'function') {
                showToast('TETRIS!', 'success');
            }
        }
    }

    getDropSpeed() {
        // Speed increases with level (milliseconds per drop)
        return Math.max(100, 1000 - (this.level - 1) * 100);
    }

    gameLoop() {
        if (!this.started || this.paused || this.gameOver) return;

        const now = performance.now();
        const delta = now - this.lastDropTime;

        if (delta >= this.getDropSpeed()) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.lastDropTime = now;
        }

        this.render();
        this.dropInterval = requestAnimationFrame(() => this.gameLoop());
    }

    endGame() {
        this.gameOver = true;
        this.started = false;

        if (this.dropInterval) {
            cancelAnimationFrame(this.dropInterval);
        }

        this.showOverlay('GAME OVER', `Final Score: ${this.score}`);
        if (this.startBtn) this.startBtn.textContent = 'Play Again';
        if (this.pauseBtn) this.pauseBtn.disabled = true;
    }

    showOverlay(title, message) {
        if (this.overlayTitle) this.overlayTitle.textContent = title;
        if (this.overlayMessage) this.overlayMessage.textContent = message;
        if (this.overlay) this.overlay.style.display = 'flex';
    }

    hideOverlay() {
        if (this.overlay) this.overlay.style.display = 'none';
    }

    updateStats() {
        if (this.scoreEl) this.scoreEl.textContent = this.score.toLocaleString();
        if (this.levelEl) this.levelEl.textContent = this.level;
        if (this.linesEl) this.linesEl.textContent = this.lines;
    }

    render() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.COLS * this.BLOCK_SIZE, this.ROWS * this.BLOCK_SIZE);

        // Draw grid
        this.ctx.strokeStyle = '#2a2a4e';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.ROWS * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.COLS * this.BLOCK_SIZE, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }

        // Draw placed pieces
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(this.ctx, col, row, this.board[row][col], this.BLOCK_SIZE);
                }
            }
        }

        // Draw ghost piece
        if (this.currentPiece && this.started && !this.gameOver) {
            let ghostY = this.currentPiece.y;
            while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
                ghostY++;
            }

            // Draw ghost
            this.ctx.globalAlpha = 0.3;
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        this.drawBlock(
                            this.ctx,
                            this.currentPiece.x + col,
                            ghostY + row,
                            this.currentPiece.color,
                            this.BLOCK_SIZE
                        );
                    }
                }
            }
            this.ctx.globalAlpha = 1;

            // Draw current piece
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        this.drawBlock(
                            this.ctx,
                            this.currentPiece.x + col,
                            this.currentPiece.y + row,
                            this.currentPiece.color,
                            this.BLOCK_SIZE
                        );
                    }
                }
            }
        }
    }

    drawBlock(ctx, x, y, color, size) {
        const padding = 2;

        // Main block
        ctx.fillStyle = color;
        ctx.fillRect(
            x * size + padding,
            y * size + padding,
            size - padding * 2,
            size - padding * 2
        );

        // Highlight (top-left)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(
            x * size + padding,
            y * size + padding,
            size - padding * 2,
            4
        );
        ctx.fillRect(
            x * size + padding,
            y * size + padding,
            4,
            size - padding * 2
        );

        // Shadow (bottom-right)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(
            x * size + padding,
            y * size + size - padding - 4,
            size - padding * 2,
            4
        );
        ctx.fillRect(
            x * size + size - padding - 4,
            y * size + padding,
            4,
            size - padding * 2
        );
    }

    renderNext() {
        if (!this.nextCtx) return;

        // Clear
        this.nextCtx.fillStyle = '#1a1a2e';
        this.nextCtx.fillRect(0, 0, 100, 300);

        // Draw next pieces
        for (let i = 0; i < this.nextPieces.length; i++) {
            const piece = this.nextPieces[i];
            const offsetY = i * 100 + 20;
            const offsetX = (100 - piece.shape[0].length * this.PREVIEW_BLOCK_SIZE) / 2;

            for (let row = 0; row < piece.shape.length; row++) {
                for (let col = 0; col < piece.shape[row].length; col++) {
                    if (piece.shape[row][col]) {
                        this.drawPreviewBlock(
                            this.nextCtx,
                            offsetX + col * this.PREVIEW_BLOCK_SIZE,
                            offsetY + row * this.PREVIEW_BLOCK_SIZE,
                            piece.color
                        );
                    }
                }
            }
        }
    }

    renderHold() {
        if (!this.holdCtx) return;

        // Clear
        this.holdCtx.fillStyle = '#1a1a2e';
        this.holdCtx.fillRect(0, 0, 100, 100);

        if (this.holdPiece) {
            const offsetY = 20;
            const offsetX = (100 - this.holdPiece.shape[0].length * this.PREVIEW_BLOCK_SIZE) / 2;

            this.holdCtx.globalAlpha = this.canHold ? 1 : 0.5;

            for (let row = 0; row < this.holdPiece.shape.length; row++) {
                for (let col = 0; col < this.holdPiece.shape[row].length; col++) {
                    if (this.holdPiece.shape[row][col]) {
                        this.drawPreviewBlock(
                            this.holdCtx,
                            offsetX + col * this.PREVIEW_BLOCK_SIZE,
                            offsetY + row * this.PREVIEW_BLOCK_SIZE,
                            this.holdPiece.color
                        );
                    }
                }
            }

            this.holdCtx.globalAlpha = 1;
        }
    }

    drawPreviewBlock(ctx, x, y, color) {
        const size = this.PREVIEW_BLOCK_SIZE;
        const padding = 1;

        ctx.fillStyle = color;
        ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

        // Simple highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x + padding, y + padding, size - padding * 2, 2);
    }
}

// Initialize game when DOM is ready
let tetrisGame;
document.addEventListener('DOMContentLoaded', () => {
    tetrisGame = new TetrisGame();
});
