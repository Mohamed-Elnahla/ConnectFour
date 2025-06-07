# 🔴 Connect Four Pro 🟡

A modern, responsive Connect Four game built with Node.js, Socket.IO, and vanilla JavaScript. Play locally on the same device or challenge friends online across different devices with real-time multiplayer functionality.

![Connect Four Pro](https://img.shields.io/badge/Game-Connect%20Four-blue) ![Node.js](https://img.shields.io/badge/Node.js-v16+-green) ![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-orange) ![Mobile Friendly](https://img.shields.io/badge/Mobile-Friendly-purple)

## ✨ Features

### 🎮 Game Modes
- **Local Play**: Two players on the same device
- **Online Multiplayer**: Real-time gameplay across different devices
- **Cross-Platform**: Works seamlessly on desktop, tablet, and mobile

### 🎨 Modern UI/UX
- **Mobile-First Design**: Optimized for all screen sizes
- **Smooth Animations**: Realistic piece dropping with physics-based animations
- **Visual Feedback**: Winning lines, piece highlighting, and interactive elements
- **Accessibility**: High contrast support, reduced motion options, and keyboard navigation
- **Dark Mode**: Automatic dark mode support based on system preferences

### 🌐 Multiplayer Features
- **Room-Based System**: Create or join games with unique room codes
- **Real-Time Updates**: Instant move synchronization across devices
- **Connection Management**: Graceful handling of disconnections
- **Waiting Lobby**: Visual feedback while waiting for opponents

### 📱 Responsive Design
- **Mobile Optimized**: Touch-friendly interface with minimum 44px touch targets
- **Tablet Ready**: Enhanced layout for medium screens
- **Desktop Enhanced**: Full-featured experience on large screens
- **PWA Ready**: Progressive Web App capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/connect-four-pro.git
   cd connect-four-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode

For development with auto-restart on file changes:
```bash
npm install -g nodemon
nodemon server.js
```

## 🎯 How to Play

### Local Game
1. Click "Local Play" to play on the same device
2. Enter player names (optional)
3. Players take turns dropping pieces by clicking columns
4. First player to connect four pieces wins!

### Online Game
1. **Create a Game**: Click "Create New Game" and share the room code
2. **Join a Game**: Enter a friend's room code and click "Join Game"
3. Wait for your opponent to connect
4. Take turns making moves in real-time

### Game Rules
- Players alternate turns dropping colored pieces
- Pieces fall to the lowest available spot in the selected column
- Win by connecting four pieces horizontally, vertically, or diagonally
- Game ends in a draw if the board fills without a winner

## 🛠️ Technical Stack

### Backend
- **Node.js**: Server runtime environment
- **Express.js**: Web framework for serving static files
- **Socket.IO**: Real-time bidirectional communication
- **nanoid**: Unique room ID generation

### Frontend
- **Vanilla JavaScript**: No frameworks, pure performance
- **CSS Grid**: Modern layout system for the game board
- **CSS Custom Properties**: Theming and responsive design
- **Socket.IO Client**: Real-time communication with server

### Design System
- **Inter Font**: Modern, accessible typography
- **CSS Variables**: Consistent theming and easy customization
- **Mobile-First**: Responsive design approach
- **Accessibility**: WCAG 2.1 compliant design patterns

## 📁 Project Structure

```
connect-four-pro/
├── server.js              # Express server and Socket.IO logic
├── package.json           # Dependencies and scripts
├── README.md             # Project documentation
└── public/               # Client-side files
    ├── index.html        # Main HTML structure
    ├── style.css         # Modern responsive styles
    └── script.js         # Game logic and Socket.IO client
```

## 🎨 Customization

### Colors and Theming
The game uses CSS custom properties for easy theming. Modify the `:root` section in `style.css`:

```css
:root {
    --primary-blue: #2563eb;
    --player1-color: #ef4444;  /* Red player */
    --player2-color: #f59e0b;  /* Yellow player */
    --board-bg: #1e293b;      /* Board background */
    /* ... more variables */
}
```

### Board Size
Adjust the board dimensions by modifying these CSS variables:
```css
:root {
    --board-max-width: min(90vw, 500px);
    --board-gap: clamp(4px, 1.5vw, 8px);
}
```

### Game Logic
Core game logic is in `script.js`:
- `checkForWin()`: Win detection algorithm
- `placePiece()`: Piece placement and animation
- `handleColumnClick()`: Turn management and validation

## 🌐 Deployment

### Local Network
To play across devices on the same network:
1. Find your computer's IP address
2. Start the server: `npm start`
3. Access from other devices: `http://YOUR_IP:3000`

### Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-connect-four-app

# Deploy
git push heroku main
```

#### Netlify/Vercel
For static hosting, you'll need to modify the app to use a hosted Socket.IO service like:
- Socket.IO Cloud
- Pusher
- Ably

#### VPS/Cloud Server
```bash
# Clone on server
git clone https://github.com/yourusername/connect-four-pro.git
cd connect-four-pro
npm install

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "connect-four"
pm2 startup
pm2 save
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for configuration:
```env
PORT=3000
NODE_ENV=production
```

### Server Configuration
Modify `server.js` for custom settings:
```javascript
const PORT = process.env.PORT || 3000;
const io = new Server(server, {
    cors: {
        origin: "*",  // Configure for production
        methods: ["GET", "POST"]
    }
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Or use different port
   PORT=3001 npm start
   ```

2. **Socket Connection Failed**
   - Check firewall settings
   - Verify server is running
   - Try different browser/incognito mode

3. **Mobile Touch Issues**
   - Ensure viewport meta tag is present
   - Check touch event handlers
   - Verify minimum touch target sizes

4. **Game State Sync Issues**
   - Refresh both devices
   - Check network connection
   - Verify Socket.IO events are firing

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Use semantic commit messages
- Test on multiple devices/browsers
- Maintain accessibility standards
- Update documentation for new features

## 📋 Roadmap

### Upcoming Features
- [ ] **AI Opponent**: Single-player mode with difficulty levels
- [ ] **Tournament Mode**: Multi-round competitions
- [ ] **Game Statistics**: Win/loss tracking and player stats
- [ ] **Custom Themes**: User-selectable color schemes
- [ ] **Sound Effects**: Audio feedback for moves and wins
- [ ] **Spectator Mode**: Watch games in progress
- [ ] **Replay System**: Save and replay game sessions
- [ ] **Chat System**: In-game messaging for online play

### Technical Improvements
- [ ] **PWA Features**: Offline play and app installation
- [ ] **Database Integration**: Persistent game history
- [ ] **User Accounts**: Registration and profile system
- [ ] **Game Analytics**: Performance and usage metrics
- [ ] **WebRTC**: Peer-to-peer connections for lower latency
- [ ] **Mobile App**: Native iOS/Android versions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Game Design**: Based on the classic Connect Four by Milton Bradley
- **Typography**: [Inter Font Family](https://rsms.me/inter/) by Rasmus Andersson
- **Icons**: Emoji icons for cross-platform compatibility
- **Inspiration**: Modern web design patterns and mobile-first principles

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/connect-four-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/connect-four-pro/discussions)
- **Email**: your.email@example.com

---

<div align="center">

**[⭐ Star this repo](https://github.com/yourusername/connect-four-pro)** if you found it helpful!

Made with ❤️ for the love of classic games and modern web development

</div>
