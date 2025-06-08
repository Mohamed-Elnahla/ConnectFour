document.addEventListener('DOMContentLoaded', () => {
    // --- Socket.IO Client Setup ---
    const socket = io();    // --- DOM Elements ---
    const boardElement = document.getElementById('game-board');
    const winLineContainer = document.getElementById('win-line-container');
    const turnDisplay = document.getElementById('turn-display');
    const restartButton = document.getElementById('restart-button');
    
    // Modal & Navigation Elements
    const gameSetupModal = document.getElementById('game-setup-modal');
    const backButton = document.getElementById('back-button');
      // Modal Pages
    const pageModeSelection = document.getElementById('page-mode-selection');
    const pageDeviceNames = document.getElementById('page-device-names');
    const pageOnlineName = document.getElementById('page-online-name');
    const pageOnlineColor = document.getElementById('page-online-color');
    const pageOnlineJoinCreate = document.getElementById('page-online-join-create');
    const pageOnlineJoin = document.getElementById('page-online-join');
    const pageOnlineWaiting = document.getElementById('page-online-waiting');
    
    // Mode Selection Buttons
    const selectDeviceButton = document.getElementById('select-device-button');
    const selectOnlineButton = document.getElementById('select-online-button');
    
    // Device Mode Elements
    const deviceNameForm = document.getElementById('device-name-form');
    const devicePlayer1NameInput = document.getElementById('device-player1-name');
    const devicePlayer2NameInput = document.getElementById('device-player2-name');
      // Online Mode Elements
    const onlineNameForm = document.getElementById('online-name-form');
    const onlinePlayerNameInput = document.getElementById('online-player-name');
    const colorOptions = document.querySelectorAll('.color-option');
    const continueColorBtn = document.getElementById('continue-color-btn');
    const selectJoinButton = document.getElementById('select-join-button');
    const selectCreateButton = document.getElementById('select-create-button');
    const joinGameForm = document.getElementById('join-game-form');
    const joinRoomCodeInput = document.getElementById('join-room-code');
    const waitingRoomCode = document.getElementById('waiting-room-code');

    // Online Game Elements
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
    let playerNames = { 1: 'Player 1', 2: 'Player 2' };    // -- Online Game State --
    let gameMode = 'local';
    let playerNumber;
    let roomId;
    let isMyTurn;
      // -- Modal Navigation State --
    let currentPage = 'page-mode-selection';
    let onlinePlayerName = '';
    let selectedPlayerColor = { main: '#ef4444', light: '#f87171' }; // Default red
    let modalHistory = [];    // --- Modal Navigation Functions ---
    function showPage(pageId, addToHistory = true) {
        // Hide all pages
        [pageModeSelection, pageDeviceNames, pageOnlineName, pageOnlineColor, pageOnlineJoinCreate, pageOnlineJoin, pageOnlineWaiting].forEach(page => {
            page.classList.add('hidden');
        });
        
        // Show the requested page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            currentPage = pageId;
            
            // Add to history if requested
            if (addToHistory && modalHistory[modalHistory.length - 1] !== pageId) {
                modalHistory.push(pageId);
            }
            
            // Show/hide back button
            if (modalHistory.length > 1) {
                backButton.classList.remove('hidden');
            } else {
                backButton.classList.add('hidden');
            }
        }
    }
    
    function goBack() {
        if (modalHistory.length > 1) {
            modalHistory.pop(); // Remove current page
            const previousPage = modalHistory[modalHistory.length - 1];
            showPage(previousPage, false);
        }
    }    // --- Event Listeners ---
    
    // Back button
    backButton.addEventListener('click', goBack);      // Mode selection
    selectDeviceButton.addEventListener('click', () => {
        // Clear any ongoing reconnection attempts when switching to local mode
        clearReconnectionState();
        gameMode = 'local';
        // Reset colors to default for local mode
        resetPlayerColors();
        showPage('page-device-names');
    });

    selectOnlineButton.addEventListener('click', () => {
        gameMode = 'online';
        showPage('page-online-name');
    });

    // Device mode - name form
    deviceNameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        playerNames[1] = devicePlayer1NameInput.value.trim() || 'Player 1';
        playerNames[2] = devicePlayer2NameInput.value.trim() || 'Player 2';        gameSetupModal.classList.remove('show');
        startGame();
    });

    // Online mode - name form
    onlineNameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        onlinePlayerName = onlinePlayerNameInput.value.trim() || 'Player';
        showPage('page-online-color');
    });

    // Online mode - join/create selection
    selectJoinButton.addEventListener('click', () => {
        showPage('page-online-join');
    });

    selectCreateButton.addEventListener('click', () => {
        const joinButton = selectCreateButton;
        joinButton.disabled = true;
        joinButton.classList.add('btn-loading');
        socket.emit('createGame', { playerName: onlinePlayerName });
    });

    // Online mode - join game form
    joinGameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        roomId = joinRoomCodeInput.value.trim();
        if (roomId) {
            const joinButton = joinGameForm.querySelector('button[type="submit"]');
            joinButton.disabled = true;
            joinButton.classList.add('btn-loading');
            socket.emit('joinGame', { roomId, playerName: onlinePlayerName });
        }
    });

    restartButton.addEventListener('click', () => {
        if (gameMode === 'local') {
            startGame();
        }
    });

    // Rematch button event listener
    rematchButton.addEventListener('click', () => {
        if (rematchButton.disabled) return; // Prevent multiple requests
        socket.emit('requestRematch', { roomId });
        rematchButton.textContent = 'Waiting for opponent...';
        rematchButton.disabled = true;
    });

    // Reaction buttons event listeners
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
        rematchButton.textContent = 'Waiting for opponent...';        rematchButton.disabled = true;
    });

    declineRematchBtn.addEventListener('click', () => {
        hideRematchModal();
        socket.emit('respondToRematch', { roomId, accepted: false });
    });

    // Color selection event listeners
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Store selected color
            selectedPlayerColor = {
                main: option.dataset.color,
                light: option.dataset.light
            };
            
            // Enable continue button
            continueColorBtn.disabled = false;
            
            // Apply color immediately for preview            applyPlayerColor();
        });
    });

    // Continue from color selection to join/create
    continueColorBtn.addEventListener('click', () => {
        showPage('page-online-join-create');
    });

    // --- Socket.IO Event Handlers ---
    socket.on('gameCreated', (data) => {
        roomId = data.roomId;
        playerNumber = 1;
        playerNames = { 1: "You", 2: "Opponent" };
        waitingRoomCode.textContent = roomId;
        
        // Apply selected color for online mode
        applyPlayerColor();
        
        showPage('page-online-waiting');
        
        // Reset button state
        selectCreateButton.disabled = false;        selectCreateButton.classList.remove('btn-loading');
    });

    socket.on('gameStarted', (data) => {
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
        
        // Apply selected color for online mode
        applyPlayerColor();
        
        gameSetupModal.classList.remove('show');
        startGame(data.nextStarter || 1);
    });

    socket.on('moveMade', (data) => {
        if (!isMyTurn) {
            handleColumnClick(data.col, true);
        }
    });

    socket.on('reactionReceived', (data) => {
        showReactionFeedback(data.reaction, false, data.playerName);
    });

    socket.on('rematchRequested', (data) => {        showRematchModal(data.playerName);
    });

    socket.on('rematchAccepted', (data) => {
        hideRematchModal();
        hideRematchUI();
        startGame(data.nextStarter || 1);
    });

    socket.on('rematchDeclined', () => {
        hideRematchModal();
        hideRematchUI();
        // Show a non-blocking notification instead of alert
        showNotification('Opponent declined the rematch.', 'info');
    });
      socket.on('opponentDisconnected', (data) => {
        if (!gameOver) {
            // Show a countdown notification instead of immediately declaring victory
            showDisconnectionWarning(data.playerName, data.gracePeriod);
        }
    });

    socket.on('opponentDisconnectedFinal', (data) => {
        hideDisconnectionWarning();
        if (!gameOver) {
            turnDisplay.textContent = "You Win! 🎉 (Opponent disconnected)";
            turnDisplay.classList.add('game-over');
            turnDisplay.style.color = 'var(--primary-blue)';
            gameOver = true;
            
            // Emit game end event for winner tracking
            socket.emit('gameEnded', { roomId, winner: data.winner });
            
            if (gameMode === 'online') {                showRematchButton();
            }
        }
    });

    socket.on('playerReconnected', (data) => {
        hideDisconnectionWarning();
        showNotification(`${data.playerName} reconnected! Game continues.`, 'success');
        
        // Clear reconnection state if we're the reconnected player
        if (data.playerName === onlinePlayerName) {
            clearReconnectionState();
        }
    });

    socket.on('gameResumed', (data) => {
        // Update player information after reconnection
        playerNames = {};
        data.players.forEach(player => {
            playerNames[player.playerNumber] = player.name;
        });
        showNotification('Reconnected successfully! Game continues.', 'success');
        
        // Clear reconnection state - we successfully reconnected        clearReconnectionState();
    });

    socket.on('error', (message) => {
        alert(`Error: ${message}`);
        joinRoomCodeInput.value = '';
        
        // Reset button states
        selectCreateButton.disabled = false;
        selectCreateButton.classList.remove('btn-loading');
        const joinButton = joinGameForm.querySelector('button[type="submit"]');
        if (joinButton) {
            joinButton.disabled = false;
            joinButton.classList.remove('btn-loading');        }
    });

    // --- Core Game Functions ---
    function startGame(starterPlayer = 1) {
        gameOver = false;
        currentPlayer = starterPlayer;
        
        // For online mode, determine if it's my turn based on starter
        if (gameMode === 'online') {
            isMyTurn = (playerNumber === starterPlayer);
        } else {
            isMyTurn = true; // Local mode - always my turn
        }
        
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
    }    function switchPlayer() {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurnDisplay();
    }

    function updateTurnDisplay() {
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

    function isBoardFull() {        return board.every(row => row.every(cell => cell !== 0));
    }

    function endGame(winner) {
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

        // Clear reconnection state when game ends
        if (gameMode === 'online') {
            clearReconnectionState();
        }

        if (gameMode === 'local') {
            restartButton.classList.remove('hidden');
        } else if (gameMode === 'online') {
            // Emit game end event to server for tracking winner
            socket.emit('gameEnded', { roomId, winner });
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
            }        }
    }

    // Debug function to log column states (can be removed in production)
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
    }    // Show rematch button when game ends (for online games)
    function showRematchButton() {
        if (gameMode === 'online') {
            rematchButton.classList.remove('hidden');
        }
    }
    
    // --- Initialize Modal Navigation ---
    modalHistory.push('page-mode-selection');
    showPage('page-mode-selection', false);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (gameSetupModal.classList.contains('show')) {
            if (e.key === 'Escape' && modalHistory.length > 1) {
                goBack();
            }
        }
    });
    
    // --- Disconnection Warning System ---
    let disconnectionWarning = null;
    let disconnectionCountdown = null;
    let reconnectionAttempted = false;

    function showDisconnectionWarning(playerName, gracePeriod) {
        hideDisconnectionWarning(); // Clear any existing warning
        
        // Create warning overlay
        disconnectionWarning = document.createElement('div');
        disconnectionWarning.classList.add('disconnection-warning');
        disconnectionWarning.innerHTML = `
            <div class="warning-content">
                <h3>⚠️ Player Disconnected</h3>
                <p><strong>${playerName}</strong> has lost connection</p>
                <div class="countdown-container">
                    <p>Waiting for reconnection...</p>
                    <div class="countdown-timer">
                        <span id="countdown-seconds">10</span> seconds remaining
                    </div>
                    <div class="countdown-progress">
                        <div class="progress-bar"></div>
                    </div>
                </div>
                <p class="warning-note">You will be declared the winner if they don't reconnect in time.</p>
            </div>
        `;
        
        // Style the warning
        disconnectionWarning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(disconnectionWarning);
        
        // Start countdown
        let timeLeft = gracePeriod / 1000; // Convert to seconds
        const countdownElement = disconnectionWarning.querySelector('#countdown-seconds');
        const progressBar = disconnectionWarning.querySelector('.progress-bar');
        
        disconnectionCountdown = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = timeLeft;
            
            // Update progress bar
            const progressPercent = ((gracePeriod / 1000 - timeLeft) / (gracePeriod / 1000)) * 100;
            progressBar.style.width = `${progressPercent}%`;
            
            if (timeLeft <= 0) {
                clearInterval(disconnectionCountdown);
            }
        }, 1000);
    }

    function hideDisconnectionWarning() {
        if (disconnectionWarning) {
            disconnectionWarning.remove();
            disconnectionWarning = null;
        }
        if (disconnectionCountdown) {
            clearInterval(disconnectionCountdown);
            disconnectionCountdown = null;
        }
        reconnectionAttempted = false;
    }    // --- Reconnection Logic ---
    let reconnectionTimeout = null;
    let reconnectionAttempts = 0;
    const MAX_RECONNECTION_ATTEMPTS = 3;
    const RECONNECTION_DELAY = 2000; // 2 seconds delay before attempting to reconnect

    socket.on('disconnect', () => {
        if (gameMode === 'online' && roomId && !gameOver) {
            console.log('Disconnected from server. Will attempt to reconnect...');
            showNotification('Connection lost. Will attempt to reconnect...', 'error');
            reconnectionAttempted = true;
            reconnectionAttempts = 0;
            
            // Clear any existing reconnection timeout
            if (reconnectionTimeout) {
                clearTimeout(reconnectionTimeout);
            }
        }
    });

    socket.on('connect', () => {
        if (reconnectionAttempted && gameMode === 'online' && roomId && onlinePlayerName) {
            console.log('Socket connected. Waiting before attempting to rejoin game...');
            
            // Clear any existing timeout
            if (reconnectionTimeout) {
                clearTimeout(reconnectionTimeout);
            }
            
            // Wait a bit for the connection to stabilize before attempting reconnection
            reconnectionTimeout = setTimeout(() => {
                attemptReconnection();
            }, RECONNECTION_DELAY);
        }
    });

    function attemptReconnection() {
        if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS && gameMode === 'online' && roomId && onlinePlayerName) {
            reconnectionAttempts++;
            console.log(`Attempting to rejoin game... (attempt ${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})`);
            
            showNotification(`Attempting to rejoin game... (${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})`, 'info');
            
            socket.emit('attemptReconnect', { roomId, playerName: onlinePlayerName });
            
            // Set a timeout for this reconnection attempt
            reconnectionTimeout = setTimeout(() => {
                if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
                    console.log(`Reconnection attempt ${reconnectionAttempts} failed, trying again...`);
                    attemptReconnection();
                } else {
                    console.log('All reconnection attempts failed');
                    showNotification('Failed to reconnect to the game. Please refresh the page.', 'error');
                    reconnectionAttempted = false;
                }
            }, 3000); // Wait 3 seconds before next attempt
        }
    }

    function clearReconnectionState() {
        reconnectionAttempted = false;
        reconnectionAttempts = 0;
        if (reconnectionTimeout) {
            clearTimeout(reconnectionTimeout);
            reconnectionTimeout = null;
        }
    }

    // Handle reconnection failure from server
    socket.on('reconnectionFailed', (data) => {
        console.log('Reconnection failed:', data.message);
        if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
            showNotification(`Reconnection failed: ${data.message}. Retrying...`, 'error');
            // Try again after a delay
            reconnectionTimeout = setTimeout(() => {
                attemptReconnection();
            }, 2000);
        } else {
            showNotification('Failed to reconnect to the game. Please refresh the page.', 'error');
            clearReconnectionState();
        }
    });
    
    // --- Color Management Functions ---
    function applyPlayerColor() {
        // Only apply color in online mode and if a color is selected
        if (gameMode === 'online' && selectedPlayerColor) {
            // Determine which player color to override based on our player number
            const colorVar = playerNumber === 1 ? '--player1-color' : '--player2-color';
            const lightVar = playerNumber === 1 ? '--player1-light' : '--player2-light';
            
            // Apply the selected colors as CSS custom properties
            document.documentElement.style.setProperty(colorVar, selectedPlayerColor.main);
            document.documentElement.style.setProperty(lightVar, selectedPlayerColor.light);
        }
    }

    function resetPlayerColors() {
        // Reset to default colors
        document.documentElement.style.removeProperty('--player1-color');
        document.documentElement.style.removeProperty('--player1-light');
        document.documentElement.style.removeProperty('--player2-color');
        document.documentElement.style.removeProperty('--player2-light');
    }    // Initialize default color selection
    function initializeColorSelection() {
        // Select the first color option (red) by default
        if (colorOptions.length > 0) {
            colorOptions[0].classList.add('selected');
            selectedPlayerColor = {
                main: colorOptions[0].dataset.color,
                light: colorOptions[0].dataset.light
            };
            continueColorBtn.disabled = false;
        }
    }

    // Call the initialization function
    initializeColorSelection();
});