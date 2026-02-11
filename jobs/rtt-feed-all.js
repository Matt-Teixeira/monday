const get_acu_equip_rtt_all = require("../api/get-acu-equip-rtt-all");
const { getMondayItemNames } = require("../api/get-monday-board-items");
const { createItem } = require("../api/monday-client");
const { buildRTTColumnValues } = require("../tools/monday-column-mapper");
const mondayConfig = require("../config/monday-boards");

const rtt_feed_all = async (cap_datetime) => {
  const boardId = mondayConfig.RTT_FEED_ALL.boardId;
  const groupId = mondayConfig.RTT_FEED_ALL.groups.TOPICS;

  // 1. Fetch all systems from the EquipmentRTTAll API
  const apiResponse = await get_acu_equip_rtt_all();
  const systems = apiResponse.value;
  console.log(`Fetched ${systems.length} systems from EquipmentRTTAll API`);

  // 2. Get existing item names from the board for deduplication
  const existingNames = await getMondayItemNames(boardId);
  console.log(`Found ${existingNames.size} existing items on RTT-FEED-ALL board`);

  // 3. Filter out duplicates by Description (item name)
  const newSystems = systems.filter((system) => {
    const name = String(system.Description ?? "").trim();
    return name && !existingNames.has(name);
  });

  console.log(
    `${newSystems.length} new systems to insert (${systems.length - newSystems.length} already exist)`
  );

  // 4. Insert new systems
  let success = 0;
  let errors = 0;

  for (const system of newSystems) {
    try {
      const itemName = String(system.Description).trim();
      const columnValues = buildRTTColumnValues(system, cap_datetime);

      const result = await createItem({
        boardId,
        groupId,
        itemName,
        columnValues
      });

      success++;
      console.log(`Created item: ${result.id} for ${itemName}`);
    } catch (err) {
      errors++;
      console.error(
        `Error creating item for ${system.Description}:`,
        err.message
      );
    }
  }

  const summary = {
    total: systems.length,
    existing: systems.length - newSystems.length,
    inserted: success,
    errors
  };

  console.log("RTT Feed All sync complete:", summary);
  return summary;
};

module.exports = rtt_feed_all;
