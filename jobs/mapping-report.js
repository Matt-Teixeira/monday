const fs = require("node:fs");
const path = require("node:path");
const { buildRTTColumnValues } = require("../tools/monday-column-mapper");
const { HHM_VALID_COLUMNS } = require("./update-hhm-report-board/update-hhm-workflow");
const mondayConfig = require("../config/monday-boards");

/**
 * Acumatica -> RTT-FEED -> HHM-Cust-Workflow column mapping report.
 *
 * This job does NOT hardcode the mapping. It reflects the live code:
 *
 *  - The Acumatica property name for each RTT column is discovered by running
 *    the real `buildRTTColumnValues()` against a Proxy whose every property
 *    access returns its own name. Whatever Acumatica property the mapper reads
 *    for a column comes back as that column's value, giving an exact
 *    columnId -> AcumaticaProperty map straight from the mapper source.
 *  - RTT/HHM column keys come from config/monday-boards.js.
 *  - The "copied to HHM" surface is the exact `HHM_VALID_COLUMNS` set used by
 *    format_for_hhm_workflow().
 *
 * Output: a human-readable Markdown file (and a console summary).
 */

/**
 * Discover columnId -> Acumatica property name by reflecting the mapper.
 * The Proxy returns the accessed key as a truthy string, so
 * `norm(system.CustomerID ?? system.customerid)` resolves to "CustomerID".
 */
function discoverAcumaticaMap() {
  const probe = new Proxy(
    {},
    {
      // Return the property name itself for any access (PascalCase wins via ??).
      get: (_target, prop) => (typeof prop === "string" ? prop : undefined),
      // Make `prop in system` and `!== undefined` checks pass.
      has: () => true
    }
  );
  // No cap_datetime passed -> date column is added separately in the workflow.
  return JSON.parse(buildRTTColumnValues(probe));
}

// Columns that format_for_hhm_workflow() sets on HHM outside the copy filter.
// { hhmColumnId: { acu: <source>, note: <how it is set> } }
const HHM_EXTRA_COLUMNS = {
  color_mkztyftg: { acu: "(none)", note: 'Always: Business-Admin status hard-set to "New" on insert' },
  date_mkypgn4f: { acu: "CaptureDateTime", note: "Conditional: only when system.CaptureDateTime is present (capture timestamp, not from Acumatica equipment record)" },
  text_mkzt9pcm: { acu: "(none)", note: "Conditional: only when system.SubGroup is present (assigned by workflow modality routing, not from Acumatica)" }
};

function invert(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
}

