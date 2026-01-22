const remoteCoverageMatrix = {
  "Avante Connect Only": {
    hhm: true,
    mmb: false,
    customerAccess: false,
    notes: "",
    deprecated: false,
    patterns: [/^avante\s*connect\s*only$/i]
  },
  "Avante Vision": {
    hhm: true,
    mmb: false,
    customerAccess: true,
    notes: "",
    deprecated: false,
    patterns: [/^avante\s*vision$/i]
  },
  "Avante OnSite": {
    hhm: null,
    mmb: null,
    customerAccess: null,
    notes: "Deprecated",
    deprecated: true,
    patterns: [/^avante\s*on\s*site$/i, /^avante\s*onsite$/i]
  },
  "Avante Magnet Monitoring": {
    hhm: false,
    mmb: true,
    customerAccess: true,
    notes: "",
    deprecated: false,
    patterns: [/^avante\s*magnet\s*monitoring$/i, /^avante\s*mag\s*mon$/i]
  },
  "Avante MRI Bundle (OnSite, Vision, Connect, Mag Mon)": {
    hhm: true,
    mmb: true,
    customerAccess: true,
    notes: "",
    deprecated: false,
    patterns: [
      /^avante\s*mri\s*bundle/i,
      /mri.*bundle/i,
      /bundle.*mri/i
    ]
  },
  "Avante CT/CATH Bundle (OnSite, Vision, Connect)": {
    hhm: true,
    mmb: false,
    customerAccess: true,
    notes: "",
    deprecated: false,
    patterns: [
      /^avante\s*ct\/cath\s*bundle/i,
      /ct\s*cath.*bundle/i,
      /bundle.*ct.*cath/i
    ]
  },
  "Refused Connectivity": {
    hhm: null,
    mmb: null,
    customerAccess: null,
    notes: "",
    deprecated: false,
    patterns: [/refused\s*connectivity/i, /no\s*connectivity/i]
  },
  "Excludes Avante On-Site": {
    hhm: null,
    mmb: null,
    customerAccess: null,
    notes: "Deprecated",
    deprecated: true,
    patterns: [/excludes.*on\s*site/i, /exclude.*onsite/i]
  },
  "(Any Other Option)": {
    hhm: null,
    mmb: null,
    customerAccess: null,
    notes: "Deprecated",
    deprecated: true,
    patterns: [/any\s*other/i, /other\s*option/i]
  }
};

// Normalize a string by removing extra whitespace and trimming
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

// Find matching coverage type using regex patterns
function findCoverageTypeByPattern(remoteCoverageType) {
  if (!remoteCoverageType) return null;

  const normalized = normalizeString(remoteCoverageType);

  // First try exact match (case-insensitive)
  for (const [key] of Object.entries(remoteCoverageMatrix)) {
    if (normalizeString(key).toLowerCase() === normalized.toLowerCase()) {
      return key;
    }
  }

  // Then try pattern matching
  for (const [key, value] of Object.entries(remoteCoverageMatrix)) {
    if (value.patterns) {
      for (const pattern of value.patterns) {
        if (pattern.test(normalized)) {
          return key;
        }
      }
    }
  }

  return null;
}

// Helper function to get coverage info by remote coverage type
// Supports exact match, normalized match, and regex pattern matching
function getCoverageInfo(remoteCoverageType, options = {}) {
  const { useFuzzyMatch = true, returnUnmatched = true } = options;

  // Try direct lookup first
  let coverage = remoteCoverageMatrix[remoteCoverageType];

  // If not found and fuzzy matching is enabled, try pattern matching
  if (!coverage && useFuzzyMatch) {
    const matchedKey = findCoverageTypeByPattern(remoteCoverageType);
    if (matchedKey) {
      coverage = remoteCoverageMatrix[matchedKey];
    }
  }

  // Return found coverage or default unknown
  if (coverage) {
    return { ...coverage, matchedKey: remoteCoverageType };
  }

  if (returnUnmatched) {
    return {
      hhm: null,
      mmb: null,
      customerAccess: null,
      notes: "Unknown coverage type",
      deprecated: false,
      matchedKey: null,
      originalValue: remoteCoverageType
    };
  }

  return null;
}

module.exports = {
  remoteCoverageMatrix,
  getCoverageInfo,
  findCoverageTypeByPattern,
  normalizeString
};
