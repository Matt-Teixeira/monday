/**
 * Export selected Monday board groups and the Acumatica equipment feed to
 * individual CSV files under files/. Repeatable: `npm run export_csv`.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { createClient } = require("../api/monday-client");
const { getMondayBoardItems } = require("../api/get-monday-board-items");
const { get_acu_equip_rtt } = require("../api");
const mondayConfig = require("../config/monday-boards");
const { writeCsv } = require("../tools/write-csv");

const monday = createClient();

const FILES_DIR = path.join(__dirname, "..", "files");

/**
 * Fetch a board's column definitions (id + title), used to build CSV headers.
 *
 * @param {string} boardId
 * @returns {Promise<Array<{id: string, title: string}>>}
 */
async function getBoardColumns(boardId) {
  const query = `query($b:[ID!]!){ boards(ids:$b){ columns { id title } } }`;
  const res = await monday.post("", { query, variables: { b: boardId } });

  if (res.data.errors) {
    console.error("GraphQL errors:", JSON.stringify(res.data.errors, null, 2));
    throw new Error("GraphQL error fetching board columns");
  }

  const board = res.data.data?.boards?.[0];
  if (!board) throw new Error(`No board returned for id ${boardId}`);
  return board.columns || [];
}

/**
 * Export the items of one or more groups on a board to a CSV file.
 * Columns are the board's column titles; each row is one item.
 *
 * @param {Object} opts
 * @param {string} opts.boardId
 * @param {string[]} opts.groupIds
 * @param {string} opts.outFile - File name written into FILES_DIR
 * @param {string} opts.label - Human label for logging
 */
async function exportMondayGroups({ boardId, groupIds, outFile, label }) {
  const columns = await getBoardColumns(boardId);
  const { items } = await getMondayBoardItems(boardId, groupIds);

  // Build unique header titles (guard against duplicate column titles by
  // suffixing the column id), keeping a parallel list of column ids.
  const seenTitles = new Set();
  const headerForColumn = columns.map((col) => {
    let title = col.title || col.id;
    if (seenTitles.has(title)) title = `${title} (${col.id})`;
    seenTitles.add(title);
    return { id: col.id, header: title };
  });

  const headers = ["Item ID", "Item Name", "Group", ...headerForColumn.map((c) => c.header)];

  const rows = items.map((item) => {
    const textById = new Map((item.column_values || []).map((cv) => [cv.id, cv.text ?? ""]));
    const row = {
      "Item ID": item.id,
      "Item Name": item.name,
      Group: item.group?.title ?? ""
    };
    for (const col of headerForColumn) {
      row[col.header] = textById.get(col.id) ?? "";
    }
    return row;
  });

  const filePath = path.join(FILES_DIR, outFile);
  writeCsv(filePath, rows, headers);
  console.log(`${label}: wrote ${rows.length} rows -> ${filePath}`);
}

/**
 * Export the Acumatica equipment feed (PROD_EQUIPMENT_URI) to a CSV file.
 *
 * @param {Object} opts
 * @param {string} opts.outFile
 * @param {string} opts.label
 */
async function exportAcumatica({ outFile, label }) {
  const response = await get_acu_equip_rtt();
  const records = response.value ?? (Array.isArray(response) ? response : []);

  // Header = union of keys across all records, in first-seen order.
  const headers = [];
  const seen = new Set();
  for (const rec of records) {
    for (const key of Object.keys(rec)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }

  const filePath = path.join(FILES_DIR, outFile);
  writeCsv(filePath, records, headers);
  console.log(`${label}: wrote ${records.length} rows -> ${filePath}`);
}

/**
 * Run all configured exports.
 */
const export_csv = async () => {
  fs.mkdirSync(FILES_DIR, { recursive: true });

  await exportMondayGroups({
    boardId: mondayConfig.RTT_FEED.boardId,
    groupIds: [mondayConfig.RTT_FEED.groups.TOPICS], // ACUMATICA-RTT-SYSTEMS
    outFile: "rtt_feed_acumatica_rtt_systems.csv",
    label: "RTT Feed (ACUMATICA-RTT-SYSTEMS)"
  });

  await exportMondayGroups({
    boardId: mondayConfig.HHM_CUST_WORKFLOW.boardId,
    groupIds: [
      mondayConfig.HHM_CUST_WORKFLOW.groups.PLANNING_REVIEW,
      mondayConfig.HHM_CUST_WORKFLOW.groups.ACTIVE_MAINTENANCE
    ],
    outFile: "hhm_cust_workflow.csv",
    label: "HHM Cust Workflow (Planning-Review + Active & Maintenance)"
  });

  await exportMondayGroups({
    boardId: mondayConfig.MMB_CUST_WORKFLOW.boardId,
    groupIds: [
      mondayConfig.MMB_CUST_WORKFLOW.groups.PLANNING_REVIEW,
      mondayConfig.MMB_CUST_WORKFLOW.groups.ACTIVE_MAINTENANCE
    ],
    outFile: "mmb_cust_workflow.csv",
    label: "MMB Cust Workflow (Planning-Review + Active & Maintenance)"
  });

  await exportAcumatica({
    outFile: "acumatica_equipment.csv",
    label: "Acumatica Equipment (PROD_EQUIPMENT_URI)"
  });

  console.log("\nAll CSV exports complete.");
};

module.exports = export_csv;
