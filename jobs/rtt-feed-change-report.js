const fs = require("node:fs");
const path = require("node:path");
const { getRecentRttFeedChanges } = require("../sql/qf-provider");

/**
 * Escape a value for CSV (wrap in quotes, double internal quotes)
 */
function csvCell(value) {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Export the RTT-FEED change history (from monday.rtt_feed_changes) to a CSV.
 * One row per logged field change, newest first.
 *
 * @param {Object} cap_datetime - luxon DateTime, used for the filename stamp
 * @param {string} [since] - optional ISO date/timestamp lower bound; when
 *   provided, only changes with capture_datetime >= since are exported.
 *   Pass on the CLI: `node index rtt_feed_change_report 2026-06-01`
 */
const rtt_feed_change_report = async (cap_datetime, since = null) => {
  console.log("\n=== RTT-FEED Change History Report ===\n");
  console.log(since ? `Filtering to changes since ${since}` : "Exporting all changes");

  const changes = await getRecentRttFeedChanges(since || null);
  console.log(`Loaded ${changes.length} change rows from monday.rtt_feed_changes`);

  const header = [
    "capture_datetime",
    "description",
    "column_name",
    "column_id",
    "before_value",
    "after_value",
    "group_id",
    "monday_item_id",
    "job_name"
  ];

  const lines = [header.map(csvCell).join(",")];
  const systems = new Set();

  for (const c of changes) {
    systems.add(c.description);
    const capture =
      c.capture_datetime instanceof Date
        ? c.capture_datetime.toISOString()
        : c.capture_datetime;
    lines.push(
      [
        capture,
        c.description,
        c.column_name,
        c.column_id,
        c.before_value,
        c.after_value,
        c.group_id,
        c.monday_item_id,
        c.job_name
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const stamp = cap_datetime?.toFormat
    ? cap_datetime.toFormat("yyyyMMdd-HHmmss")
    : "report";
  const outPath = path.join(process.cwd(), `rtt-feed-changes-${stamp}.csv`);
  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

  console.log("\n--- Change Report Summary ---");
  console.log(`  Change rows:       ${changes.length}`);
  console.log(`  Distinct systems:  ${systems.size}`);
  console.log(`\n  CSV written to: ${outPath}`);

  return {
    rows: changes.length,
    systems: systems.size,
    outPath
  };
};

module.exports = rtt_feed_change_report;
