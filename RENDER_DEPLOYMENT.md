# 🚀 Render.com Deployment Guide for Connect Four Pro

This guide will help you deploy your Connect Four multiplayer game to Render.com, making it accessible to players worldwide with a free hosting solution.

## 📋 Prerequisites

- Git repository with your Connect Four code (GitHub, GitLab, or Bitbucket)
- Render.com account (free signup at [render.com](https://render.com))
- Basic familiarity with git commands

## 🏗️ Step 1: Prepare Your Repository

### 1.1 Verify Package.json
Ensure your `package.json` has the correct start script:

```json
{
  "name": "connect-four-pro",
  "version": "2.0.0",
  "description": "Multiplayer Connect Four game with real-time features",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "nanoid": "^3.3.6"
  }
}
```

### 1.2 Environment Port Configuration
Your `server.js` should use the environment PORT:

```javascript
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
```

### 1.3 Push to Git Repository
Make sure your latest code is pushed to your git repository:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## 🌐 Step 2: Deploy on Render.com

### 2.1 Create Render Account
1. Visit [render.com](https://render.com)
2. Sign up using GitHub, GitLab, or email
3. Verify your account if required

### 2.2 Create New Web Service
1. **Dashboard**: Click "New +" button in the top right
2. **Select Service Type**: Choose "Web Service"
3. **Connect Repository**: 
   - If first time: Connect your GitHub/GitLab account
   - Select your Connect Four repository from the list

### 2.3 Configure Service Settings

Fill in the following configuration:

```
🔧 Basic Settings:
Name: connect-four-pro (or your preferred name)
Region: Oregon (US West) or choose closest to your users
Branch: main (or your default branch)

🛠️ Build & Deploy:
Runtime: Node
Root Directory: (leave blank if code is in root)
Build Command: npm install
Start Command: npm start

💰 Instance Type:
Free (perfect for hobby projects and testing)
```

### 2.4 Environment Variables (Optional)
Click "Advanced" if you need to set environment variables:

```
NODE_ENV=production
```

Note: Render automatically provides the `PORT` environment variable, so don't set it manually.

### 2.5 Deploy
1. Click "Create Web Service"
2. Render will start building your application
3. Watch the build logs for any errors
4. Wait for "Your service is live" message

## ✅ Step 3: Access Your Deployed Game

### 3.1 Get Your URL
Once deployed, your game will be available at:
```
https://your-app-name.onrender.com
```

### 3.2 Test Multiplayer Functionality
1. **Create Game**: Open the URL and create an online game
2. **Join from Another Device**: Use the room code to join from a different browser/device
3. **Test Features**: 
   - Player name collection
   - Real-time gameplay
   - Reaction system
   - Rematch functionality

## 🔧 Step 4: Configure Custom Domain (Optional)

### 4.1 Free Render Domain
Your app automatically gets a free `.onrender.com` subdomain.

### 4.2 Custom Domain (Paid Plans)
For custom domains like `connectfour.yourdomain.com`:
1. Upgrade to a paid Render plan
2. Go to Settings → Custom Domains
3. Add your domain and configure DNS records

## 📊 Step 5: Monitor Your Application

### 5.1 Render Dashboard Features
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, and response times
- **Deploys**: Track deployment history
- **Settings**: Modify configuration without redeploying

### 5.2 Automatic Deployments
Render automatically redeploys your app when you push to the connected git branch:

```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push origin main
# Render automatically starts redeployment
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Build Fails
```
Error: Cannot find module 'xyz'
```
**Solution**: Ensure all dependencies are in `package.json`:
```bash
npm install missing-package --save
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push origin main
```

#### Service Won't Start
```
Error: Cannot bind to port
```
**Solution**: Make sure your server uses `process.env.PORT`:
```javascript
const PORT = process.env.PORT || 3000;
```

#### Socket.IO Connection Issues
```
WebSocket connection failed
```
**Solution**: Render supports WebSockets by default. Check your Socket.IO client configuration:
```javascript
const socket = io(); // Automatically uses current domain
```

#### App Sleeps on Free Plan
Free tier apps sleep after 15 minutes of inactivity.
**Solutions**:
- Upgrade to paid plan for always-on service
- Use a monitoring service to ping your app
- Inform users about potential initial loading delay

## 💡 Performance Tips

### 5.1 Optimize for Production
Add compression middleware to your server:

```javascript
const compression = require('compression');
app.use(compression());
```

### 5.2 Implement Health Checks
Add a health check endpoint:

```javascript
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

### 5.3 Enable Logging
Use structured logging for better monitoring:

```javascript
console.log(`[${new Date().toISOString()}] Server started on port ${PORT}`);
```

## 📈 Scaling Options

### Free Tier Limitations
- 512 MB RAM
- 0.1 CPU
- Sleeps after 15min inactivity
- 750 hours/month

### Paid Plans Benefits
- Always-on service
- More resources
- Custom domains
- Priority support
- Advanced metrics

## 🎯 Next Steps

After successful deployment:

1. **Share Your Game**: Send the Render URL to friends
2. **Monitor Usage**: Check Render dashboard for player activity
3. **Gather Feedback**: Test with multiple players
4. **Iterate**: Continue adding features and deploying updates

## 🆘 Getting Help

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Support**: Available through Render dashboard

---

## 🎉 Congratulations!

Your Connect Four Pro game is now live and accessible worldwide! Players can enjoy multiplayer games with real-time reactions and rematch functionality from any device with an internet connection.

**Your deployment URL**: `https://your-app-name.onrender.com`

Share this URL with friends and family to start playing Connect Four online!