/** Render an array of row-arrays as a GitHub markdown table. */
function mdTable(headers, rows) {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map((c) => (c == null || c === "" ? "—" : String(c))).join(" | ")} |`);
  return [head, sep, ...body].join("\n");
}

const mapping_report = async (cap_datetime) => {
  const acuMap = discoverAcumaticaMap(); // columnId -> Acumatica property
  const rttIdToKey = invert(mondayConfig.RTT_FEED.columns); // columnId -> RTT key
  const hhmIdToKey = invert(mondayConfig.HHM_CUST_WORKFLOW.columns); // columnId -> HHM key

  // Ordered list of RTT columns sourced from Acumatica (mapper order).
  const acuColumnIds = Object.keys(acuMap);

  // --- Section 1: Acumatica -> RTT-FEED -------------------------------------
  const section1 = acuColumnIds.map((colId) => [
    acuMap[colId], // Acumatica property
    rttIdToKey[colId] || "(unmapped)", // RTT config key
    colId // RTT Monday column ID
  ]);

  // --- Section 2: RTT-FEED -> HHM (copied) ----------------------------------
  const copiedIds = acuColumnIds.filter((id) => HHM_VALID_COLUMNS.has(id));
  const section2 = copiedIds.map((colId) => [
    acuMap[colId], // Acumatica property
    rttIdToKey[colId] || "(unmapped)", // RTT key
    hhmIdToKey[colId] || "(same id)", // HHM key (column ID is shared on both boards)
    colId // shared Monday column ID
  ]);
  // Append the workflow-set HHM columns (not part of the filtered copy).
  const section2Extra = Object.entries(HHM_EXTRA_COLUMNS).map(([hhmId, info]) => [
    info.acu,
    hhmIdToKey[hhmId] || "(unmapped)",
    hhmId,
    info.note
  ]);

  // --- Section 3: RTT-FEED columns NOT copied to HHM ------------------------
  const notCopiedIds = acuColumnIds.filter((id) => !HHM_VALID_COLUMNS.has(id));
  const section3 = notCopiedIds.map((colId) => [
    acuMap[colId], // Acumatica property
    rttIdToKey[colId] || "(unmapped)", // RTT key
    colId, // RTT Monday column ID
    hhmIdToKey[colId] ? `exists as ${hhmIdToKey[colId]}` : "no matching HHM column"
  ]);

  // --- Section 4: HHM columns NOT populated from RTT-FEED -------------------
  const handledHhmIds = new Set([...HHM_VALID_COLUMNS, ...Object.keys(HHM_EXTRA_COLUMNS)]);
  const section4 = Object.entries(mondayConfig.HHM_CUST_WORKFLOW.columns)
    .filter(([, colId]) => !handledHhmIds.has(colId))
    .map(([key, colId]) => [key, colId]);

  // --- Build Markdown -------------------------------------------------------
  const stamp = cap_datetime?.toFormat ? cap_datetime.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ") : new Date().toISOString();
  const md = [
    "# Acumatica → RTT-FEED → HHM-Cust-Workflow Column Mapping",
    "",
    `_Generated: ${stamp}_`,
    "",
    "This report is generated directly from the live code:",
    "- Acumatica property names are reflected from `tools/monday-column-mapper.js` (`buildRTTColumnValues`).",
    "- RTT / HHM column keys come from `config/monday-boards.js`.",
    "- The copied-to-HHM surface is the `HHM_VALID_COLUMNS` set in `jobs/update-hhm-report-board/update-hhm-workflow.js`.",
    "",
    "Note: RTT-FEED and HHM-Cust-Workflow reuse the **same Monday column IDs** for shared fields, so a copy is a 1:1 column-ID match.",
    "",
    "---",
    "",
    `## 1. Acumatica → RTT-FEED  (${section1.length} fields)`,
    "",
    "Every Acumatica equipment property the feed ingests, and the RTT-FEED column it lands in.",
    "",
    mdTable(["Acumatica Property", "RTT-FEED Column (key)", "RTT-FEED Column ID"], section1),
    "",
    "Plus two RTT-FEED columns **not** sourced from the Acumatica equipment record:",
    "",
    mdTable(
      ["RTT-FEED Column (key)", "RTT-FEED Column ID", "Source"],
      [
        ["CAPTURE_DATETIME", mondayConfig.RTT_FEED.columns.CAPTURE_DATETIME, "System capture timestamp (set during board update)"],
        ["SUB_GROUP", mondayConfig.RTT_FEED.columns.SUB_GROUP, "Assigned by workflow (modality routing)"]
      ]
    ),
    "",
    "---",
    "",
    `## 2. RTT-FEED → HHM-Cust-Workflow  (copied: ${section2.length} fields)`,
    "",
    "Columns carried over by `format_for_hhm_workflow()` (filtered to `HHM_VALID_COLUMNS`).",
    "",
    mdTable(["Acumatica Property", "RTT-FEED Column (key)", "HHM Column (key)", "Shared Column ID"], section2),
    "",
    "Additionally set on the HHM item by the workflow (not a straight copy):",
    "",
    mdTable(["Acumatica Source", "HHM Column (key)", "HHM Column ID", "How it is set"], section2Extra),
    "",
    "Also: the HHM item **name** is set from `Description` (the Monday item name / equipment ID), not a column.",
    "",
    "---",
    "",
    `## 3. In RTT-FEED but NOT copied to HHM-Cust-Workflow  (${section3.length} fields)`,
    "",
    "Acumatica-sourced RTT-FEED columns that are dropped when creating the HHM item.",
    "",
    mdTable(["Acumatica Property", "RTT-FEED Column (key)", "RTT-FEED Column ID", "HHM Board Status"], section3),
    "",
    "---",
    "",
    `## 4. HHM-Cust-Workflow columns NOT populated from RTT-FEED  (${section4.length} columns)`,
    "",
    "These HHM columns exist on the board but get no value during the RTT→HHM insert (managed elsewhere / manually).",
    "",
    mdTable(["HHM Column (key)", "HHM Column ID"], section4),
    ""
  ].join("\n");

  // --- Write file + console summary ----------------------------------------
  const fstamp = cap_datetime?.toFormat ? cap_datetime.toFormat("yyyyMMdd-HHmmss") : "report";
  const outPath = path.join(process.cwd(), `acu-rtt-hhm-mapping-${fstamp}.md`);
  fs.writeFileSync(outPath, md, "utf8");

  console.log("\n=== Acumatica → RTT-FEED → HHM Mapping Report ===\n");
  console.log(`  Acumatica → RTT-FEED fields:        ${section1.length}`);
  console.log(`  RTT-FEED → HHM (copied):            ${section2.length}`);
  console.log(`  RTT-FEED → HHM (extra/workflow-set): ${section2Extra.length}`);
  console.log(`  RTT-FEED columns NOT copied to HHM: ${section3.length}`);
  console.log(`  HHM columns not fed from RTT-FEED:  ${section4.length}`);
  console.log(`\n  Markdown written to: ${outPath}\n`);

  return { outPath, acuFields: section1.length, copied: section2.length, notCopied: section3.length };
};

module.exports = mapping_report;
