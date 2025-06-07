document.addEventListener('DOMContentLoaded', () => {
    // --- Socket.IO Client Setup ---
    const socket = io();

    // --- DOM Elements ---
    const boardElement = document.getElementById('game-board');
    const winLineContainer = document.getElementById('win-line-container');
    const turnDisplay = document.getElementById('turn-display');
    const restartButton = document.getElementById('restart-button');
      // Modal & Lobby Elements
    const gameSetupModal = document.getElementById('game-setup-modal');
    const modeSelection = document.getElementById('mode-selection');
    const nameInputSection = document.getElementById('name-input-section');
    const onlineLobby = document.getElementById('online-lobby');
    const playLocalButton = document.getElementById('play-local-button');
    const playOnlineButton = document.getElementById('play-online-button');
    const nameForm = document.getElementById('name-form');
    const player1NameInput = document.getElementById('player1-name');
    const player2NameInput = document.getElementById('player2-name');
    const onlinePlayerNameInput = document.getElementById('online-player-name');
    const createGameButton = document.getElementById('create-game-button');
    const joinForm = document.getElementById('join-form');
    const roomIdInput = document.getElementById('room-id-input');
    const roomIdDisplay = document.getElementById('room-id-display');    // Online Game Elements
    const onlineControls = document.getElementById('online-controls');
    const rematchButton = document.getElementById('rematch-button');
    const reactionButtons = document.querySelectorAll('.reaction-btn');
    const reactionOverlay = document.getElementById('reaction-overlay');

    // Rematch Modal Elements
    const rematchModal = document.getElementById('rematch-modal');
    const rematchTitle = document.getElementById('rematch-title');
    const rematchMessage = document.getElementById('rematch-message');
    const acceptRematchBtn = document.getElementById('accept-rematch-btn');
    const declineRematchBtn = document.getElementById('decline-rematch-btn');

    // --- Game Constants & State ---
    const ROWS = 6;
    const COLS = 7;
    let board = [];
    let currentPlayer;
    let gameOver = false;
    let playerNames = { 1: 'Player 1', 2: 'Player 2' };

    // -- Online Game State --
    let gameMode = 'local';
    let playerNumber;
    let roomId;
    let isMyTurn;

    // --- Event Listeners ---
    playLocalButton.addEventListener('click', () => {
        gameMode = 'local';
        modeSelection.classList.add('hidden');
        nameInputSection.classList.remove('hidden');
    });

    playOnlineButton.addEventListener('click', () => {
        gameMode = 'online';
        modeSelection.classList.add('hidden');
        onlineLobby.classList.remove('hidden');
    });

    nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        playerNames[1] = player1NameInput.value.trim() || 'Player 1';
        playerNames[2] = player2NameInput.value.trim() || 'Player 2';
        gameSetupModal.classList.remove('show');
        startGame();
    });    createGameButton.addEventListener('click', () => {
        const playerName = onlinePlayerNameInput.value.trim() || 'Player';
        createGameButton.disabled = true;
        createGameButton.classList.add('btn-loading');
        socket.emit('createGame', { playerName });
    });

    joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        roomId = roomIdInput.value.trim();
        const playerName = onlinePlayerNameInput.value.trim() || 'Player';
        if (roomId) {
            const joinButton = joinForm.querySelector('button[type="submit"]');
            joinButton.disabled = true;
            joinButton.classList.add('btn-loading');
            socket.emit('joinGame', { roomId, playerName });
        }
    });    restartButton.addEventListener('click', () => {
        if (gameMode === 'local') {
            startGame();
        }
    });    // Rematch button event listener
    rematchButton.addEventListener('click', () => {
        if (rematchButton.disabled) return; // Prevent multiple requests
        socket.emit('requestRematch', { roomId });
        rematchButton.textContent = 'Waiting for opponent...';
        rematchButton.disabled = true;
    });// Reaction buttons event listeners
    reactionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const reaction = button.dataset.reaction;
            socket.emit('sendReaction', { roomId, reaction });
            showReactionFeedback(reaction, true);
        });
    });

    // Rematch modal event listeners
    acceptRematchBtn.addEventListener('click', () => {
        hideRematchModal();
        socket.emit('respondToRematch', { roomId, accepted: true });
        rematchButton.textContent = 'Waiting for opponent...';
        rematchButton.disabled = true;
    });

    declineRematchBtn.addEventListener('click', () => {
        hideRematchModal();
        socket.emit('respondToRematch', { roomId, accepted: false });
    });// --- Socket.IO Event Handlers ---
    socket.on('gameCreated', (data) => {
        roomId = data.roomId;
        playerNumber = 1;
        playerNames = { 1: "You", 2: "Opponent" };
        roomIdDisplay.querySelector('.code-value').textContent = roomId;
        roomIdDisplay.classList.remove('hidden');
        onlineLobby.querySelector('h2').textContent = "Game Created!";
        
        // Reset button state
        createGameButton.disabled = false;
        createGameButton.classList.remove('btn-loading');
    });    socket.on('gameStarted', (data) => {
        if (!playerNumber) {
            playerNumber = 2;
        }
        
        // Set player names from server data
        const player1 = data.players.find(p => p.playerNumber === 1);
        const player2 = data.players.find(p => p.playerNumber === 2);
        
        if (playerNumber === 1) {
            playerNames = { 1: player1.name, 2: player2.name };
        } else {
            playerNames = { 1: player1.name, 2: player2.name };
        }
        
        gameSetupModal.classList.remove('show');
        startGame();
    });socket.on('moveMade', (data) => {
        if (!isMyTurn) {
            handleColumnClick(data.col, true);
        }
    });

    socket.on('reactionReceived', (data) => {
        showReactionFeedback(data.reaction, false, data.playerName);
    });    socket.on('rematchRequested', (data) => {
        showRematchModal(data.playerName);
    });    socket.on('rematchAccepted', () => {
        hideRematchModal();
        hideRematchUI();
        startGame();
    });    socket.on('rematchDeclined', () => {
        hideRematchModal();
        hideRematchUI();
        // Show a non-blocking notification instead of alert
        showNotification('Opponent declined the rematch.', 'info');
    });
    
    socket.on('opponentDisconnected', () => {
        if (!gameOver) {
            alert('Your opponent has disconnected.');
            turnDisplay.textContent = "You Win!";
            turnDisplay.classList.add('game-over');
            gameOver = true;
        }
    });

    socket.on('error', (message) => {
        alert(`Error: ${message}`);
        roomIdInput.value = '';
        
        // Reset button states
        createGameButton.disabled = false;
        createGameButton.classList.remove('btn-loading');
        const joinButton = joinForm.querySelector('button[type="submit"]');
        if (joinButton) {
            joinButton.disabled = false;
            joinButton.classList.remove('btn-loading');
        }    });

    // --- Core Game Functions ---
    function startGame() {
        gameOver = false;
        currentPlayer = 1;
        isMyTurn = (gameMode === 'local' || playerNumber === 1);
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        
        turnDisplay.classList.remove('game-over');
        restartButton.classList.add('hidden');

        // Show/hide appropriate controls based on game mode
        if (gameMode === 'online') {
            onlineControls.classList.remove('hidden');
            rematchButton.classList.add('hidden');
        } else {
            onlineControls.classList.add('hidden');
        }        createBoard();
        updateTurnDisplay();
    }

    function createBoard() {
        // Clear previous game artifacts
        boardElement.querySelectorAll('.column').forEach(col => col.remove());
        winLineContainer.innerHTML = '';

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
            boardElement.appendChild(column); // Changed from prepend to append
        }
        updateColumnStates(); // Initialize column states
    }

    function handleColumnClick(col, fromOpponent = false) {
        if (gameOver) return;
        if (gameMode === 'online' && !isMyTurn && !fromOpponent) return;

        const row = findAvailableRow(col);
        if (row === -1) return;

        if (gameMode === 'online' && isMyTurn) {
            socket.emit('makeMove', { roomId, col });
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
            if(gameMode === 'online') isMyTurn = !isMyTurn;
            switchPlayer();
        }
        updateColumnStates();
    }

    function findAvailableRow(col) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) return r;
        }
        return -1;
    }

    /**
     * CORRECTED: Now uses a reliable data-attribute selector.
     */
    function placePiece(row, col) {
        const piece = document.createElement('div');
        piece.classList.add('piece', currentPlayer === 1 ? 'player1' : 'player2');
        const targetCell = boardElement.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
        if (targetCell) {
            targetCell.appendChild(piece);
        }
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurnDisplay();
    }    function updateTurnDisplay() {
        if (gameOver) return;
        if (gameMode === 'online') {
            const currentPlayerName = playerNames[currentPlayer];
            const isCurrentPlayerMe = (currentPlayer === playerNumber);
            turnDisplay.textContent = isCurrentPlayerMe ? `Your Turn (${currentPlayerName})` : `${currentPlayerName}'s Turn`;
            const myColor = playerNumber === 1 ? 'var(--player1-color)' : 'var(--player2-color)';
            const opponentColor = playerNumber === 1 ? 'var(--player2-color)' : 'var(--player1-color)';
            turnDisplay.style.color = isCurrentPlayerMe ? myColor : opponentColor;
        } else {
            turnDisplay.textContent = `${playerNames[currentPlayer]}'s Turn`;
            turnDisplay.style.color = currentPlayer === 1 ? 'var(--player1-color)' : 'var(--player2-color)';
        }
    }
    
    function checkForWin(row, col) {
        const player = currentPlayer;
        const directions = [{ dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }];
        for (const { dr, dc } of directions) {
            const line = [{ row, col }];
            for (let i = 1; i < 4; i++) { const r = row + i * dr, c = col + i * dc; if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) { line.push({ row: r, col: c }); } else break; }
            for (let i = 1; i < 4; i++) { const r = row - i * dr, c = col - i * dc; if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) { line.push({ row: r, col: c }); } else break; }
            if (line.length >= 4) return line;
        }
        return null;
    }
    
    /**
     * CORRECTED: Now uses a reliable data-attribute selector.
     */
    function highlightWinningPieces(winningLine) {
        for (const { row, col } of winningLine) {
            const cell = boardElement.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
            cell?.querySelector('.piece')?.classList.add('winning-piece');
        }
        drawWinningLine(winningLine);
    }
    
    /**
     * CORRECTED: Now uses a reliable data-attribute selector.
     */
    function drawWinningLine(winningLine) {
        winningLine.sort((a, b) => (a.row - b.row) || (a.col - b.col));
        const startPiece = winningLine[0];
        const endPiece = winningLine[winningLine.length - 1];

        const startCell = boardElement.querySelector(`.cell[data-row='${startPiece.row}'][data-col='${startPiece.col}']`);
        const endCell = boardElement.querySelector(`.cell[data-row='${endPiece.row}'][data-col='${endPiece.col}']`);
        
        if (!startCell || !endCell) return;

        const startRect = startCell.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();
        const boardRect = boardElement.getBoundingClientRect();

        const startX = startRect.left + startRect.width / 2 - boardRect.left;
        const startY = startRect.top + startRect.height / 2 - boardRect.top;
        const endX = endRect.left + endRect.width / 2 - boardRect.left;
        const endY = endRect.top + endRect.height / 2 - boardRect.top;

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        const line = document.createElement('div');
        line.classList.add('win-line');
        line.style.width = `${length}px`;
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.transform = `rotate(${angle}deg)`;
        winLineContainer.appendChild(line);

        setTimeout(() => { line.style.transform = `rotate(${angle}deg) scaleX(1)`; }, 50);
    }

    function isBoardFull() {
        return board.every(row => row.every(cell => cell !== 0));
    }    function endGame(winner) {
        gameOver = true;
        turnDisplay.classList.add('game-over');
        if (winner) {
            let winnerText;
            if (gameMode === 'online') {
                const winnerName = playerNames[winner];
                const isWinnerMe = (winner === playerNumber);
                winnerText = isWinnerMe ? `You Win! 🎉 (${winnerName})` : `${winnerName} Wins! 😞`;
            } else {
                winnerText = `${playerNames[winner]} Wins! 🎉`;
            }
            turnDisplay.textContent = winnerText;
            turnDisplay.style.color = winner === 1 ? 'var(--player1-color)' : 'var(--player2-color)';
        } else {
            turnDisplay.textContent = "It's a Draw! 🤝";
            turnDisplay.style.color = '#343a40';
        }

        if (gameMode === 'local') {
            restartButton.classList.remove('hidden');
        } else if (gameMode === 'online') {
            showRematchButton();
        }
    }

    function updateColumnStates() {
        // Update column classes based on availability
        for (let c = 0; c < COLS; c++) {
            const column = boardElement.querySelector(`.column[data-col='${c}']`);
            if (column) {
                const row = findAvailableRow(c);
                if (row === -1) {
                    column.classList.add('full');
                } else {
                    column.classList.remove('full');
                }
            }
        }
    }    // Debug function to log column states (can be removed in production)
    function debugColumnStates() {
        console.log('Column states:');
        for (let c = 0; c < COLS; c++) {
            const column = boardElement.querySelector(`.column[data-col='${c}']`);
            const isFull = column?.classList.contains('full');
            const availableRow = findAvailableRow(c);
            console.log(`Column ${c}: Full=${isFull}, AvailableRow=${availableRow}`);
        }
    }

    // --- Reaction System Functions ---
    function showReactionFeedback(reaction, isOwnReaction, playerName = '') {
        const reactionElement = document.createElement('div');
        reactionElement.classList.add('reaction-feedback');
        reactionElement.textContent = reaction;
        
        if (isOwnReaction) {
            reactionElement.classList.add('own-reaction');
        } else {
            reactionElement.classList.add('opponent-reaction');
            reactionElement.title = `${playerName} reacted`;
        }
        
        // Position randomly in the reaction overlay
        const x = Math.random() * 80 + 10; // 10-90% from left
        const y = Math.random() * 60 + 20; // 20-80% from top
        reactionElement.style.left = `${x}%`;
        reactionElement.style.top = `${y}%`;
        
        reactionOverlay.appendChild(reactionElement);
        
        // Animate and remove
        setTimeout(() => {
            reactionElement.classList.add('animate');
        }, 50);
        
        setTimeout(() => {
            reactionElement.remove();
        }, 2000);
    }    // --- Rematch System Functions ---
    function showRematchModal(playerName) {
        rematchTitle.textContent = 'Rematch Request';
        rematchMessage.textContent = `${playerName} wants to play again!`;
        rematchModal.classList.add('show');
    }

    function hideRematchModal() {
        rematchModal.classList.remove('show');
    }

    function showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.classList.add('notification', `notification-${type}`);
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'info' ? '#3498db' : '#e74c3c'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function hideRematchUI() {
        rematchButton.textContent = '🔄 Play Again';
        rematchButton.disabled = false;
        rematchButton.classList.add('hidden');
    }

    // Show rematch button when game ends (for online games)
    function showRematchButton() {
        if (gameMode === 'online') {
            rematchButton.classList.remove('hidden');
        }
    }
});