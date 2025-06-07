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
    socket.on('createGame', () => {
        const roomId = nanoid(6); // Generate a 6-character unique ID
        rooms[roomId] = {
            players: [{ id: socket.id, playerNumber: 1 }],
            gameBoard: null, // Server could track state, but we'll let clients manage it
        };
        socket.join(roomId);
        socket.emit('gameCreated', { roomId });
        console.log(`Room created: ${roomId} by ${socket.id}`);
    });

    // Join an existing game room
    socket.on('joinGame', ({ roomId }) => {
        const room = rooms[roomId];
        if (room && room.players.length === 1) {
            room.players.push({ id: socket.id, playerNumber: 2 });
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
            
            // Both players are in, start the game
            io.to(roomId).emit('gameStarted', { 
                roomId,
                players: room.players.map(p => p.id) 
            });
        } else {
            socket.emit('error', 'Room is full or does not exist.');
        }
    });

    // Handle a player's move
    socket.on('makeMove', ({ roomId, col }) => {
        // Broadcast the move to the other player in the room
        socket.to(roomId).emit('moveMade', { col });
    });
    
    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Find which room the player was in and notify the other player
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                io.to(roomId).emit('opponentDisconnected');
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