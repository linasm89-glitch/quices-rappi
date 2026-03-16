/**
 * authMiddleware.js
 * Handles email validation and role assignment for The Training Hour.
 */

/**
 * Validates that an email belongs to the @rappi.com domain.
 * @param {string} email
 * @returns {boolean}
 */
function validateRappiEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  // Must match pattern: something@rappi.com (no subdomains required)
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@rappi\.com$/i;
  return emailRegex.test(trimmed);
}

/**
 * Determines the role for a given email.
 * - If the email is in the adminEmails array → 'admin'
 * - Otherwise → 'player'
 *
 * Note: 'trainer' role is a subset of admin access. To assign trainer,
 * prefix the email in ADMIN_EMAILS with "trainer:" e.g. "trainer:john@rappi.com"
 * OR set a separate TRAINER_EMAILS env var. For Phase 1, anyone in ADMIN_EMAILS
 * who isn't explicitly an admin gets 'trainer'.
 *
 * Convention used here:
 * - First entry in ADMIN_EMAILS list → 'admin'
 * - Subsequent entries → 'trainer' (unless env var FIRST_ADMIN_ONLY=true)
 * - All others → 'player'
 *
 * Simplest production-ready approach: ADMIN_EMAILS contains all privileged users.
 * The first one is the primary admin; the rest are trainers. This can be
 * overridden by prefixing with "admin:" or "trainer:" in the env var.
 *
 * @param {string} email - normalized (lowercase, trimmed) email
 * @param {string[]} adminEmails - array from process.env.ADMIN_EMAILS
 * @returns {'admin' | 'trainer' | 'player'}
 */
function getRoleForEmail(email, adminEmails) {
  if (!email || !Array.isArray(adminEmails)) return 'player';

  const normalizedEmail = email.trim().toLowerCase();

  for (const entry of adminEmails) {
    const entryNormalized = entry.trim().toLowerCase();

    // Support "admin:email@rappi.com" syntax
    if (entryNormalized.startsWith('admin:')) {
      const entryEmail = entryNormalized.slice('admin:'.length);
      if (entryEmail === normalizedEmail) return 'admin';
      continue;
    }

    // Support "trainer:email@rappi.com" syntax
    if (entryNormalized.startsWith('trainer:')) {
      const entryEmail = entryNormalized.slice('trainer:'.length);
      if (entryEmail === normalizedEmail) return 'trainer';
      continue;
    }

    // Plain email in list → admin
    if (entryNormalized === normalizedEmail) {
      return 'admin';
    }
  }

  return 'player';
}

module.exports = { validateRappiEmail, getRoleForEmail };
