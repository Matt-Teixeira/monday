/**
 * Ticket Filter Patterns Configuration
 *
 * Patterns used to identify tickets of interest in the AVCONN_TICKETS job.
 * All patterns are case-insensitive by default.
 *
 * To add a new pattern:
 *   1. Add an object to the ticketFilterPatterns array
 *   2. Set pattern as a RegExp (use 'i' flag for case-insensitive)
 *   3. Set enabled: true to activate the pattern
 */

const ticketFilterPatterns = [
  {
    pattern: /remotetechnology/i,
    label: "REMOTETECHNOLOGY",
    enabled: true
  },
  {
    pattern: /contract\s*termination/i,
    label: "CONTRACT TERMINATION",
    enabled: true
  },
  {
    pattern: /contract\s*renewal/i,
    label: "CONTRACT RENEWAL",
    enabled: true
  },
  {
    pattern: /new\s*contract/i,
    label: "NEW CONTRACT",
    enabled: true
  },
  {
    pattern: /contract\s*non[\s-]*renewal/i,
    label: "CONTRACT NON-RENEWAL",
    enabled: true
  },
  {
    pattern: /new\s*magnet\s*monitoring\s*contract/i,
    label: "NEW MAGNET MONITORING CONTRACT",
    enabled: true
  }
];

/**
 * Get all enabled filter patterns
 * @returns {Array} Array of enabled pattern objects
 */
function getEnabledPatterns() {
  return ticketFilterPatterns.filter((p) => p.enabled);
}

module.exports = { ticketFilterPatterns, getEnabledPatterns };
