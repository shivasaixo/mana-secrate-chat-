const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const SECRET_PASS = process.env.SECRET_PASS || 'VivoX200';
const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_ORIGIN || '*';

app.use(cors({ origin: allowedOrigin }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'telugu-secret-chat' }));

const io = new Server(server, {
  cors: { origin: allowedOrigin, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e6
});

function validRoomId(roomId) {
  return typeof roomId === 'string' && /^[a-zA-Z0-9_-]{6,80}$/.test(roomId);
}

function emitRoomError(socket, message) {
  socket.emit('room-error', { message });
}

io.on('connection', (socket) => {
  socket.on('create-room', ({ password } = {}) => {
    if (password !== SECRET_PASS) {
      emitRoomError(socket, 'Wrong password or invalid room details.');
      return;
    }
    socket.emit('room-created', { roomId: randomUUID().replace(/-/g, '').slice(0, 12) });
  });

  socket.on('join-room', ({ roomId, password, peerId } = {}) => {
    if (password !== SECRET_PASS) {
      emitRoomError(socket, 'Wrong password or invalid room details.');
      return;
    }
    if (!validRoomId(roomId)) {
      emitRoomError(socket, 'Room code correct ga enter cheyyi.');
      return;
    }
    const existing = io.sockets.adapter.rooms.get(roomId);
    if (existing && existing.size >= 2 && !existing.has(socket.id)) {
      emitRoomError(socket, 'Room full mawa! Max 2 lovers only.');
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.peerId = typeof peerId === 'string' ? peerId : null;
    const members = [...(io.sockets.adapter.rooms.get(roomId) || [])]
      .map((id) => io.sockets.sockets.get(id))
      .filter(Boolean)
      .map((member) => ({ socketId: member.id, peerId: member.data.peerId }));

    socket.emit('access-granted', { roomId, members });
    socket.to(roomId).emit('partner-joined', { peerId: socket.data.peerId });
  });

  socket.on('send-msg', ({ message, type = 'text', action, soundId, burnAfterReading = false } = {}) => {
    const roomId = socket.data.roomId;
    if (!roomId || typeof message !== 'string' || message.length > 2000) return;
    io.to(roomId).emit('receive-msg', {
      id: randomUUID(),
      message,
      type,
      action,
      soundId: typeof soundId === 'string' ? soundId : 'received',
      burnAfterReading: Boolean(burnAfterReading),
      sender: socket.id,
      createdAt: Date.now()
    });
  });

  socket.on('typing', (isTyping) => {
    if (socket.data.roomId) socket.to(socket.data.roomId).emit('partner-typing', Boolean(isTyping));
  });

  socket.on('send-heartbeat', ({ rhythm = [80, 80, 160] } = {}) => {
    if (socket.data.roomId) socket.to(socket.data.roomId).emit('receive-heartbeat', { rhythm });
  });

  socket.on('update-mood', ({ mood } = {}) => {
    if (socket.data.roomId && typeof mood === 'string') socket.to(socket.data.roomId).emit('receive-mood', { mood });
  });

  socket.on('doodle', ({ points } = {}) => {
    if (socket.data.roomId && Array.isArray(points) && points.length < 1000) {
      socket.to(socket.data.roomId).emit('doodle', { points });
    }
  });

  socket.on('disconnecting', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-left', 'Partner exit ayyaru 💔');
  });
});

if (process.env.SERVE_CLIENT === 'true') {
  const clientDist = path.join(__dirname, 'client', 'dist');
  app.use(express.static(clientDist));
  app.use((_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

server.listen(PORT, () => console.log(`Secret Chat backend running on port ${PORT}`));
