const { getMondayBoardItems } = require("../api/get-monday-board-items");
const { changeColumnValues } = require("../api/monday-client");
const { get_all_he_level } = require("../sql/qf-provider");
const mondayConfig = require("../config/monday-boards");

const boardId = mondayConfig.MMB_CUST_WORKFLOW.boardId;
const groupId = mondayConfig.MMB_CUST_WORKFLOW.groups.ACTIVE_MAINTENANCE;
const HE_LEVEL = mondayConfig.MMB_CUST_WORKFLOW.columns.HE_LEVEL;
const CAPTURE_DATETIME = mondayConfig.MMB_CUST_WORKFLOW.columns.CAPTURE_DATETIME;

const update_mmb_he_data = async () => {
  // 1. Query DB for He-Level data
  const heData = await get_all_he_level();
  console.log(`Fetched ${heData.length} He-Level rows from database`);

  // 2. Fetch existing items from Active & Maintenance group
  const { items } = await getMondayBoardItems(boardId, groupId);
  console.log(`Found ${items.length} items in Active & Maintenance group`);

  // 3. Build lookup map: item name -> item id
  const itemMap = new Map();
  for (const item of items) {
    itemMap.set(item.name.trim(), item.id);
  }

  // 4. Match DB rows to board items and update He-Level
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of heData) {
    const systemId = String(row.system_id).trim();
    const itemId = itemMap.get(systemId);

    if (!itemId) {
      skipped++;
      continue;
    }

    try {
      const cols = {
        [HE_LEVEL]: row.rpp_value
      };

      if (row.capture_datetime) {
        const dt = new Date(row.capture_datetime);
        const datePart = dt.toISOString().split("T")[0];
        const timePart = dt.toTimeString().split(" ")[0]; // HH:mm:ss in local time
        cols[CAPTURE_DATETIME] = { date: datePart, time: timePart };
      }

      await changeColumnValues({ boardId, itemId, columnValues: JSON.stringify(cols) });
      updated++;
      console.log(`Updated He-Level for ${systemId}: ${row.rpp_value}`);
    } catch (err) {
      errors++;
      console.error(`Error updating ${systemId}:`, err.message);
    }
  }

  const summary = { updated, skipped, errors };
  console.log("MMB He-Level update complete:", summary);
  return summary;
};

module.exports = update_mmb_he_data;
