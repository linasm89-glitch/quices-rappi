require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { validateRappiEmail, getRoleForEmail } = require('./src/authMiddleware');
const roomManager = require('./src/roomManager');
const { generateSessionExport } = require('./src/exportService');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ─── CORS ────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin:
    NODE_ENV === 'development'
      ? true // allow all origins in dev
      : [FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: NODE_ENV === 'development' ? true : [FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── REST Routes ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/sessions — returns all sessions
app.get('/api/sessions', (_req, res) => {
  try {
    const sessions = roomManager.getAllSessions();
    res.json({ sessions });
  } catch (err) {
    console.error('[GET /api/sessions] error:', err);
    res.status(500).json({ error: 'Error al obtener sesiones.' });
  }
});

// GET /api/sessions/:id — returns session JSON
app.get('/api/sessions/:id', (req, res) => {
  try {
    const session = roomManager.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada.' });
    }
    res.json({ session });
  } catch (err) {
    console.error('[GET /api/sessions/:id] error:', err);
    res.status(500).json({ error: 'Error al obtener sesión.' });
  }
});

// GET /api/sessions/:id/export — downloads an Excel file with session analytics
app.get('/api/sessions/:id/export', async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Load analytics (from disk or in-memory)
    const analyticsData = roomManager.getAnalytics(sessionId);
    if (!analyticsData) {
      return res.status(404).json({ error: 'Resultados no encontrados para esta sesión.' });
    }

    // Get session metadata for the filename
    const session = roomManager.getSession(sessionId) || { id: sessionId, name: 'sesion', date: new Date().toISOString().slice(0, 10) };
    const safeName = (session.name || 'sesion')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
    const dateStr = (session.date || new Date().toISOString()).slice(0, 10);

    const sessionData = {
      session: { id: sessionId, name: session.name, date: session.date },
      leaderboard: analyticsData.leaderboard || [],
      questionStats: analyticsData.questionStats || [],
      summary: analyticsData.summary || {},
    };

    const buffer = await generateSessionExport(sessionData);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="training-hour-${safeName}-${dateStr}.xlsx"`
    );
    res.send(buffer);

    console.log(`[export] Excel generated for session: ${sessionId}`);
  } catch (err) {
    console.error('[GET /api/sessions/:id/export] error:', err);
    res.status(500).json({ error: 'Error al generar el archivo de exportación.' });
  }
});

// ─── Static Files (production) ───────────────────────────────────────────────
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Socket.io Events ────────────────────────────────────────────────────────
// Track connected sockets by userId for reconnection handling
const connectedUsers = new Map(); // userId → socket.id

// Track active auto-reveal timers per session
const sessionTimers = new Map(); // sessionId → timeout handle

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── auth:login ──────────────────────────────────────────────────────────
  socket.on('auth:login', ({ name, email } = {}) => {
    try {
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        socket.emit('auth:error', { message: 'Nombre inválido. Mínimo 2 caracteres.' });
        return;
      }

      if (!validateRappiEmail(email)) {
        socket.emit('auth:error', { message: 'Correo inválido. Debe ser @rappi.com' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const role = getRoleForEmail(normalizedEmail, ADMIN_EMAILS);
      const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const user = {
        userId,
        name: name.trim(),
        email: normalizedEmail,
        role,
      };

      // Store on socket for later use
      socket.data.user = user;

      // Register in connected users map
      connectedUsers.set(userId, socket.id);

      console.log(`[auth] ${normalizedEmail} logged in as ${role} (${socket.id})`);

      socket.emit('auth:success', user);
    } catch (err) {
      console.error('[auth:login] error:', err);
      socket.emit('auth:error', { message: 'Error interno. Intenta de nuevo.' });
    }
  });

  // ── player:rejoin ───────────────────────────────────────────────────────
  socket.on('player:rejoin', ({ userId, sessionId } = {}) => {
    try {
      if (!userId || !sessionId) return;

      const session = roomManager.getSession(sessionId);
      if (!session) {
        socket.emit('session:not_found', { sessionId });
        return;
      }

      // Update socket mapping
      connectedUsers.set(userId, socket.id);

      // Rejoin room
      socket.join(`session:${sessionId}`);
      socket.emit('session:rejoined', { session });

      console.log(`[rejoin] userId=${userId} rejoined session=${sessionId}`);
    } catch (err) {
      console.error('[player:rejoin] error:', err);
    }
  });

  // ── session:get_all ─────────────────────────────────────────────────────
  socket.on('session:get_all', () => {
    try {
      const sessions = roomManager.getAllSessions();
      socket.emit('session:list', { sessions });
    } catch (err) {
      console.error('[session:get_all] error:', err);
    }
  });

  // ── session:create ──────────────────────────────────────────────────────
  socket.on('session:create', ({ name, date, questions } = {}) => {
    try {
      if (!socket.data.user || socket.data.user.role !== 'admin') {
        socket.emit('session:error', { message: 'No autorizado.' });
        return;
      }

      if (!name || typeof name !== 'string' || name.trim().length < 3) {
        socket.emit('session:error', { message: 'Nombre de sesión inválido.' });
        return;
      }

      const session = roomManager.createSession(
        name.trim(),
        date || new Date().toISOString(),
        questions || []
      );

      socket.emit('session:created', { session });
      console.log(`[session] created: ${session.sessionId} - "${name}"`);
    } catch (err) {
      console.error('[session:create] error:', err);
      socket.emit('session:error', { message: 'Error al crear sesión.' });
    }
  });

  // ── session:join ────────────────────────────────────────────────────────
  socket.on('session:join', ({ sessionId } = {}) => {
    try {
      if (!socket.data.user) {
        socket.emit('session:error', { message: 'No autenticado.' });
        return;
      }

      const session = roomManager.getSession(sessionId);
      if (!session) {
        socket.emit('session:error', { message: 'Sesión no encontrada.' });
        return;
      }

      const { userId, name, role } = socket.data.user;

      roomManager.addParticipant(sessionId, userId, {
        userId,
        name,
        role,
        socketId: socket.id,
        joinedAt: new Date().toISOString(),
        score: 0,
      });

      socket.join(`session:${sessionId}`);

      const participantCount = roomManager.getParticipantCount(sessionId);

      // Notify room of new participant
      io.to(`session:${sessionId}`).emit('session:participant_joined', {
        userId,
        name,
        role,
        participantCount,
      });

      socket.emit('session:joined', { session, participantCount });

      console.log(`[session] ${name} joined ${sessionId} (total: ${participantCount})`);
    } catch (err) {
      console.error('[session:join] error:', err);
      socket.emit('session:error', { message: 'Error al unirse a la sesión.' });
    }
  });

  // ── admin:save_session — create or update ───────────────────────────────
  socket.on('admin:save_session', ({ session: sessionData } = {}) => {
    try {
      if (!socket.data.user || socket.data.user.role !== 'admin') {
        socket.emit('session:error', { message: 'No autorizado.' });
        return;
      }

      if (!sessionData || typeof sessionData !== 'object') {
        socket.emit('session:error', { message: 'Datos de sesión inválidos.' });
        return;
      }

      const { id, name, date, questions } = sessionData;

      if (!name || typeof name !== 'string' || name.trim().length < 3) {
        socket.emit('session:error', { message: 'El nombre de la sesión debe tener al menos 3 caracteres.' });
        return;
      }

      if (!date) {
        socket.emit('session:error', { message: 'La fecha es requerida.' });
        return;
      }

      let savedSession;

      if (id) {
        // Update existing session
        savedSession = roomManager.updateSession(id, {
          name: name.trim(),
          date,
          questions: questions || [],
        });

        if (!savedSession) {
          socket.emit('session:error', { message: 'Sesión no encontrada.' });
          return;
        }

        console.log(`[session] updated: ${id} - "${name}"`);
      } else {
        // Create new session
        savedSession = roomManager.createSession(
          name.trim(),
          date,
          questions || []
        );
        console.log(`[session] created: ${savedSession.id} - "${name}"`);
      }

      socket.emit('session:saved', { session: savedSession });
    } catch (err) {
      console.error('[admin:save_session] error:', err);
      socket.emit('session:error', { message: 'Error al guardar la sesión.' });
    }
  });

  // ── admin:delete_session ─────────────────────────────────────────────────
  socket.on('admin:delete_session', ({ sessionId } = {}) => {
    try {
      if (!socket.data.user || socket.data.user.role !== 'admin') {
        socket.emit('session:error', { message: 'No autorizado.' });
        return;
      }

      if (!sessionId) {
        socket.emit('session:error', { message: 'sessionId requerido.' });
        return;
      }

      const deleted = roomManager.deleteSession(sessionId);

      if (!deleted) {
        socket.emit('session:error', { message: 'Sesión no encontrada.' });
        return;
      }

      socket.emit('session:deleted', { sessionId });
      console.log(`[session] deleted: ${sessionId}`);
    } catch (err) {
      console.error('[admin:delete_session] error:', err);
      socket.emit('session:error', { message: 'Error al eliminar la sesión.' });
    }
  });

  // ── admin:get_session ────────────────────────────────────────────────────
  socket.on('admin:get_session', ({ sessionId } = {}) => {
    try {
      if (!sessionId) {
        socket.emit('session:error', { message: 'sessionId requerido.' });
        return;
      }

      const session = roomManager.getSession(sessionId);

      if (!session) {
        socket.emit('session:error', { message: 'Sesión no encontrada.' });
        return;
      }

      socket.emit('session:detail', { session });
    } catch (err) {
      console.error('[admin:get_session] error:', err);
      socket.emit('session:error', { message: 'Error al obtener la sesión.' });
    }
  });

  // ── trainer:start_session ───────────────────────────────────────────────
  socket.on('trainer:start_session', ({ sessionId } = {}) => {
    try {
      if (!socket.data.user || !['admin', 'trainer'].includes(socket.data.user.role)) {
        socket.emit('session:error', { message: 'No autorizado.' });
        return;
      }
      if (!sessionId) {
        socket.emit('session:error', { message: 'sessionId requerido.' });
        return;
      }

      const session = roomManager.startSession(sessionId);
      if (!session) {
        socket.emit('session:error', { message: 'Sesión no encontrada.' });
        return;
      }

      // Make sure trainer is in the room
      socket.join(`session:${sessionId}`);

      io.to(`session:${sessionId}`).emit('game:start', { session });
      console.log(`[game] session started: ${sessionId} by ${socket.data.user.email}`);
    } catch (err) {
      console.error('[trainer:start_session] error:', err);
      socket.emit('session:error', { message: 'Error al iniciar sesión.' });
    }
  });

  // ── trainer:next_question ────────────────────────────────────────────────
  socket.on('trainer:next_question', ({ sessionId } = {}) => {
    try {
      if (!socket.data.user || !['admin', 'trainer'].includes(socket.data.user.role)) {
        socket.emit('session:error', { message: 'No autorizado.' });
        return;
      }
      if (!sessionId) return;

      // Clear any existing auto-reveal timer
      if (sessionTimers.has(sessionId)) {
        clearTimeout(sessionTimers.get(sessionId));
        sessionTimers.delete(sessionId);
      }

      const result = roomManager.nextQuestion(sessionId);
      if (!result) {
        socket.emit('game:error', { message: 'No hay más preguntas.' });
        return;
      }

      io.to(`session:${sessionId}`).emit('game:question', result);

      // Auto-reveal after 20 seconds if still in question phase
      const timer = setTimeout(() => {
        sessionTimers.delete(sessionId);
        if (roomManager.getPhase(sessionId) === 'question') {
          const revealData = roomManager.getRevealData(sessionId);
          if (revealData) {
            io.to(`session:${sessionId}`).emit('game:reveal', revealData);
            console.log(`[game] auto-reveal for session: ${sessionId}`);
          }
        }
      }, 20000);

      sessionTimers.set(sessionId, timer);
      console.log(`[game] next question for session: ${sessionId} (index: ${result.questionIndex})`);
    } catch (err) {
      console.error('[trainer:next_question] error:', err);
    }
  });

  // ── trainer:reveal ───────────────────────────────────────────────────────
  socket.on('trainer:reveal', ({ sessionId } = {}) => {
    try {
      if (!socket.data.user || !['admin', 'trainer'].includes(socket.data.user.role)) {
        socket.emit('session:error', { message: 'No autorizado.' });
        return;
      }
      if (!sessionId) return;

      // Clear auto-reveal timer
      if (sessionTimers.has(sessionId)) {
        clearTimeout(sessionTimers.get(sessionId));
        sessionTimers.delete(sessionId);
      }

      const revealData = roomManager.getRevealData(sessionId);
      if (!revealData) {
        socket.emit('game:error', { message: 'No se pudo obtener los datos de revelación.' });
        return;
      }

      io.to(`session:${sessionId}`).emit('game:reveal', revealData);
      console.log(`[game] manual reveal for session: ${sessionId}`);
    } catch (err) {
      console.error('[trainer:reveal] error:', err);
    }
  });

  // ── trainer:end_session ──────────────────────────────────────────────────
  socket.on('trainer:end_session', ({ sessionId } = {}) => {
    try {
      if (!socket.data.user || !['admin', 'trainer'].includes(socket.data.user.role)) {
        socket.emit('session:error', { message: 'No autorizado.' });
        return;
      }
      if (!sessionId) return;

      // Clear any active timer
      if (sessionTimers.has(sessionId)) {
        clearTimeout(sessionTimers.get(sessionId));
        sessionTimers.delete(sessionId);
      }

      const analyticsData = roomManager.endSession(sessionId);
      if (!analyticsData) {
        socket.emit('game:error', { message: 'Sesión no encontrada.' });
        return;
      }

      // Send leaderboard to all players in the room
      io.to(`session:${sessionId}`).emit('game:end', { leaderboard: analyticsData.leaderboard });
      console.log(`[game] session ended: ${sessionId}`);
    } catch (err) {
      console.error('[trainer:end_session] error:', err);
    }
  });

  // ── game:answer (player submits answer) ─────────────────────────────────
  socket.on('game:answer', ({ sessionId, selectedOptionId } = {}) => {
    try {
      if (!socket.data.user) {
        socket.emit('game:error', { message: 'No autenticado.' });
        return;
      }
      if (!sessionId || !selectedOptionId) return;

      const { userId } = socket.data.user;
      const timerStartedAt = roomManager.getTimerStartedAt(sessionId);
      const responseTimeMs = timerStartedAt ? Date.now() - timerStartedAt : 0;

      const result = roomManager.recordAnswer(sessionId, userId, selectedOptionId, responseTimeMs);
      if (!result) {
        // Already answered or timer expired — silently ignore
        return;
      }

      // Acknowledge to the answering player only
      socket.emit('game:answer_ack', result);

      // Broadcast live stats to whole room
      const answeredCount = roomManager.getAnsweredCount(sessionId);
      const session = roomManager.getSession(sessionId);
      const totalPlayers = session
        ? (session.participants || []).filter((p) => p.role === 'player').length
        : 0;

      io.to(`session:${sessionId}`).emit('game:live_stats', { answeredCount, totalPlayers });
    } catch (err) {
      console.error('[game:answer] error:', err);
    }
  });

  // ── admin:get_results ────────────────────────────────────────────────────
  socket.on('admin:get_results', ({ sessionId } = {}) => {
    try {
      if (!socket.data.user || socket.data.user.role !== 'admin') {
        socket.emit('session:error', { message: 'No autorizado.' });
        return;
      }

      if (!sessionId) {
        socket.emit('session:error', { message: 'sessionId requerido.' });
        return;
      }

      const analyticsData = roomManager.getAnalytics(sessionId);

      if (!analyticsData) {
        socket.emit('session:error', { message: 'No se encontraron resultados para esta sesión.' });
        return;
      }

      socket.emit('session:results', { analyticsData });
      console.log(`[analytics] results sent for session: ${sessionId}`);
    } catch (err) {
      console.error('[admin:get_results] error:', err);
      socket.emit('session:error', { message: 'Error al obtener resultados.' });
    }
  });

  // ── disconnect ──────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    const user = socket.data.user;
    if (user) {
      console.log(`[socket] disconnected: ${user.email} (${socket.id}) - reason: ${reason}`);

      // Clean up from connected users map only if this is the current socket
      if (connectedUsers.get(user.userId) === socket.id) {
        connectedUsers.delete(user.userId);
      }
    } else {
      console.log(`[socket] disconnected: ${socket.id} - reason: ${reason}`);
    }
  });

  // ── error handling ──────────────────────────────────────────────────────
  socket.on('error', (err) => {
    console.error(`[socket] error on ${socket.id}:`, err);
  });
});

// ─── Express Error Handling ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[express] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`[server] The Training Hour backend running on port ${PORT}`);
  console.log(`[server] Environment: ${NODE_ENV}`);
  console.log(`[server] Frontend URL: ${FRONTEND_URL}`);
  console.log(`[server] Admin emails: ${ADMIN_EMAILS.join(', ') || '(none)'}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
});
