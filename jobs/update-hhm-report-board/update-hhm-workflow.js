const { createItem } = require("../../api/monday-client");
const { buildRTTColumnValues } = require("../../tools/monday-column-mapper");

const mondayConfig = require("../../config/monday-boards");

const BOARD_ID = mondayConfig.HHM_CUST_WORKFLOW.boardId;
const GROUP_ID = mondayConfig.HHM_CUST_WORKFLOW.groups.PLANNING_REVIEW;

// Column IDs that exist on the current HHM-Cust-Workflow board
const HHM_VALID_COLUMNS = new Set([
  "text_mkyfbpee",  // Customer ID
  "text_mkyfba0y",  // CustomerContractID
  "text_mkyfyb98",  // EquipmentDescription
  "text_mkyfsnjp",  // SerialNbr
  "text_mkyfdta3",  // Status
  "text_mkyf4nqv",  // Room
  "text_mkyf6y7e",  // SoftwareRelease
  "text_mkyftz9a",  // SystemIPAddress
  "text_mkyfk8xm",  // Modality
  "text_mkyfnce5",  // ModelDescription
  "text_mkyf9nmy",  // CustomerName
  "text_mkyfzn5b",  // Address
  "text_mkyfek5s",  // Model
  "text_mkyfc4e9",  // CustomerUniqueID
  "text_mkyf8pat",  // Manufacturer
  "text_mkyf5ccy",  // ServiceContractCustomerID
  "text_mkyfgfhd",  // Site-Name (ServiceContractCustomerName)
  "text_mkyfe84s",  // CustomerContractCustomerID
  "text_mkyfzd0g",  // CustomerContractCustomerName
  "text_mkyft88f",  // ServiceContractStatus
  "text_mkyffwj2",  // CustomerContractStatus
  "text_mkyfs9mr",  // ServiceContractLocationName
  "text_mkyfrkz2",  // RemoteConnectivityImplemented
  "text_mkzdqcx3",  // RemoteCoverage
]);

/**
 * Format an RTT system for HHM Customer Workflow board
 * Filters shared RTT columns to only those present on the HHM board
 * @param {Object} system - RTT system object from API or Monday item
 * @returns {Object} Formatted object with name and columnValues
 */
function format_for_hhm_workflow(system) {
  // Get base column values (returns JSON string) and filter to HHM-valid columns
  const allCols = JSON.parse(buildRTTColumnValues(system));
  const cols = {};
  for (const [key, value] of Object.entries(allCols)) {
    if (HHM_VALID_COLUMNS.has(key)) {
      cols[key] = value;
    }
  }

  // Status columns — all set to NEW on insert
  cols.color_mkztyftg = { label: "NEW" };  // Business-Admin
  cols.color_mm0d3jnz = { label: "NEW" };  // Remote-Admin
  cols.color_mm0dvwya = { label: "NEW" };  // Dev-Ops
  cols.color_mm0dac13 = { label: "NEW" };  // Network-Admin

  // Add capture date if present (comes as "YYYY-MM-DD HH:mm" from Monday)
  if (system.CaptureDateTime) {
    const [datePart, timePart] = system.CaptureDateTime.split(" ");
    cols.date_mkypgn4f = { date: datePart };
    if (timePart) {
      cols.date_mkypgn4f.time = timePart + ":00";
    }
  }

  // Add sub-group if present
  if (system.SubGroup) {
    cols.text_mkzt9pcm = system.SubGroup;
  }

  return {
    name: system.Description ?? system.description,
    columnValues: cols
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
