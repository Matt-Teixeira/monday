const { get_acu_equip_rtt } = require("../../api");
const {
  get_all_acumatica_rtt_feed,
  insert_db_rtt_rmv,
  get_all_acumatica_rtt_feed_rmv,
  insertNewRttSystem
} = require("../../sql/qf-provider");
const { diff_by_key } = require("../../tools");
const { insertRttSystems } = require("../../api/monday-client");
const { syncMissingDataFromSystems } = require("../sync-missing-data");
const mondayConfig = require("../../config/monday-boards");

const update_rtt_board = async (cap_datetime) => {
  // Get systems from DB and API
  const db_rtt_feed = await get_all_acumatica_rtt_feed();
  const db_rtt_feed_rmv = await get_all_acumatica_rtt_feed_rmv();
  const api_response = await get_acu_equip_rtt();
  const api_rtt_feed = api_response.value ?? [];

  // Delta check - find added and removed systems
  const { added_rtt, removed_rtt } = diff_by_key(
    api_rtt_feed,
    db_rtt_feed,
    (item) => String(item.Description ?? item.description).trim()
  );

  // Filter removed systems not yet tracked in DB
  const dbRemovedDescriptions = new Set(
    db_rtt_feed_rmv.map((item) => item.description.trim())
  );
  const add_to_rmv = removed_rtt.filter(
    (item) => !dbRemovedDescriptions.has(item.description.trim())
  );

  // Track removed systems in DB
  for (const system of add_to_rmv) {
    await insert_db_rtt_rmv([system.description, system.capture_datetime]);
  }

  // Insert new systems to DB
  for (const system of added_rtt) {
    await insertNewRttSystem(system, cap_datetime.toISO());
  }

  try {
    // Sync new systems to Monday boards
    if (added_rtt.length) {
      // 1. TOPICS group
      console.log(
        `\nInserting ${added_rtt.length} new systems to TOPICS group...`
      );
      const topicsResult = await insertRttSystems(
        added_rtt,
        cap_datetime,
        mondayConfig.RTT_FEED.groups.TOPICS
      );
      console.log(
        `Done syncing RTT Feed to Monday (${topicsResult.success} success, ${topicsResult.errors} errors)`
      );

      // 2. NEW_ADDITIONS group
      console.log(
        `\nInserting ${added_rtt.length} systems to NEW_ADDITIONS group...`
      );
      const newAdditionsResult = await insertRttSystems(
        added_rtt,
        cap_datetime,
        mondayConfig.RTT_FEED.groups.NEW_ADDITIONS
      );
      console.log(
        `Done syncing New Additions (${newAdditionsResult.success} success, ${newAdditionsResult.errors} errors)`
      );

      // 3. MISSING_DATA group
      console.log(
        `\nChecking ${added_rtt.length} new systems for missing required data...`
      );
      const missingDataResult = await syncMissingDataFromSystems(added_rtt, {
        skipDeltaCheck: true,
        verbose: true
      });
      console.log(
        `Done syncing Missing Data (${missingDataResult.synced} synced, ${missingDataResult.errors} errors)`
      );
    }

    // 4. Sync removed systems to REMOVED group
    if (add_to_rmv.length) {
      console.log(
        `\nInserting ${add_to_rmv.length} removed systems to REMOVED group...`
      );
      const removedResult = await insertRttSystems(
        removed_rtt,
        cap_datetime,
        mondayConfig.RTT_FEED.groups.REMOVED
      );
      console.log(
        `Done syncing removed systems (${removedResult.success} success, ${removedResult.errors} errors)`
      );
    }
  } catch (error) {
    console.error("Error in update_rtt_board:", error);
  }
};

module.exports = update_rtt_board;
