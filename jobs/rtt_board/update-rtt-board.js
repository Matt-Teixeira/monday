const { get_acu_equip_rtt } = require("../../api");
const {
  get_all_acumatica_rtt_feed,
  insert_db_rtt,
  insert_db_rtt_rmv,
  get_all_acumatica_rtt_feed_rmv
} = require("../../sql/qf-provider");
const { send_teams_card, diff_by_key } = require("../../tools");
const { insertRttSystems } = require("../../api/monday-client");
const { syncMissingDataFromSystems } = require("../sync-missing-data");
const insert_to_mmb_cust = require("../update-mri-report-board/update-cust-workflow");
const mondayConfig = require("../../config/monday-boards");

const update_rtt_board = async (cap_datetime) => {
  // Get systems from db
  const db_rtt_feed = await get_all_acumatica_rtt_feed();
  const db_rtt_feed_rmv = await get_all_acumatica_rtt_feed_rmv();

  // Get rtt systems from api
  let api_rtt_feed = await get_acu_equip_rtt();
  api_rtt_feed = api_rtt_feed.value ?? [];

  // Delta Check
  const { added_rtt, removed_rtt } = diff_by_key(
    api_rtt_feed,
    db_rtt_feed,
    (item) => String(item.Description ?? item.description).trim()
  );

  // Build lookup set for removed systems already in DB
  const dbDescriptions = new Set(
    db_rtt_feed_rmv.map((item) => item.description.trim())
  );

  // Items removed from API but not yet in removed table
  const add_to_rmv = removed_rtt.filter(
    (item) => !dbDescriptions.has(item.description.trim())
  );

  // Insert removed systems to tracking table
  for (let system of add_to_rmv) {
    await insert_db_rtt_rmv([system.description, system.capture_datetime]);
  }

  // Insert new systems to database and collect MRI systems for MMB workflow
  const to_mmb_workflow = [];
  for (let new_system of added_rtt) {
    new_system.capture_datetime = cap_datetime.toISO();
    let values_arr = [];
    for (let prop in new_system) {
      if (new_system[prop] === null || new_system[prop] == undefined) {
        values_arr.push(null);
      } else {
        values_arr.push(String(new_system[prop]).trim());
      }
    }
    await insert_db_rtt(values_arr);

    if (new_system.Modality === "MRI") to_mmb_workflow.push(new_system);
  }

  try {
    // MRI insert to Monday: mmb-cust-workflow

    for (const system of to_mmb_workflow) {
      console.log("NOW ADDING TO MMB FEED: " + system.Description);
      const formatted_obj = format_for_mmb_workflow(system);
      await insert_to_mmb_cust(formatted_obj);
      await send_teams_card(system);
      console.log(`\nAdded To MMB Feed: ${formatted_obj.name}\n`);
    }

    // 1. Insert new systems to TOPICS group
    if (added_rtt.length) {
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

      // 2. Insert new systems to NEW_ADDITIONS group
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

      // 3. Sync systems with missing required data to MISSING_DATA group
      console.log(
        `\nChecking ${added_rtt.length} new systems for missing required data...`
      );
      const missingDataResult = await syncMissingDataFromSystems(added_rtt, {
        skipDeltaCheck: true, // Skip delta check - these are new systems
        verbose: true
      });
      console.log(
        `Done syncing Missing Data (${missingDataResult.synced} synced, ${missingDataResult.errors} errors)`
      );
    }

    // 4. Insert removed systems to REMOVED group
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

function format_for_mmb_workflow(system) {
  return {
    name: system.Description ?? system.description,
    status: { label: "NEW" },
    text_mkxjfnc4: system.CustomerName,
    text_mkxjn0xh: system.CustomerContractLocationName,
    text_mkxjzsj3: "MRI",
    text_mkyfmb6e: system.Manufacturer,
    text_mkyfthry: system.CustomerUniqueID
  };
}

module.exports = update_rtt_board;
