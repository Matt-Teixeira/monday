const fs = require("node:fs");
const path = require("node:path");
const { getMondayBoardItems } = require("../api/get-monday-board-items");
const { norm } = require("../tools/monday-column-mapper");
const { HHM_VALID_COLUMNS } = require("./update-hhm-report-board/update-hhm-workflow");
const mondayConfig = require("../config/monday-boards");

// Columns to compare for drift: exactly the columns copied from RTT-FEED into
// HHM (same column IDs on both boards). Reused from the workflow-copy logic so
// the report tracks precisely the snapshot surface.
const SHARED_COLUMN_IDS = [...HHM_VALID_COLUMNS];

// Reverse lookup: column ID -> human-readable RTT_FEED column name
const columnIdToName = Object.fromEntries(
  Object.entries(mondayConfig.RTT_FEED.columns).map(([name, id]) => [id, name])
);

/**
 * Build a Map of column ID -> normalized text for a Monday item
 */
function columnTextMap(item) {
  const map = new Map();
  for (const col of item.column_values) {
    map.set(col.id, norm(col.text));
  }
  return map;
}

/**
 * Escape a value for CSV (wrap in quotes, double internal quotes)
 */
function csvCell(value) {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Compare RTT-FEED (TOPICS, the only group kept refreshed by the delta sync)
 * against HHM-Cust-Workflow items, matched on the Monday item name (the "SME#"),
 * and write a CSV of every drifted column plus any HHM items with no RTT source.
 */
const rtt_hhm_drift = async (cap_datetime) => {
  console.log("\n=== RTT-FEED vs HHM-Cust-Workflow Drift Report ===\n");

  // 1. RTT-FEED current values live in TOPICS (delta sync refreshes it).
  const rttResult = await getMondayBoardItems(mondayConfig.RTT_FEED.boardId, [
    mondayConfig.RTT_FEED.groups.TOPICS
  ]);
  const rttMap = new Map();
  for (const item of rttResult.items) {
    const name = item.name?.trim();
    if (name) rttMap.set(name, item);
  }
  console.log(`Loaded ${rttMap.size} RTT-FEED TOPICS items`);

  // 2. All HHM items across every group.
  const hhmResult = await getMondayBoardItems(mondayConfig.HHM_CUST_WORKFLOW.boardId);
  console.log(`Loaded ${hhmResult.items.length} HHM-Cust-Workflow items`);

  // 3. Compare.
  const rows = []; // { sme, field, columnId, rttValue, hhmValue, hhmGroup, hhmItemId, status }
  let driftedSystems = 0;
  let noMatchSystems = 0;
  let cleanSystems = 0;

  for (const hhmItem of hhmResult.items) {
    const sme = hhmItem.name?.trim() || "";
    const hhmGroup = hhmItem.group?.title || "";
    const rttItem = rttMap.get(sme);

    if (!rttItem) {
      noMatchSystems++;
      rows.push({
        sme,
        field: "",
        columnId: "",
        rttValue: "",
        hhmValue: "",
        hhmGroup,
        hhmItemId: hhmItem.id,
        status: "NO_RTT_MATCH"
      });
      continue;
    }

    const rttCols = columnTextMap(rttItem);
    const hhmCols = columnTextMap(hhmItem);

    let drifted = false;
    for (const colId of SHARED_COLUMN_IDS) {
      const rttValue = rttCols.get(colId) ?? "";
      const hhmValue = hhmCols.get(colId) ?? "";
      if (rttValue !== hhmValue) {
        drifted = true;
        rows.push({
          sme,
          field: columnIdToName[colId] || colId,
          columnId: colId,
          rttValue,
          hhmValue,
          hhmGroup,
          hhmItemId: hhmItem.id,
          status: "DRIFT"
        });
      }
    }

    if (drifted) driftedSystems++;
    else cleanSystems++;
  }

  // 4. Write CSV to repo root.
  const header = [
    "sme_number",
    "field",
    "column_id",
    "rtt_feed_value",
    "hhm_value",
    "hhm_group",
    "hhm_item_id",
    "status"
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.sme,
        r.field,
        r.columnId,
        r.rttValue,
        r.hhmValue,
        r.hhmGroup,
        r.hhmItemId,
        r.status
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const stamp = cap_datetime?.toFormat
    ? cap_datetime.toFormat("yyyyMMdd-HHmmss")
    : "report";
  const outPath = path.join(process.cwd(), `rtt-hhm-drift-${stamp}.csv`);
  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

  console.log("\n--- Drift Summary ---");
  console.log(`  HHM systems scanned:    ${hhmResult.items.length}`);
  console.log(`  Drifted systems:        ${driftedSystems}`);
  console.log(`  No RTT-FEED match:      ${noMatchSystems}`);
  console.log(`  Clean (no drift):       ${cleanSystems}`);
  console.log(`  Total CSV rows:         ${rows.length}`);
  console.log(`\n  CSV written to: ${outPath}`);

  return {
    scanned: hhmResult.items.length,
    drifted: driftedSystems,
    noMatch: noMatchSystems,
    clean: cleanSystems,
    rows: rows.length,
    outPath
  };
};

module.exports = rtt_hhm_drift;
