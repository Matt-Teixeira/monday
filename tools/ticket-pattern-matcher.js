/**
 * Ticket Pattern Matcher Utility
 *
 * Provides reusable functions for matching text against configured patterns.
 * Can be used by any job that needs pattern-based ticket filtering.
 */

const { getEnabledPatterns } = require("../config/ticket-filter-patterns");

/**
 * Check if a Monday.com item matches any filter patterns
 * Checks both item.name AND all column_values[].text
 *
 * @param {Object} item - Monday.com board item
 * @param {Array} patterns - Array of pattern objects (defaults to enabled patterns)
 * @returns {Object} Match result
 *   {
 *     matches: boolean,
 *     matchedPattern: Object|null,
 *     matchedIn: 'name'|'column'|null,
 *     columnId: string|null
 *   }
 */
function itemMatchesPatterns(item, patterns = null) {
  const patternsToCheck = patterns || getEnabledPatterns();

  // Check item.name (ticket title) first
  if (item.name) {
    for (const p of patternsToCheck) {
      if (p.pattern.test(item.name)) {
        return {
          matches: true,
          matchedPattern: p,
          matchedIn: "name",
          columnId: null
        };
      }
    }
  }

  // Check all column_values with text
  if (item.column_values && Array.isArray(item.column_values)) {
    for (const col of item.column_values) {
      if (col.text) {
        for (const p of patternsToCheck) {
          if (p.pattern.test(col.text)) {
            return {
              matches: true,
              matchedPattern: p,
              matchedIn: "column",
              columnId: col.id
            };
          }
        }
      }
    }
  }

  return {
    matches: false,
    matchedPattern: null,
    matchedIn: null,
    columnId: null
  };
}

module.exports = { itemMatchesPatterns };
