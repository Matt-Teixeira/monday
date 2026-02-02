const { createItem } = require("../../api/monday-client");
const { buildRTTColumnValues } = require("../../tools/monday-column-mapper");

const BOARD_ID = process.env.MONDAY_BOARD_HHM_CUST_WORKFLOW;
const GROUP_ID = "topics";

/**
 * Format an RTT system for HHM Customer Workflow board
 * Uses the same column mapping as RTT board + RemoteConnectivityStatus
 * @param {Object} system - RTT system object from API or Monday item
 * @returns {Object} Formatted object with name and columnValues
 */
function format_for_hhm_workflow(system) {
  // Get base column values (returns JSON string)
  const baseColsJson = buildRTTColumnValues(system);
  const baseCols = JSON.parse(baseColsJson);

  // Add HHM-specific status column
  baseCols.color_mkztyftg = { label: "NEW" };

  // Add capture date if present (comes as "YYYY-MM-DD HH:mm" from Monday)
  if (system.CaptureDateTime) {
    const [datePart, timePart] = system.CaptureDateTime.split(" ");
    baseCols.date_mkypgn4f = { date: datePart };
    if (timePart) {
      baseCols.date_mkypgn4f.time = timePart + ":00";
    }
  }

  // Add sub-group if present
  if (system.SubGroup) {
    baseCols.text_mkzt9pcm = system.SubGroup;
  }

  return {
    name: system.Description ?? system.description,
    columnValues: baseCols
  };
}

/**
 * Insert a formatted system to HHM Customer Workflow board
 * @param {Object} formatted - Object from format_for_hhm_workflow()
 * @returns {Promise<string>} Created item ID
 */
async function insert_to_hhm_cust(formatted) {
  const result = await createItem({
    boardId: BOARD_ID,
    groupId: GROUP_ID,
    itemName: formatted.name || "RTT Item",
    columnValues: JSON.stringify(formatted.columnValues)
  });

  return result.id;
}

module.exports = {
  format_for_hhm_workflow,
  insert_to_hhm_cust
};
