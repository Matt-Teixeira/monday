const { createItem } = require("../../api/monday-client");

const BOARD_ID = process.env.MONDAY_BOARD_MMB_CUST_WORKFLOW;
const GROUP_ID = "topics";

/**
 * Format an RTT system for MMB Customer Workflow board
 * @param {Object} system - RTT system object from API
 * @returns {Object} Formatted object with Monday column mappings
 */
function format_for_mmb_workflow(system) {
  // Build site address from components
  const addressParts = [
    system.AddressLine1,
    [system.City, system.State].filter(Boolean).join(", "),
    system.PostalCode
  ].filter(Boolean);
  const siteAddress = addressParts.join(", ");

  return {
    name: system.Description ?? system.description,
    status: { label: "NEW" },
    text_mkxjfnc4: system.CustomerName,
    text_mkxjn0xh: system.CustomerName,
    text_mkxjzsj3: "MRI",
    text_mkyfmb6e: system.Manufacturer,
    text_mkyfthry: system.CustomerUniqueID,
    text_mkxjrtzm: system.SubGroup || "",
    long_text_mkxq9d75: { text: siteAddress }
  };
}

/**
 * Insert a formatted system to MMB Customer Workflow board
 * @param {Object} formatted - Object from format_for_mmb_workflow()
 * @returns {Promise<string>} Created item ID
 */
async function insert_to_mmb_cust(formatted) {
  const { name, ...columnValuesObj } = formatted;

  const result = await createItem({
    boardId: BOARD_ID,
    groupId: GROUP_ID,
    itemName: name || "RTT Item",
    columnValues: JSON.stringify(columnValuesObj)
  });

  return result.id;
}

module.exports = {
  format_for_mmb_workflow,
  insert_to_mmb_cust
};
