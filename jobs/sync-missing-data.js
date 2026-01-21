/**
 * Sync Missing Data Job
 *
 * Can be used:
 * 1. Standalone: Run directly to scan all systems and sync missing data
 * 2. Integrated: Import syncMissingDataFromSystems() to process a subset
 */
require("dotenv").config();
const { get_acu_equip_rtt } = require("../api");
const { getMondayItemNames } = require("../api/get-monday-board-items");
const { insertRttSystems } = require("../api/monday-client");
const {
  findSystemsWithMissingData,
  getMissingDataStats
} = require("../tools/validate-required-fields");
const { requiredFields } = require("../config/required-fields");
const mondayConfig = require("../config/monday-boards");

const GROUP_ID = mondayConfig.RTT_FEED.groups.MISSING_DATA;
const BOARD_ID = mondayConfig.RTT_FEED.boardId;

/**
 * Sync systems with missing required data to Monday.com
 * Core function that can be called with any array of systems
 *
 * @param {Array} systems - Array of RTT system objects to check
 * @param {Object} [options] - Options
 * @param {boolean} [options.skipDeltaCheck=false] - Skip checking for existing items
 * @param {boolean} [options.verbose=true] - Log detailed progress
 * @returns {Promise<{synced: number, skipped: number, errors: number}>}
 */
async function syncMissingDataFromSystems(systems, options = {}) {
  const { skipDeltaCheck = false, verbose = true } = options;

  // Find systems with missing required data
  const systemsWithMissingData = findSystemsWithMissingData(systems);

  if (verbose) {
    console.log(
      `Found ${systemsWithMissingData.length} systems with missing data out of ${systems.length} total`
    );
  }

  if (systemsWithMissingData.length === 0) {
    return { synced: 0, skipped: 0, errors: 0 };
  }

  // Delta check - filter out systems already in Monday
  let systemsToAdd = systemsWithMissingData;
  let skippedCount = 0;

  if (!skipDeltaCheck) {
    try {
      if (verbose) {
        console.log("Checking for existing items in Monday...");
      }

      const existingDescriptions = await getMondayItemNames(BOARD_ID, GROUP_ID);

      systemsToAdd = systemsWithMissingData.filter((item) => {
        const description = String(item.system.Description ?? "").trim();
        const exists = existingDescriptions.has(description);

        if (exists && verbose) {
          console.log(`  Skipping ${description} - already exists`);
        }

        return description && !exists;
      });

      skippedCount = systemsWithMissingData.length - systemsToAdd.length;
    } catch (error) {
      console.warn("Could not fetch existing items, proceeding without delta check");
      console.warn(error.message);
    }
  }

  if (verbose) {
    console.log(`Systems to add: ${systemsToAdd.length}, skipped: ${skippedCount}`);
  }

  if (systemsToAdd.length === 0) {
    return { synced: 0, skipped: skippedCount, errors: 0 };
  }

  // Insert to Monday
  const systemObjects = systemsToAdd.map((item) => item.system);
  const result = await insertRttSystems(systemObjects, null, GROUP_ID, {
    delayMs: 500,
    logProgress: verbose
  });

  return {
    synced: result.success,
    skipped: skippedCount,
    errors: result.errors
  };
}

/**
 * Standalone job: Fetch all systems from API and sync missing data
 * Used when running this file directly
 */
async function syncMissingDataToMonday() {
  console.log("\n=== Starting Missing Required Data Sync Job ===\n");
  console.log(`Required fields: ${requiredFields.join(", ")}\n`);

  try {
    // Fetch systems from Acumatica API
    console.log("Fetching RTT equipment data from Acumatica...");
    const apiResponse = await get_acu_equip_rtt();
    const systems = apiResponse.value ?? [];
    console.log(`Fetched ${systems.length} systems from API\n`);

    // Get and display statistics
    const stats = getMissingDataStats(systems);
    console.log("=== Missing Data Statistics ===");
    console.log(`Total Systems: ${stats.totalSystems}`);
    console.log(`Systems with Complete Data: ${stats.systemsValid}`);
    console.log(`Systems with Missing Data: ${stats.systemsWithMissingData}\n`);

    console.log("Field-by-Field Breakdown:");
    for (const [field, fieldStats] of Object.entries(stats.fieldStats)) {
      console.log(
        `  ${field}: ${fieldStats.missingCount} missing (${fieldStats.missingPercentage}%)`
      );
    }
    console.log("");

    // Run the sync
    const result = await syncMissingDataFromSystems(systems, { verbose: true });

    console.log("\n=== Sync Complete ===");
    console.log(`Successfully synced: ${result.synced} systems`);
    console.log(`Errors: ${result.errors} systems`);
    console.log(`Skipped (already exist): ${result.skipped} systems`);

    return result;
  } catch (error) {
    console.error("\n=== Error in syncMissingDataToMonday job ===");
    console.error(error.message);
    throw error;
  }
}

module.exports = {
  syncMissingDataToMonday,
  syncMissingDataFromSystems
};

// Run if called directly
if (require.main === module) {
  syncMissingDataToMonday().catch(console.error);
}
