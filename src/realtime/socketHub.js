// src/realtime/socketHub.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// userId -> Set<socketId>
const userSockets = new Map();
let io = null;

export function initSocket(server, { allowedOrigins }) {
io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS for Socket.IO'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});


  io.use((socket, next) => {
    try {
      // Accept either: 1) Bearer token header OR 2) query.token
      const auth = socket.handshake.auth || {};
      const token = auth?.token || socket.handshake.query?.token;
      if (!token) return next(); // allow anonymous, but we only map if valid

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded._id || decoded.id || decoded.userId;
      next();
    } catch (e) {
      // Don’t block connection entirely; just won’t map user
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    if (userId) {
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);
    }

    socket.on("registerUser", (uid) => {
      // Fallback for apps that emit explicit userId
      const id = uid || userId;
      if (!id) return;
      if (!userSockets.has(id)) userSockets.set(id, new Set());
      userSockets.get(id).add(socket.id);
    });

    socket.on("disconnect", () => {
      if (!userId) return;
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }
    });
  });
}

export function pushAlert(userId, event, payload) {
  if (!io || !userId) return;
  const sockets = userSockets.get(String(userId));
  if (!sockets || sockets.size === 0) return;
  for (const sid of sockets) {
    io.to(sid).emit(event, payload);
  }
}
