const fs = require("fs");

/**
 * Serialize a single value into a CSV-safe field.
 * Null/undefined become empty; objects/arrays are JSON-encoded; everything
 * else is stringified. The field is quoted only when it contains a comma,
 * quote, or newline (quotes are escaped by doubling).
 *
 * @param {*} value
 * @returns {string}
 */
function formatField(value) {
  if (value === null || value === undefined) return "";

  let str;
  if (typeof value === "object") {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of row objects into a CSV string.
 *
 * @param {Array<Object>} rows - Row objects keyed by header name
 * @param {string[]} [headers] - Explicit column order. Defaults to the union
 *   of keys across all rows (in first-seen order).
 * @returns {string} CSV text (CRLF line endings, trailing newline)
 */
function toCsv(rows, headers = null) {
  if (!headers) {
    const seen = new Set();
    headers = [];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!seen.has(key)) {
          seen.add(key);
          headers.push(key);
        }
      }
    }
  }

  const lines = [headers.map(formatField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => formatField(row[h])).join(","));
  }

  return lines.join("\r\n") + "\r\n";
}

/**
 * Write rows out to a CSV file.
 *
 * @param {string} filePath - Destination path
 * @param {Array<Object>} rows - Row objects keyed by header name
 * @param {string[]} [headers] - Explicit column order (see toCsv)
 */
function writeCsv(filePath, rows, headers = null) {
  fs.writeFileSync(filePath, toCsv(rows, headers), "utf8");
}

module.exports = { toCsv, writeCsv, formatField };
