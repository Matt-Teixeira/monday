const { getCoverageInfo, remoteCoverageMatrix } = require('../config/remote-coverage');

/**
 * Groups an array of systems by their RemoteCoverage property
 *
 * @param {Array} systems - Array of system objects from Acumatica (e.g., from PROD_EQUIPMENT_URI)
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeUnknown - Whether to include systems with unknown coverage (default: true)
 * @param {boolean} options.includeDeprecated - Whether to include deprecated coverage types (default: true)
 * @param {boolean} options.useFuzzyMatch - Whether to use pattern matching for coverage types (default: true)
 * @returns {Object} Object with coverage types as keys and arrays of systems as values
 *
 * @example
 * const systems = await fetchFromAcumatica();
 * const grouped = groupSystemsByCoverage(systems);
 *
 * // Access specific coverage groups
 * const mriSystems = grouped['Avante MRI Bundle (OnSite, Vision, Connect, Mag Mon)'];
 * const unknownSystems = grouped._unknown;
 *
 * // Get stats
 * console.log(`Total groups: ${Object.keys(grouped).length}`);
 * console.log(`Unknown systems: ${grouped._unknown.length}`);
 */
function groupSystemsByCoverage(systems, options = {}) {
  const {
    includeUnknown = true,
    includeDeprecated = true,
    useFuzzyMatch = true
  } = options;

  // Initialize grouped object with all known coverage types
  const grouped = {};

  // Initialize each known coverage type as an empty array
  for (const coverageType of Object.keys(remoteCoverageMatrix)) {
    grouped[coverageType] = [];
  }

  // Special group for unknown/unmatched coverage types
  grouped._unknown = [];
  grouped._missing = []; // Systems with no RemoteCoverage property

  // Group each system
  systems.forEach(system => {
    // Handle systems with no RemoteCoverage property
    if (!system.RemoteCoverage || system.RemoteCoverage.trim() === '') {
      grouped._missing.push(system);
      return;
    }

    // Get coverage info with fuzzy matching
    const coverage = getCoverageInfo(system.RemoteCoverage, {
      useFuzzyMatch,
      returnUnmatched: true
    });

    // Skip deprecated types if option is set
    if (!includeDeprecated && coverage.deprecated) {
      return;
    }

    // Check if coverage was matched to a known type
    if (coverage.originalValue) {
      // Unknown coverage type
      if (includeUnknown) {
        grouped._unknown.push({
          ...system,
          _unmatchedCoverageValue: coverage.originalValue
        });
      }
    } else {
      // Known coverage type - find the exact key match
      const matchedKey = findExactKeyForCoverage(system.RemoteCoverage, useFuzzyMatch);
      if (matchedKey && grouped[matchedKey]) {
        grouped[matchedKey].push(system);
      } else {
        // Fallback to unknown if we can't find the key
        if (includeUnknown) {
          grouped._unknown.push({
            ...system,
            _unmatchedCoverageValue: system.RemoteCoverage
          });
        }
      }
    }
  });

  // Remove empty groups (optional - can be configured)
  const result = {};
  for (const [key, value] of Object.entries(grouped)) {
    if (value.length > 0) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Helper function to find the exact key in remoteCoverageMatrix that matches
 * a given RemoteCoverage value
 */
function findExactKeyForCoverage(remoteCoverageValue, useFuzzyMatch = true) {
  const { findCoverageTypeByPattern } = require('../config/remote-coverage');

  // First try direct key lookup
  if (remoteCoverageMatrix[remoteCoverageValue]) {
    return remoteCoverageValue;
  }

  // If fuzzy match enabled, use pattern matching
  if (useFuzzyMatch) {
    return findCoverageTypeByPattern(remoteCoverageValue);
  }

  return null;
}

/**
 * Get summary statistics about grouped systems
 *
 * @param {Object} groupedSystems - Result from groupSystemsByCoverage()
 * @returns {Object} Statistics about the grouped systems
 *
 * @example
 * const stats = getGroupingStats(grouped);
 * console.log(stats);
 * // {
 * //   totalGroups: 5,
 * //   totalSystems: 150,
 * //   unknownCount: 3,
 * //   missingCount: 2,
 * //   byGroup: {
 * //     'Avante Vision': 45,
 * //     'Avante MRI Bundle': 30,
 * //     ...
 * //   }
 * // }
 */
function getGroupingStats(groupedSystems) {
  const stats = {
    totalGroups: 0,
    totalSystems: 0,
    unknownCount: 0,
    missingCount: 0,
    byGroup: {}
  };

  for (const [key, systems] of Object.entries(groupedSystems)) {
    const count = systems.length;
    stats.totalSystems += count;

    if (key === '_unknown') {
      stats.unknownCount = count;
    } else if (key === '_missing') {
      stats.missingCount = count;
    } else {
      stats.totalGroups++;
      stats.byGroup[key] = count;
    }
  }

  return stats;
}

/**
 * Filter grouped systems to only include specific coverage criteria
 *
 * @param {Object} groupedSystems - Result from groupSystemsByCoverage()
 * @param {Object} criteria - Filter criteria
 * @param {boolean} criteria.hhm - Filter for HHM enabled
 * @param {boolean} criteria.mmb - Filter for MMB enabled
 * @param {boolean} criteria.customerAccess - Filter for customer access enabled
 * @returns {Array} Flattened array of systems matching criteria
 *
 * @example
 * // Get all systems with MMB enabled
 * const mmbSystems = filterGroupedSystems(grouped, { mmb: true });
 *
 * // Get all systems with HHM and customer access
 * const hhmWithAccess = filterGroupedSystems(grouped, {
 *   hhm: true,
 *   customerAccess: true
 * });
 */
function filterGroupedSystems(groupedSystems, criteria) {
  const results = [];

  for (const [key, systems] of Object.entries(groupedSystems)) {
    // Skip special groups
    if (key.startsWith('_')) continue;

    const coverage = remoteCoverageMatrix[key];
    if (!coverage) continue;

    // Check if this group matches criteria
    let matches = true;
    if (criteria.hhm !== undefined && coverage.hhm !== criteria.hhm) matches = false;
    if (criteria.mmb !== undefined && coverage.mmb !== criteria.mmb) matches = false;
    if (criteria.customerAccess !== undefined && coverage.customerAccess !== criteria.customerAccess) matches = false;

    if (matches) {
      results.push(...systems);
    }
  }

  return results;
}

/**
 * Get all systems from a grouped result that have a specific property value
 *
 * @param {Object} groupedSystems - Result from groupSystemsByCoverage()
 * @param {string} property - The property to filter by (e.g., 'hhm', 'mmb', 'customerAccess')
 * @param {*} value - The value to match
 * @returns {Array} Array of systems where coverage[property] === value
 *
 * @example
 * // Get all HHM-enabled systems
 * const hhmSystems = getSystemsByProperty(grouped, 'hhm', true);
 *
 * // Get all MMB-enabled systems
 * const mmbSystems = getSystemsByProperty(grouped, 'mmb', true);
 */
function getSystemsByProperty(groupedSystems, property, value) {
  const results = [];

  for (const [key, systems] of Object.entries(groupedSystems)) {
    // Skip special groups
    if (key.startsWith('_')) continue;

    const coverage = remoteCoverageMatrix[key];
    if (coverage && coverage[property] === value) {
      results.push(...systems);
    }
  }

  return results;
}

module.exports = {
  groupSystemsByCoverage,
  getGroupingStats,
  filterGroupedSystems,
  getSystemsByProperty
};
