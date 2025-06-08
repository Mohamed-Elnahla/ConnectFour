// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { nanoid } = require('nanoid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve the static front-end files from the 'public' directory
app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Create a new game room
    socket.on('createGame', ({ playerName }) => {
        const roomId = nanoid(6); // Generate a 6-character unique ID
        rooms[roomId] = {
            players: [{ id: socket.id, playerNumber: 1, name: playerName || 'Player 1' }],
            gameBoard: null,
            gameInProgress: false,
            nextStarter: 1, // Who starts the next game (1 or 2)
            lastWinner: null, // Track the winner of the last game
            scores: { 1: 0, 2: 0 }, // Track wins for each player
        };
        socket.join(roomId);
        socket.emit('gameCreated', { roomId });
        console.log(`Room created: ${roomId} by ${socket.id} (${playerName})`);
    });

    // Join an existing game room
    socket.on('joinGame', ({ roomId, playerName }) => {
        const room = rooms[roomId];
        if (room && room.players.length === 1) {
            room.players.push({ id: socket.id, playerNumber: 2, name: playerName || 'Player 2' });
            socket.join(roomId);
            console.log(`User ${socket.id} (${playerName}) joined room ${roomId}`);            // Both players are in, start the game
            room.gameInProgress = true;
            io.to(roomId).emit('gameStarted', { 
                roomId,
                players: room.players,
                nextStarter: room.nextStarter,
                scores: room.scores
            });
        } else {
            socket.emit('error', 'Room is full or does not exist.');
        }
    });    // Handle a player's move
    socket.on('makeMove', ({ roomId, col }) => {
        // Broadcast the move to the other player in the room
        socket.to(roomId).emit('moveMade', { col });
    });

    // Handle reactions
    socket.on('sendReaction', ({ roomId, reaction }) => {
        const room = rooms[roomId];
        if (room) {
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                socket.to(roomId).emit('reactionReceived', { 
                    reaction, 
                    playerName: player.name,
                    playerNumber: player.playerNumber 
                });
            }
        }
    });    // Handle game end to track winner
    socket.on('gameEnded', ({ roomId, winner }) => {
        const room = rooms[roomId];
        if (room && room.gameInProgress) {
            // Only process if game is still in progress (prevent double counting)
            room.gameInProgress = false;
            room.lastWinner = winner;
            
            // Update scores if there was a winner
            if (winner && room.scores) {
                room.scores[winner]++;
                console.log(`Game ended in room ${roomId}. Winner: ${winner}, Scores: Player 1 - ${room.scores[1]}, Player 2 - ${room.scores[2]}`);
            }
            
            // Set next starter: if there was a winner, they start next; otherwise keep current starter
            if (winner) {
                room.nextStarter = winner;
            }
        }
    });

    // Handle rematch request
    socket.on('requestRematch', ({ roomId }) => {
        const room = rooms[roomId];
        if (room) {
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                if (!room.rematchRequests) {
                    room.rematchRequests = new Set();
                }
                
                if (!room.rematchRequests.has(socket.id)) {
                    room.rematchRequests.add(socket.id);
                    
                    // Notify the other player about the rematch request
                    socket.to(roomId).emit('rematchRequested', { 
                        playerName: player.name,
                        playerNumber: player.playerNumber
                    });                    // If both players have requested rematch, start new game
                    if (room.rematchRequests.size === 2) {
                        room.rematchRequests.clear();
                        room.gameInProgress = true;
                        io.to(roomId).emit('rematchAccepted', { 
                            nextStarter: room.nextStarter,
                            scores: room.scores,
                            players: room.players
                        });
                    }
                }
            }
        }
    });

    // Handle rematch response
    socket.on('respondToRematch', ({ roomId, accepted }) => {
        const room = rooms[roomId];
        if (room) {
            if (accepted) {
                const player = room.players.find(p => p.id === socket.id);
                if (player) {
                    if (!room.rematchRequests) {
                        room.rematchRequests = new Set();
                    }
                    
                    room.rematchRequests.add(socket.id);                    // If both players have accepted, start new game
                    if (room.rematchRequests.size === 2) {
                        room.rematchRequests.clear();
                        room.gameInProgress = true;
                        io.to(roomId).emit('rematchAccepted', { 
                            nextStarter: room.nextStarter,
                            scores: room.scores,
                            players: room.players
                        });
                    }
                }
            } else {
                room.rematchRequests = new Set();
                socket.to(roomId).emit('rematchDeclined');
            }
        }
    });

    // Handle player reconnection attempts
    socket.on('attemptReconnect', ({ roomId, playerName }) => {
        const room = rooms[roomId];
        if (room && room.gameInProgress) {
            // Find disconnected player with matching name
            const disconnectedPlayerIndex = room.players.findIndex(p => 
                p.name === playerName && p.disconnected
            );
            
            if (disconnectedPlayerIndex !== -1) {
                // Clear disconnection timer if it exists
                if (room.disconnectionTimer) {
                    clearTimeout(room.disconnectionTimer);
                    room.disconnectionTimer = null;
                }
                
                // Reconnect the player
                room.players[disconnectedPlayerIndex].id = socket.id;
                room.players[disconnectedPlayerIndex].disconnected = false;
                room.players[disconnectedPlayerIndex].disconnectTime = null;
                
                // Join the room
                socket.join(roomId);
                
                console.log(`Player ${playerName} reconnected to room ${roomId}`);
                
                // Notify both players about successful reconnection
                io.to(roomId).emit('playerReconnected', {
                    playerName: playerName,
                    players: room.players,
                    nextStarter: room.nextStarter
                });
                  // Send current game state to reconnected player
                socket.emit('gameResumed', {
                    roomId,
                    players: room.players,
                    nextStarter: room.nextStarter
                });
            } else {
                socket.emit('reconnectionFailed', { 
                    message: 'Unable to find your player slot in this room. You may have been replaced.' 
                });
            }
        } else {
            socket.emit('reconnectionFailed', { 
                message: 'Room not found or game not in progress.' 
            });
        }
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Find which room the player was in and handle disconnection
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                const disconnectedPlayer = room.players[playerIndex];
                
                // Only handle if game was in progress
                if (room.gameInProgress) {
                    console.log(`Player ${disconnectedPlayer.name} disconnected from room ${roomId}`);
                    
                    // Mark player as disconnected instead of removing immediately
                    room.players[playerIndex].disconnected = true;
                    room.players[playerIndex].disconnectTime = Date.now();
                    
                    // Notify the remaining player about disconnection
                    socket.to(roomId).emit('opponentDisconnected', {
                        playerName: disconnectedPlayer.name,
                        gracePeriod: 10000 // 10 seconds
                    });
                    
                    // Start 10-second grace period timer
                    room.disconnectionTimer = setTimeout(() => {
                        // Check if player is still disconnected after 10 seconds
                        const stillDisconnected = room.players[playerIndex].disconnected;
                        if (stillDisconnected) {
                            console.log(`Grace period expired for room ${roomId}. Declaring winner.`);
                            
                            // Find the remaining connected player and declare them winner
                            const remainingPlayer = room.players.find(p => !p.disconnected);
                            if (remainingPlayer) {
                                io.to(roomId).emit('opponentDisconnectedFinal', {
                                    winner: remainingPlayer.playerNumber,
                                    winnerName: remainingPlayer.name
                                });
                            }
                            
                            // Clean up the room after a short delay
                            setTimeout(() => {
                                delete rooms[roomId];
                                console.log(`Room ${roomId} closed due to disconnection.`);
                            }, 2000);
                        }
                    }, 10000); // 10 seconds                } else {                // If game not in progress, just clean up immediately
                delete rooms[roomId];
                    console.log(`Room ${roomId} closed (game not in progress).`);
                }
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});