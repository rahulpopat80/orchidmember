// Orchid Heights - Optional Real-Time Sync Backend Server
// To run this server:
// 1. Install Node.js
// 2. Run: npm install express socket.io
// 3. Run: node server.js
// 4. Open http://localhost:3000 in your browser or http://[your-local-ip]:3000 on mobile devices!

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static frontend files from current directory
app.use(express.static(__dirname));

// WebSocket Communication Room
io.on('connection', (socket) => {
  console.log(`📱 Device connected: ${socket.id}`);

  // Broadcast visitor request from Security to all connected flats
  socket.on('VISITOR_REQUEST', (data) => {
    console.log(`🔔 Visitor Request for Flat ${data.flatNo}: ${data.name}`);
    socket.broadcast.emit('VISITOR_REQUEST', data);
  });

  // Broadcast visitor approval/rejection from Flat Member to Security and other members
  socket.on('VISITOR_RESPONSE', (data) => {
    console.log(`✅ Visitor Response for Flat ${data.flatNo} [Req: ${data.id}]: ${data.status}`);
    socket.broadcast.emit('VISITOR_RESPONSE', data);
  });

  // Broadcast cancel / alarm stop signal
  socket.on('ALARM_STOP', (data) => {
    console.log(`🔕 Alarm Stop for Flat ${data.flatNo} [Req: ${data.id}]`);
    socket.broadcast.emit('ALARM_STOP', data);
  });

  // Sync security guard flat selection to simulator member tabs
  socket.on('FLAT_SELECTED_BY_SECURITY', (data) => {
    socket.broadcast.emit('FLAT_SELECTED_BY_SECURITY', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Device disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
==================================================================
🚀 Orchid Heights Visitor Management Server is running!
🖥️  Local URL:       http://localhost:${PORT}
📱 Mobile Wi-Fi URL: http://[YOUR-COMPUTER-IP-ADDRESS]:${PORT}
==================================================================
  `);
});
