// ─── Brand Colors ──────────────────────────────────────────────────────────
export const RAPPI_ORANGE      = '#FF441F'
export const RAPPI_ORANGE_DARK = '#CC3518'
export const RAPPI_ORANGE_LIGHT = '#FF6E4D'

// ─── Socket Events ─────────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  // Auth
  AUTH_LOGIN:   'auth:login',
  AUTH_SUCCESS: 'auth:success',
  AUTH_ERROR:   'auth:error',

  // Session management
  SESSION_GET_ALL:          'session:get_all',
  SESSION_LIST:             'session:list',
  SESSION_CREATE:           'session:create',
  SESSION_CREATED:          'session:created',
  SESSION_JOIN:             'session:join',
  SESSION_JOINED:           'session:joined',
  SESSION_REJOINED:         'session:rejoined',
  SESSION_NOT_FOUND:        'session:not_found',
  SESSION_ERROR:            'session:error',
  SESSION_PARTICIPANT_JOINED: 'session:participant_joined',
  SESSION_PARTICIPANT_LEFT:   'session:participant_left',

  // Game flow
  GAME_START:        'game:start',
  GAME_QUESTION:     'game:question',
  GAME_ANSWER:       'game:answer',
  GAME_ANSWER_ACK:   'game:answer_ack',
  GAME_REVEAL:       'game:reveal',
  GAME_LEADERBOARD:  'game:leaderboard',
  GAME_END:          'game:end',
  GAME_NEXT:         'game:next',

  // Timer
  TIMER_TICK:  'timer:tick',
  TIMER_END:   'timer:end',

  // Player
  PLAYER_REJOIN: 'player:rejoin',
  PLAYER_SCORE:  'player:score',

  // Admin
  ADMIN_KICK:           'admin:kick',
  ADMIN_SAVE_SESSION:   'admin:save_session',
  ADMIN_DELETE_SESSION: 'admin:delete_session',
  ADMIN_GET_SESSION:    'admin:get_session',
  ADMIN_GET_RESULTS:    'admin:get_results',

  // Session detail / save feedback
  SESSION_SAVED:    'session:saved',
  SESSION_DELETED:  'session:deleted',
  SESSION_DETAIL:   'session:detail',
  SESSION_RESULTS:  'session:results',
}

// ─── Roles ─────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:   'admin',
  TRAINER: 'trainer',
  PLAYER:  'player',
}

// ─── Game Phases ───────────────────────────────────────────────────────────
export const GAME_PHASES = {
  LOBBY:    'lobby',
  QUESTION: 'question',
  REVEAL:   'reveal',
  ENDED:    'ended',
}

// ─── Game Config ───────────────────────────────────────────────────────────
export const QUESTION_TIME_SECONDS  = 20
export const MAX_POINTS_PER_QUESTION = 1000
export const MIN_POINTS_PER_QUESTION = 100

// ─── Session Storage Keys ──────────────────────────────────────────────────
export const STORAGE_KEYS = {
  USER:       'tth_user',
  SESSION_ID: 'tth_session_id',
}

// ─── Answer Option Colors ──────────────────────────────────────────────────
export const OPTION_COLORS = [
  { bg: 'bg-blue-500',   hover: 'hover:bg-blue-600',   text: 'text-white', hex: '#3B82F6' },
  { bg: 'bg-red-500',    hover: 'hover:bg-red-600',    text: 'text-white', hex: '#EF4444' },
  { bg: 'bg-yellow-400', hover: 'hover:bg-yellow-500', text: 'text-white', hex: '#FBBF24' },
  { bg: 'bg-green-500',  hover: 'hover:bg-green-600',  text: 'text-white', hex: '#22C55E' },
]
