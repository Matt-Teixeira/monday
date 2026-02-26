const { DateTime } = require("luxon");
const { getMondayBoardItems } = require("../api/get-monday-board-items");
const { changeColumnValues, createItem } = require("../api/monday-client");
const { get_all_hhm_status } = require("../sql/qf-provider");
const mondayConfig = require("../config/monday-boards");

const boardId = mondayConfig.HHM_CUST_WORKFLOW.boardId;
const groupId = mondayConfig.HHM_CUST_WORKFLOW.groups.ACTIVE_MAINTENANCE;
const addToActiveGroupId = mondayConfig.HHM_CUST_WORKFLOW.groups.ADD_TO_ACTIVE;
const CONNECTIVITY_ERROR = mondayConfig.HHM_CUST_WORKFLOW.columns.CONNECTIVITY_ERROR;
const LAST_LOG_DATE = mondayConfig.HHM_CUST_WORKFLOW.columns.LAST_LOG_DATE;
const LAST_CONNECTION_DATE = mondayConfig.HHM_CUST_WORKFLOW.columns.LAST_CONNECTION_DATE;

const update_hhm_status = async () => {
  // 1. Query DB for HHM connectivity status
  const hhmData = await get_all_hhm_status();
  console.log(`Fetched ${hhmData.length} HHM status rows from database`);

  // 2. Build lookup by system_id
  const dataMap = new Map();
  for (const row of hhmData) {
    const id = String(row.system_id).trim();
    dataMap.set(id, {
      connectivityError: row.connectivity_error,
      lastLogDate: row.last_log_date,
      lastConnection: row.last_connection
    });
  }

  // 3. Fetch existing items from Active & Maintenance group
  const { items } = await getMondayBoardItems(boardId, groupId);
  console.log(`Found ${items.length} items in Active & Maintenance group`);

  // 4. Build item lookup: item name -> item id
  const itemMap = new Map();
  for (const item of items) {
    itemMap.set(item.name.trim(), item.id);
  }

  // 5. Match and update
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const skippedSystems = [];

  for (const [systemId, data] of dataMap) {
    const itemId = itemMap.get(systemId);

    if (!itemId) {
      skipped++;
      skippedSystems.push({ systemId, ...data });
      continue;
    }

    try {
      const cols = {};

      if (data.connectivityError != null) {
        cols[CONNECTIVITY_ERROR] = String(data.connectivityError);
      }

      if (data.lastLogDate) {
        const dt = DateTime.fromJSDate(new Date(data.lastLogDate), { zone: "America/New_York" });
        cols[LAST_LOG_DATE] = { date: dt.toFormat("yyyy-MM-dd"), time: dt.toFormat("HH:mm:ss") };
      }

      if (data.lastConnection) {
        const dt = DateTime.fromJSDate(new Date(data.lastConnection), { zone: "America/New_York" });
        cols[LAST_CONNECTION_DATE] = { date: dt.toFormat("yyyy-MM-dd"), time: dt.toFormat("HH:mm:ss") };
      }

      if (Object.keys(cols).length === 0) {
        skipped++;
        continue;
      }

      await changeColumnValues({ boardId, itemId, columnValues: JSON.stringify(cols) });
      updated++;
      console.log(`Updated ${systemId}: error=${data.connectivityError}, last_log=${data.lastLogDate}, last_conn=${data.lastConnection}`);
    } catch (err) {
      errors++;
      console.error(`Error updating ${systemId}:`, err.message);
    }
  }

  const summary = { updated, skipped, errors };
  console.log("HHM status update complete:", summary);

  // 6. Insert skipped systems into "Add to Active" group
  if (skippedSystems.length > 0) {
    console.log(`\n${skippedSystems.length} systems have no matching board item. Checking "Add to Active" group...`);

    // Fetch existing items in Add to Active to prevent duplicates
    const { items: addToActiveItems } = await getMondayBoardItems(boardId, addToActiveGroupId);
    const existingNames = new Set(addToActiveItems.map((item) => item.name.trim()));
    console.log(`Found ${addToActiveItems.length} existing items in "Add to Active" group`);

    let inserted = 0;
    let duplicates = 0;
    let insertErrors = 0;

    for (const system of skippedSystems) {
      if (existingNames.has(system.systemId)) {
        duplicates++;
        continue;
      }

      try {
        await createItem({
          boardId,
          groupId: addToActiveGroupId,
          itemName: system.systemId,
          columnValues: JSON.stringify({})
        });
        inserted++;
        console.log(`Inserted ${system.systemId} into "Add to Active"`);
      } catch (err) {
        insertErrors++;
        console.error(`Error inserting ${system.systemId}:`, err.message);
      }
    }

    console.log("Add to Active summary:", { inserted, duplicates, insertErrors });
  }

  return summary;
};

module.exports = update_hhm_status;
