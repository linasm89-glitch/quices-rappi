/**
 * analyticsService.js
 * Pure functions to compute analytics from session runtime data,
 * plus persistence helpers (save/load from disk).
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '..', 'data', 'results');

// ─── Persistence ─────────────────────────────────────────────────────────────

function _ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

/**
 * Saves analytics data for a session to disk.
 * @param {string} sessionId
 * @param {object} analyticsData
 */
function saveResults(sessionId, analyticsData) {
  try {
    _ensureResultsDir();
    const filePath = path.join(RESULTS_DIR, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(analyticsData, null, 2), 'utf-8');
    console.log(`[analyticsService] Saved results for session: ${sessionId}`);
  } catch (err) {
    console.error(`[analyticsService] Failed to save results for ${sessionId}:`, err.message);
  }
}

/**
 * Loads analytics data for a session from disk.
 * @param {string} sessionId
 * @returns {object|null}
 */
function loadResults(sessionId) {
  try {
    const filePath = path.join(RESULTS_DIR, `${sessionId}.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[analyticsService] Failed to load results for ${sessionId}:`, err.message);
    return null;
  }
}

// ─── Analytics Computation ───────────────────────────────────────────────────

/**
 * Computes full analytics from a live session object.
 *
 * session shape (in-memory RoomManager session):
 *   session.id
 *   session.name
 *   session.date
 *   session.participants: Map<userId, { userId, name, email, role, score, correctAnswers, responseTimes[] }>
 *   session.questions: Array<{ id, title, correctOptionId, options: [{id, text}] }>
 *   session.responses: Map<questionId, Map<userId, { selectedOptionId, responseTimeMs, isCorrect, pointsEarned }>>
 *
 * @param {object} session
 * @returns {object} analyticsData
 */
function computeAnalytics(session) {
  if (!session) {
    return _emptyAnalytics();
  }

  const questions = Array.isArray(session.questions) ? session.questions : [];
  const totalQuestions = questions.length;

  // Safely get participants as an iterable
  let participantsMap;
  if (session.participants instanceof Map) {
    participantsMap = session.participants;
  } else if (session.participants && typeof session.participants === 'object') {
    participantsMap = new Map(Object.entries(session.participants));
  } else {
    participantsMap = new Map();
  }

  // Safely get responses as a Map
  let responsesMap;
  if (session.responses instanceof Map) {
    responsesMap = session.responses;
  } else if (session.responses && typeof session.responses === 'object') {
    // Could be a plain object of plain objects (loaded from disk before game)
    responsesMap = new Map();
    for (const [qId, userMap] of Object.entries(session.responses)) {
      if (userMap && typeof userMap === 'object') {
        if (userMap instanceof Map) {
          responsesMap.set(qId, userMap);
        } else {
          responsesMap.set(qId, new Map(Object.entries(userMap)));
        }
      }
    }
  } else {
    responsesMap = new Map();
  }

  // ── Build leaderboard ──────────────────────────────────────────────────────
  const players = Array.from(participantsMap.values()).filter(
    (p) => p.role === 'player'
  );

  const leaderboard = players
    .map((p) => {
      const responseTimes = Array.isArray(p.responseTimes) ? p.responseTimes : [];
      const avgResponseTimeMs =
        responseTimes.length > 0
          ? Math.round(
              responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length
            )
          : 0;

      return {
        userId: p.userId,
        name: p.name || '',
        email: p.email || '',
        totalScore: p.score || 0,
        correctAnswers: p.correctAnswers || 0,
        totalQuestions,
        avgResponseTimeMs,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((entry, index) => ({ rank: index + 1, ...entry }));

  // ── Build per-question stats ───────────────────────────────────────────────
  const questionStats = questions.map((q, questionIndex) => {
    const questionResponses = responsesMap.get(q.id) || new Map();
    const totalAnswers = questionResponses.size;

    let correctCount = 0;
    let totalTimeMs = 0;
    const optionCounts = { a: 0, b: 0, c: 0, d: 0 };

    for (const [, resp] of questionResponses) {
      if (resp.isCorrect) correctCount++;
      totalTimeMs += resp.responseTimeMs || 0;
      const key = (resp.selectedOptionId || '').toLowerCase();
      if (key in optionCounts) optionCounts[key]++;
    }

    const correctPct =
      totalAnswers > 0
        ? Math.round((correctCount / totalAnswers) * 100)
        : 0;

    const avgTimeMs =
      totalAnswers > 0 ? Math.round(totalTimeMs / totalAnswers) : 0;

    // Build option percentages
    const optionPcts = {};
    for (const key of ['a', 'b', 'c', 'd']) {
      optionPcts[key] =
        totalAnswers > 0
          ? Math.round((optionCounts[key] / totalAnswers) * 100)
          : 0;
    }

    return {
      questionIndex,
      questionId: q.id,
      title: q.title || '',
      correctOptionId: q.correctOptionId || 'a',
      correctCount,
      totalAnswers,
      correctPct,
      avgTimeMs,
      optionCounts: optionPcts,
    };
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalParticipants = leaderboard.length;

  const teamAvgScore =
    totalParticipants > 0
      ? Math.round(
          leaderboard.reduce((s, p) => s + p.totalScore, 0) / totalParticipants
        )
      : 0;

  const teamAvgCorrectPct =
    totalParticipants > 0 && totalQuestions > 0
      ? Math.round(
          (leaderboard.reduce((s, p) => s + p.correctAnswers, 0) /
            (totalParticipants * totalQuestions)) *
            100 *
            10
        ) / 10
      : 0;

  // Hardest = lowest correctPct among questions with at least 1 answer
  const answeredQuestions = questionStats.filter((q) => q.totalAnswers > 0);
  let hardestQuestion = null;
  let easiestQuestion = null;

  if (answeredQuestions.length > 0) {
    const sorted = [...answeredQuestions].sort(
      (a, b) => a.correctPct - b.correctPct
    );
    const hardest = sorted[0];
    const easiest = sorted[sorted.length - 1];
    hardestQuestion = {
      title: hardest.title,
      correctPct: hardest.correctPct,
      questionIndex: hardest.questionIndex,
    };
    easiestQuestion = {
      title: easiest.title,
      correctPct: easiest.correctPct,
      questionIndex: easiest.questionIndex,
    };
  } else if (questionStats.length > 0) {
    // No responses at all — pick first and last
    hardestQuestion = {
      title: questionStats[0].title,
      correctPct: 0,
      questionIndex: 0,
    };
    easiestQuestion = {
      title: questionStats[questionStats.length - 1].title,
      correctPct: 0,
      questionIndex: questionStats.length - 1,
    };
  }

  return {
    leaderboard,
    questionStats,
    summary: {
      teamAvgScore,
      teamAvgCorrectPct,
      totalParticipants,
      hardestQuestion,
      easiestQuestion,
    },
  };
}

/**
 * Returns a safe empty analytics object.
 * @returns {object}
 */
function _emptyAnalytics() {
  return {
    leaderboard: [],
    questionStats: [],
    summary: {
      teamAvgScore: 0,
      teamAvgCorrectPct: 0,
      totalParticipants: 0,
      hardestQuestion: null,
      easiestQuestion: null,
    },
  };
}

module.exports = { computeAnalytics, saveResults, loadResults };
