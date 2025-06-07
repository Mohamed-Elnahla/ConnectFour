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
        };
        socket.join(roomId);
        socket.emit('gameCreated', { roomId });
        console.log(`Room created: ${roomId} by ${socket.id} (${playerName})`);
    });    // Join an existing game room
    socket.on('joinGame', ({ roomId, playerName }) => {
        const room = rooms[roomId];
        if (room && room.players.length === 1) {
            room.players.push({ id: socket.id, playerNumber: 2, name: playerName || 'Player 2' });
            socket.join(roomId);
            console.log(`User ${socket.id} (${playerName}) joined room ${roomId}`);
            
            // Both players are in, start the game
            room.gameInProgress = true;
            io.to(roomId).emit('gameStarted', { 
                roomId,
                players: room.players
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
    });    // Handle rematch request
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
                    });
                    
                    // If both players have requested rematch, start new game
                    if (room.rematchRequests.size === 2) {
                        room.rematchRequests.clear();
                        room.gameInProgress = true;
                        io.to(roomId).emit('rematchAccepted');
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
                    
                    room.rematchRequests.add(socket.id);
                    
                    // If both players have accepted, start new game
                    if (room.rematchRequests.size === 2) {
                        room.rematchRequests.clear();
                        room.gameInProgress = true;
                        io.to(roomId).emit('rematchAccepted');
                    }
                }
            } else {
                room.rematchRequests = new Set();
                socket.to(roomId).emit('rematchDeclined');
            }
        }
    });    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Find which room the player was in and notify the other player
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                // Only notify if game was in progress
                if (room.gameInProgress) {
                    socket.to(roomId).emit('opponentDisconnected');
                }
                delete rooms[roomId]; // Clean up the room
                console.log(`Room ${roomId} closed.`);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});