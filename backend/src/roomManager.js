/**
 * roomManager.js
 * In-memory game state manager with JSON file persistence.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { computeAnalytics, saveResults, loadResults } = require('./analyticsService');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

class RoomManager {
  constructor() {
    /** @type {Map<string, SessionState>} */
    this.sessions = new Map();
    this._ensureDataDir();
    this._loadFromDisk();
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  _ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`[roomManager] Created data directory: ${DATA_DIR}`);
    }
  }

  _loadFromDisk() {
    if (!fs.existsSync(SESSIONS_FILE)) {
      console.log('[roomManager] No sessions file found, starting fresh.');
      return;
    }

    try {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        for (const session of parsed) {
          // Re-hydrate participants as a Map
          if (session.participants && typeof session.participants === 'object' && !Array.isArray(session.participants)) {
            session.participants = new Map(Object.entries(session.participants));
          } else {
            session.participants = new Map();
          }
          // Support both old (sessionId) and new (id) key
          const key = session.id || session.sessionId;
          if (key) {
            this.sessions.set(key, session);
          }
        }
        console.log(`[roomManager] Loaded ${this.sessions.size} session(s) from disk.`);
      }
    } catch (err) {
      console.error('[roomManager] Failed to load sessions from disk:', err.message);
    }
  }

  _saveToDisk() {
    try {
      const sessionsArray = Array.from(this.sessions.values()).map((session) => {
        // Exclude runtime-only fields (responses Map, timerTimeout handle)
        const { responses, timerTimeout, ...rest } = session;
        return {
          ...rest,
          // Serialize participants Map to plain object for JSON
          participants: Object.fromEntries(session.participants),
        };
      });

      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsArray, null, 2), 'utf-8');
    } catch (err) {
      console.error('[roomManager] Failed to save sessions to disk:', err.message);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Creates a new quiz session.
   * @param {string} name - Display name for the session
   * @param {string} date - YYYY-MM-DD string
   * @param {Array} questions - Array of question objects
   * @returns {object} serialized session
   */
  createSession(name, date, questions = []) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const session = {
      id,
      name,
      date: date || now.slice(0, 10),
      questions: this._normalizeQuestions(questions),
      status: 'draft',
      participants: new Map(),
      scores: {},
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, session);
    this._saveToDisk();

    return this._serializeSession(session);
  }

  /**
   * Updates an existing session.
   * @param {string} sessionId
   * @param {{ name?: string, date?: string, questions?: Array, status?: string }} updates
   * @returns {object|null} serialized session or null if not found
   */
  updateSession(sessionId, updates = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (updates.name !== undefined) session.name = updates.name;
    if (updates.date !== undefined) session.date = updates.date;
    if (updates.status !== undefined) session.status = updates.status;
    if (updates.questions !== undefined) {
      session.questions = this._normalizeQuestions(updates.questions);
    }

    session.updatedAt = new Date().toISOString();
    this._saveToDisk();

    return this._serializeSession(session);
  }

  /**
   * Retrieves a session by ID. Supports both 'id' and legacy 'sessionId' key.
   * @param {string} sessionId
   * @returns {object | null}
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return this._serializeSession(session);
  }

  /**
   * Returns all sessions as a plain array, sorted by date descending.
   * @returns {object[]}
   */
  getAllSessions() {
    return Array.from(this.sessions.values())
      .map((s) => this._serializeSession(s))
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt).getTime();
        const dateB = new Date(b.date || b.createdAt).getTime();
        return dateB - dateA;
      });
  }

  /**
   * Deletes a session entirely.
   * @param {string} sessionId
   * @returns {boolean}
   */
  deleteSession(sessionId) {
    const existed = this.sessions.delete(sessionId);
    if (existed) this._saveToDisk();
    return existed;
  }

  /**
   * Adds or updates a participant in a session.
   * @param {string} sessionId
   * @param {string} userId
   * @param {object} participantData
   * @returns {boolean} success
   */
  addParticipant(sessionId, userId, participantData) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.participants.set(userId, {
      ...participantData,
      userId,
      joinedAt: participantData.joinedAt || new Date().toISOString(),
      score: participantData.score ?? 0,
    });

    session.updatedAt = new Date().toISOString();
    this._saveToDisk();
    return true;
  }

  /**
   * Removes a participant from a session.
   * @param {string} sessionId
   * @param {string} userId
   * @returns {boolean} success
   */
  removeParticipant(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const existed = session.participants.delete(userId);
    if (existed) {
      session.updatedAt = new Date().toISOString();
      this._saveToDisk();
    }
    return existed;
  }

  /**
   * Returns the number of participants in a session.
   * @param {string} sessionId
   * @returns {number}
   */
  getParticipantCount(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;
    return session.participants.size;
  }

  /**
   * Updates the phase of a session.
   * @param {string} sessionId
   * @param {'lobby'|'question'|'reveal'|'ended'} phase
   * @returns {boolean} success
   */
  setSessionPhase(sessionId, phase) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.phase = phase;
    session.updatedAt = new Date().toISOString();
    this._saveToDisk();
    return true;
  }

  /**
   * Updates a participant's score.
   * @param {string} sessionId
   * @param {string} userId
   * @param {number} points - Points to ADD to current score
   * @returns {number} new total score, or -1 if not found
   */
  addScore(sessionId, userId, points) {
    const session = this.sessions.get(sessionId);
    if (!session) return -1;

    const participant = session.participants.get(userId);
    if (!participant) return -1;

    participant.score = (participant.score || 0) + points;
    session.scores[userId] = participant.score;
    session.updatedAt = new Date().toISOString();
    this._saveToDisk();
    return participant.score;
  }

  /**
   * Returns the leaderboard for a session, sorted by score descending.
   * @param {string} sessionId
   * @returns {Array<{userId, name, score, rank}>}
   */
  getLeaderboard(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const participants = Array.from(session.participants.values());
    const sorted = participants
      .filter((p) => p.role === 'player')
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    return sorted.map((p, index) => ({
      userId: p.userId,
      name: p.name,
      score: p.score || 0,
      rank: index + 1,
    }));
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  /**
   * Normalizes and validates an array of questions into the Phase 2 schema.
   * @param {Array} questions
   * @returns {Array}
   */
  _normalizeQuestions(questions) {
    if (!Array.isArray(questions)) return [];
    return questions.map((q, index) => ({
      id: q.id || uuidv4(),
      order: typeof q.order === 'number' ? q.order : index,
      title: q.title || q.text || '',
      options: Array.isArray(q.options) && q.options.length === 4
        ? q.options.map((opt) => ({
            id: opt.id || opt.key || String.fromCharCode(97 + index),
            text: opt.text || opt.label || '',
          }))
        : [
            { id: 'a', text: '' },
            { id: 'b', text: '' },
            { id: 'c', text: '' },
            { id: 'd', text: '' },
          ],
      correctOptionId: q.correctOptionId || q.correctOption || 'a',
      feedback: q.feedback || '',
    }));
  }

  // ─── Game Runtime Methods ─────────────────────────────────────────────────

  /**
   * Starts a session: sets status='live', resets scores & responses, initializes game state.
   * @param {string} sessionId
   * @returns {object|null} serialized session or null
   */
  startSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.status = 'live';
    session.phase = 'lobby';
    session.currentQuestionIndex = -1;
    session.timerStartedAt = null;
    session.timerTimeout = null;
    // Reset all scores
    session.scores = {};
    for (const [, participant] of session.participants) {
      participant.score = 0;
      participant.correctAnswers = 0;
      participant.responseTimes = [];
    }
    // responses: Map of questionId → Map(userId → response)
    session.responses = new Map();

    session.updatedAt = new Date().toISOString();
    this._saveToDisk();

    return this._serializeSession(session);
  }

  /**
   * Advances to next question.
   * @param {string} sessionId
   * @returns {{ question, questionIndex, totalQuestions, timerStartedAt }|null}
   */
  nextQuestion(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= session.questions.length) return null;

    session.currentQuestionIndex = nextIndex;
    session.timerStartedAt = Date.now();
    session.phase = 'question';
    session.updatedAt = new Date().toISOString();
    this._saveToDisk();

    const q = session.questions[nextIndex];
    // Strip correctOptionId and feedback from the question sent to clients
    const questionForClients = {
      id: q.id,
      order: q.order,
      title: q.title,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    };

    return {
      question: questionForClients,
      questionIndex: nextIndex,
      totalQuestions: session.questions.length,
      timerStartedAt: session.timerStartedAt,
    };
  }

  /**
   * Records a player's answer.
   * @param {string} sessionId
   * @param {string} userId
   * @param {string} selectedOptionId
   * @param {number} responseTimeMs
   * @returns {{ correct, pointsEarned, totalScore }|null}
   */
  recordAnswer(sessionId, userId, selectedOptionId, responseTimeMs) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.phase !== 'question') return null;

    const QUESTION_TIME_MS = 20 * 1000;
    const MAX_POINTS = 1000;
    const MIN_POINTS = 100;

    // Check timer hasn't expired
    if (!session.timerStartedAt || (Date.now() - session.timerStartedAt) > QUESTION_TIME_MS) {
      return null;
    }

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) return null;

    const questionId = currentQuestion.id;

    // Initialize responses map for this question if needed
    if (!session.responses.has(questionId)) {
      session.responses.set(questionId, new Map());
    }

    const questionResponses = session.responses.get(questionId);

    // Prevent double answers
    if (questionResponses.has(userId)) return null;

    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = Math.max(MIN_POINTS, Math.floor(MAX_POINTS * (1 - responseTimeMs / QUESTION_TIME_MS)));
    }

    questionResponses.set(userId, {
      selectedOptionId,
      responseTimeMs,
      isCorrect,
      pointsEarned,
    });

    // Update participant score
    const participant = session.participants.get(userId);
    if (participant) {
      participant.score = (participant.score || 0) + pointsEarned;
      if (isCorrect) {
        participant.correctAnswers = (participant.correctAnswers || 0) + 1;
      }
      if (!participant.responseTimes) participant.responseTimes = [];
      participant.responseTimes.push(responseTimeMs);
      session.scores[userId] = participant.score;
    }

    session.updatedAt = new Date().toISOString();

    const totalScore = participant ? participant.score : 0;
    return { correct: isCorrect, pointsEarned, totalScore };
  }

  /**
   * Computes reveal data for current question.
   * @param {string} sessionId
   * @returns {{ correctOptionId, feedback, answerStats, leaderboard }|null}
   */
  getRevealData(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) return null;

    session.phase = 'reveal';
    session.updatedAt = new Date().toISOString();
    this._saveToDisk();

    const questionId = currentQuestion.id;
    const questionResponses = session.responses.get(questionId) || new Map();

    // Compute answer stats
    const counts = { a: 0, b: 0, c: 0, d: 0 };
    for (const [, resp] of questionResponses) {
      const key = resp.selectedOptionId?.toLowerCase();
      if (key in counts) counts[key]++;
    }
    const total = questionResponses.size;
    const answerStats = {
      a: total > 0 ? Math.round((counts.a / total) * 100) : 0,
      b: total > 0 ? Math.round((counts.b / total) * 100) : 0,
      c: total > 0 ? Math.round((counts.c / total) * 100) : 0,
      d: total > 0 ? Math.round((counts.d / total) * 100) : 0,
      total,
    };

    const leaderboard = this.getLeaderboard(sessionId).slice(0, 10);

    return {
      correctOptionId: currentQuestion.correctOptionId,
      feedback: currentQuestion.feedback || '',
      answerStats,
      leaderboard,
    };
  }

  /**
   * Ends the session, computes analytics, persists them, and returns full analyticsData.
   * @param {string} sessionId
   * @returns {object|null} analyticsData (leaderboard, questionStats, summary)
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.status = 'ended';
    session.phase = 'ended';
    session.updatedAt = new Date().toISOString();
    this._saveToDisk();

    // Compute full analytics
    const analyticsData = computeAnalytics(session);

    // Persist to disk so results survive server restarts
    saveResults(sessionId, analyticsData);

    return analyticsData;
  }

  /**
   * Retrieves analytics for a session.
   * First tries persisted results on disk; falls back to computing from in-memory session.
   * @param {string} sessionId
   * @returns {object|null} analyticsData or null
   */
  getAnalytics(sessionId) {
    // Try disk first
    const persisted = loadResults(sessionId);
    if (persisted) return persisted;

    // Fall back to in-memory computation
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return computeAnalytics(session);
  }

  /**
   * Returns the timerStartedAt for a session (used by server to compute responseTimeMs).
   * @param {string} sessionId
   * @returns {number|null}
   */
  getTimerStartedAt(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return session.timerStartedAt;
  }

  /**
   * Returns the current phase of a session.
   * @param {string} sessionId
   * @returns {string|null}
   */
  getPhase(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return session.phase;
  }

  /**
   * Returns count of players who answered current question (for live stats).
   * @param {string} sessionId
   * @returns {number}
   */
  getAnsweredCount(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;
    const q = session.questions[session.currentQuestionIndex];
    if (!q) return 0;
    const qResponses = session.responses.get(q.id);
    return qResponses ? qResponses.size : 0;
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  /**
   * Converts a session (with Map participants) to a plain object safe for JSON/emit.
   * Excludes runtime-only fields (responses, timerTimeout).
   * @param {SessionState} session
   * @returns {object}
   */
  _serializeSession(session) {
    const { responses, timerTimeout, ...rest } = session;
    return {
      ...rest,
      participants: Array.from(session.participants.values()),
      participantCount: session.participants.size,
    };
  }
}

// Export singleton instance
const roomManager = new RoomManager();
module.exports = roomManager;
