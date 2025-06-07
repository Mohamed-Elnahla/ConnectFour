document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const boardElement = document.getElementById('game-board');
    const winLineContainer = document.getElementById('win-line-container'); // New
    const turnDisplay = document.getElementById('turn-display');
    const restartButton = document.getElementById('restart-button');
    const nameModal = document.getElementById('name-modal');
    const nameForm = document.getElementById('name-form');
    const player1NameInput = document.getElementById('player1-name');
    const player2NameInput = document.getElementById('player2-name');

    // ... (Game Constants and Game State are unchanged) ...
    const ROWS = 6;
    const COLS = 7;
    const PLAYER1_COLOR = 'player1';
    const PLAYER2_COLOR = 'player2';

    let board = [];
    let currentPlayer = 1;
    let gameOver = false;
    let playerNames = { 1: 'Player 1', 2: 'Player 2' };

    // --- Event Listeners ---
    nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        playerNames[1] = player1NameInput.value.trim() || 'Player 1';
        playerNames[2] = player2NameInput.value.trim() || 'Player 2';
        nameModal.classList.remove('show');
        startGame();
    });

    restartButton.addEventListener('click', startGame);

    // --- Functions ---

    function startGame() {
        gameOver = false;
        currentPlayer = 1;
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        
        // Clear the winning line from the previous game
        winLineContainer.innerHTML = '';
        
        turnDisplay.classList.remove('game-over');
        restartButton.classList.add('hidden');

        createBoard();
        updateTurnDisplay();
    }

    // ... (createBoard, handleColumnClick, findAvailableRow, placePiece, switchPlayer, updateTurnDisplay, checkForWin, and isBoardFull are unchanged from the previous version) ...

    function createBoard() {
        boardElement.querySelector('#win-line-container').innerHTML = ''; // Ensure container is empty
        // Clear old columns if any
        Array.from(boardElement.getElementsByClassName('column')).forEach(col => col.remove());
        
        for (let c = 0; c < COLS; c++) {
            const column = document.createElement('div');
            column.classList.add('column');
            column.dataset.col = c;
            column.addEventListener('click', () => handleColumnClick(c));

            for (let r = 0; r < ROWS; r++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                column.appendChild(cell);
            }
            boardElement.prepend(column); // Prepend to keep line container last
        }
    }

    function handleColumnClick(col) {
        if (gameOver) return;

        const row = findAvailableRow(col);
        if (row === -1) {
            const columnEl = boardElement.querySelector(`[data-col='${col}']`);
            columnEl.classList.add('full');
            setTimeout(() => columnEl.classList.remove('full'), 300);
            return;
        }

        board[row][col] = currentPlayer;
        placePiece(row, col);

        const winningLine = checkForWin(row, col);
        if (winningLine) {
            gameOver = true;
            highlightWinningPieces(winningLine);
            setTimeout(() => endGame(currentPlayer), 500);
        } else if (isBoardFull()) {
            gameOver = true;
            setTimeout(() => endGame(null), 500);
        } else {
            switchPlayer();
        }
    }
    
    function findAvailableRow(col) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) return r;
        }
        return -1;
    }

    function placePiece(row, col) {
        const piece = document.createElement('div');
        piece.classList.add('piece', currentPlayer === 1 ? PLAYER1_COLOR : PLAYER2_COLOR);
        const targetCell = boardElement.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
        targetCell.appendChild(piece);
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurnDisplay();
    }

    function updateTurnDisplay() {
        if (gameOver) return;
        turnDisplay.textContent = `${playerNames[currentPlayer]}'s Turn`;
        turnDisplay.style.color = currentPlayer === 1 ? 'var(--player1-color)' : 'var(--player2-color)';
    }
    
    function checkForWin(row, col) {
        const player = currentPlayer;
        const directions = [
            { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }
        ];

        for (const { dr, dc } of directions) {
            const line = [{ row, col }];
            for (let i = 1; i < 4; i++) {
                const r = row + i * dr, c = col + i * dc;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
                    line.push({ row: r, col: c });
                } else break;
            }
            for (let i = 1; i < 4; i++) {
                const r = row - i * dr, c = col - i * dc;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
                    line.push({ row: r, col: c });
                } else break;
            }
            if (line.length >= 4) return line;
        }
        return null;
    }

    function highlightWinningPieces(winningLine) {
        // Highlight the individual pieces
        for (const { row, col } of winningLine) {
            const cell = boardElement.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
            cell.querySelector('.piece')?.classList.add('winning-piece');
        }
        // Draw the connecting line
        drawWinningLine(winningLine);
    }

    /**
     * Calculates the position and draws a line connecting the winning pieces.
     * @param {Array} winningLine - Array of {row, col} objects.
     */
    function drawWinningLine(winningLine) {
        // Sort pieces to find the start and end of the line
        winningLine.sort((a, b) => (a.row - b.row) || (a.col - b.col));
        const startPiece = winningLine[0];
        const endPiece = winningLine[winningLine.length - 1];

        const startCell = boardElement.querySelector(`.cell[data-row='${startPiece.row}'][data-col='${startPiece.col}']`);
        const endCell = boardElement.querySelector(`.cell[data-row='${endPiece.row}'][data-col='${endPiece.col}']`);
        
        // Calculate center points of the start and end cells
        const startX = startCell.offsetLeft + startCell.offsetWidth / 2;
        const startY = startCell.offsetTop + startCell.offsetHeight / 2;
        const endX = endCell.offsetLeft + endCell.offsetWidth / 2;
        const endY = endCell.offsetTop + endCell.offsetHeight / 2;

        // Calculate length and angle of the line using trigonometry
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        // Create and style the line element
        const line = document.createElement('div');
        line.classList.add('win-line');
        line.style.width = `${length}px`;
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.transform = `rotate(${angle}deg)`;

        winLineContainer.appendChild(line);

        // Trigger the animation by changing the scale after a short delay
        setTimeout(() => {
            line.style.transform = `rotate(${angle}deg) scaleX(1)`;
        }, 100);
    }
    
    function isBoardFull() {
        return board.every(row => row.every(cell => cell !== 0));
    }

    function endGame(winner) {
        turnDisplay.classList.add('game-over');
        if (winner) {
            turnDisplay.textContent = `${playerNames[winner]} Wins! 🎉`;
            turnDisplay.style.color = winner === 1 ? 'var(--player1-color)' : 'var(--player2-color)';
        } else {
            turnDisplay.textContent = "It's a Draw! 🤝";
            turnDisplay.style.color = '#343a40';
        }
        restartButton.classList.remove('hidden');
    }
});