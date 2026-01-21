const { requiredFields, fieldDescriptions } = require("../config/required-fields");

/**
 * Check if a value is considered "missing" or "empty"
 *
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is missing/empty
 */
function isMissingValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

/**
 * Validate a single system for missing required fields
 *
 * @param {Object} system - System object from Acumatica OData
 * @param {Array<string>} fieldsToCheck - Array of field names to validate (defaults to requiredFields)
 * @returns {Object} Validation result
 *   {
 *     isValid: boolean,
 *     missingFields: Array<string>,
 *     system: Object (original system)
 *   }
 */
function validateSystem(system, fieldsToCheck = requiredFields) {
  const missingFields = [];

  for (const field of fieldsToCheck) {
    if (isMissingValue(system[field])) {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    system
  };
}

/**
 * Filter an array of systems to find those with missing required fields
 *
 * @param {Array<Object>} systems - Array of system objects
 * @param {Array<string>} fieldsToCheck - Array of field names to validate (defaults to requiredFields)
 * @returns {Array<Object>} Array of systems with missing data
 *   Each object contains:
 *   {
 *     system: Object (original system),
 *     missingFields: Array<string>,
 *     missingCount: number
 *   }
 */
function findSystemsWithMissingData(systems, fieldsToCheck = requiredFields) {
  const systemsWithMissingData = [];

  for (const system of systems) {
    const validation = validateSystem(system, fieldsToCheck);

    if (!validation.isValid) {
      systemsWithMissingData.push({
        system: validation.system,
        missingFields: validation.missingFields,
        missingCount: validation.missingFields.length
      });
    }
  }

  return systemsWithMissingData;
}

/**
 * Get statistics about missing data across all systems
 *
 * @param {Array<Object>} systems - Array of system objects
 * @param {Array<string>} fieldsToCheck - Array of field names to validate (defaults to requiredFields)
 * @returns {Object} Statistics about missing data
 */
function getMissingDataStats(systems, fieldsToCheck = requiredFields) {
  const stats = {
    totalSystems: systems.length,
    systemsWithMissingData: 0,
    systemsValid: 0,
    fieldStats: {}
  };

  // Initialize field stats
  for (const field of fieldsToCheck) {
    stats.fieldStats[field] = {
      missingCount: 0,
      missingPercentage: 0
    };
  }

  // Count missing fields
  for (const system of systems) {
    const validation = validateSystem(system, fieldsToCheck);

    if (validation.isValid) {
      stats.systemsValid++;
    } else {
      stats.systemsWithMissingData++;

      // Count each missing field
      for (const field of validation.missingFields) {
        stats.fieldStats[field].missingCount++;
      }
    }
  }

  // Calculate percentages
  for (const field of fieldsToCheck) {
    const count = stats.fieldStats[field].missingCount;
    stats.fieldStats[field].missingPercentage =
      systems.length > 0 ? ((count / systems.length) * 100).toFixed(2) : 0;
  }

  return stats;
}

/**
 * Format missing fields for display or logging
 *
 * @param {Array<string>} missingFields - Array of missing field names
 * @returns {string} Formatted string describing missing fields
 */
function formatMissingFields(missingFields) {
  if (missingFields.length === 0) return "None";

  return missingFields
    .map((field) => {
      const description = fieldDescriptions[field] || field;
      return `${field} (${description})`;
    })
    .join(", ");
}

module.exports = {
  validateSystem,
  findSystemsWithMissingData,
  getMissingDataStats,
  formatMissingFields,
  isMissingValue
};
