const { get_acu_equip_rtt } = require("../../api");
const {
  get_all_acumatica_rtt_feed,
  insert_db_rtt_rmv,
  get_all_acumatica_rtt_feed_rmv,
  insertNewRttSystem
} = require("../../sql/qf-provider");
const { diff_by_key, send_teams_card } = require("../../tools");
const { insertRttSystems } = require("../../api/monday-client");
const { findSystemsWithMissingData } = require("../../tools/validate-required-fields");
const mondayConfig = require("../../config/monday-boards");
const { getCoverageInfo } = require("../../config/remote-coverage");

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

  try {
    // Track removed systems in DB
    for (const system of add_to_rmv) {
      await insert_db_rtt_rmv([system.description, system.capture_datetime]);
    }

    // Insert new systems to DB
    for (const system of added_rtt) {
      await insertNewRttSystem(system, cap_datetime.toISO());
    }

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

      // Partition systems based on data completeness
      const systemsWithMissingData = findSystemsWithMissingData(added_rtt);
      const missingDataDescriptions = new Set(
        systemsWithMissingData.map((item) =>
          String(item.system.Description ?? item.system.description).trim()
        )
      );

      const completeDataSystems = added_rtt.filter((system) => {
        const desc = String(system.Description ?? system.description).trim();
        return !missingDataDescriptions.has(desc);
      });

      const missingDataSystems = systemsWithMissingData.map((item) => item.system);

      console.log(`\nPartitioned ${added_rtt.length} new systems:`);
      console.log(`  - ${completeDataSystems.length} with complete data`);
      console.log(`  - ${missingDataSystems.length} with missing data`);

      // 2. NEW_ADDITIONS group - only systems with complete data
      if (completeDataSystems.length > 0) {
        console.log(
          `\nInserting ${completeDataSystems.length} complete systems to NEW_ADDITIONS group...`
        );
        const newAdditionsResult = await insertRttSystems(
          completeDataSystems,
          cap_datetime,
          mondayConfig.RTT_FEED.groups.NEW_ADDITIONS
        );
        console.log(
          `Done syncing New Additions (${newAdditionsResult.success} success, ${newAdditionsResult.errors} errors)`
        );
      }

      // Send Teams cards for ALL new systems based on RemoteCoverage
      console.log(`\nSending Teams notifications for qualifying systems...`);
      let teamsCardsSent = 0;
      for (const system of added_rtt) {
        const coverageInfo = getCoverageInfo(system.RemoteCoverage);

        if (coverageInfo.mmb === true) {
          // await send_teams_card(system, "MMB");
          teamsCardsSent++;
        }
        if (coverageInfo.hhm === true) {
          // await send_teams_card(system, "HHM");
          teamsCardsSent++;
        }
      }
      console.log(`Sent ${teamsCardsSent} Teams notifications`);

      // 3. MISSING_DATA group - only systems missing required fields
      if (missingDataSystems.length > 0) {
        console.log(
          `\nInserting ${missingDataSystems.length} systems with missing data to MISSING_DATA group...`
        );
        const missingDataResult = await insertRttSystems(
          missingDataSystems,
          cap_datetime,
          mondayConfig.RTT_FEED.groups.MISSING_DATA
        );
        console.log(
          `Done syncing Missing Data (${missingDataResult.success} success, ${missingDataResult.errors} errors)`
        );
      }
    }

    // 4. Sync removed systems to REMOVED group
    if (add_to_rmv.length) {
      console.log(
        `\nInserting ${add_to_rmv.length} removed systems to REMOVED group...`
      );
      const removedResult = await insertRttSystems(
        add_to_rmv,
        cap_datetime,
        mondayConfig.RTT_FEED.groups.REMOVED
      );
      console.log(
        `Done syncing removed systems (${removedResult.success} success, ${removedResult.errors} errors)`
      );
    }
  } catch (error) {
    console.error("Error in update_rtt_board:", error);
    throw error;
  }
};

module.exports = update_rtt_board;
