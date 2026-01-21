const { get_acu_equip_rtt } = require("../api");
const {
  groupSystemsByCoverage,
  getGroupingStats,
  filterGroupedSystems,
  getSystemsByProperty
} = require("../tools/group-by-coverage");
const fs = require("fs");
const path = require("path");

/**
 * Job: Group RTT systems by Remote Coverage
 *
 * Fetches equipment data from Acumatica PROD_EQUIPMENT_URI and groups
 * systems by their RemoteCoverage property for analysis and processing.
 */
const group_by_coverage = async () => {
  console.log("\n=== Starting Remote Coverage Grouping Job ===\n");

  try {
    // Fetch data from Acumatica API
    console.log("Fetching RTT equipment data from Acumatica...");
    const api_response = await get_acu_equip_rtt();
    const systems = api_response.value ?? [];

    console.log(`Fetched ${systems.length} systems from API\n`);

    // Group systems by RemoteCoverage
    console.log("Grouping systems by RemoteCoverage...");
    const grouped = groupSystemsByCoverage(systems, {
      includeUnknown: true,
      includeDeprecated: true,
      useFuzzyMatch: true
    });

    // Get statistics
    const stats = getGroupingStats(grouped);

    // Display results
    console.log("\n=== Grouping Statistics ===");
    console.log(`Total Systems: ${stats.totalSystems}`);
    console.log(`Total Groups: ${stats.totalGroups}`);
    console.log(`Systems with Unknown Coverage: ${stats.unknownCount}`);
    console.log(`Systems with Missing Coverage: ${stats.missingCount}\n`);

    console.log("=== Coverage Type Breakdown ===");
    for (const [coverageType, count] of Object.entries(stats.byGroup)) {
      console.log(`  ${coverageType}: ${count} systems`);
    }

    // Display special groups
    if (stats.unknownCount > 0) {
      console.log("\n=== Unknown Coverage Values ===");
      grouped._unknown.forEach((system, idx) => {
        console.log(
          `  ${idx + 1}. ${system.Description} - Coverage: "${system._unmatchedCoverageValue}"`
        );
      });
    }

    if (stats.missingCount > 0) {
      console.log("\n=== Systems Missing RemoteCoverage ===");
      grouped._missing.forEach((system, idx) => {
        console.log(
          `  ${idx + 1}. ${system.Description} - No RemoteCoverage property`
        );
      });
    }

    // Example: Get HHM-enabled systems
    const hhmSystems = getSystemsByProperty(grouped, "hhm", true);
    console.log(`\n=== HHM-Enabled Systems: ${hhmSystems.length} ===`);

    // Example: Get MMB-enabled systems
    const mmbSystems = getSystemsByProperty(grouped, "mmb", true);
    console.log(`=== MMB-Enabled Systems: ${mmbSystems.length} ===`);

    // Example: Get systems with customer access
    const customerAccessSystems = getSystemsByProperty(
      grouped,
      "customerAccess",
      true
    );
    console.log(
      `=== Customer Access Enabled: ${customerAccessSystems.length} ===\n`
    );

    // Write grouped data to file for inspection
    const outputPath = path.join(__dirname, "..", "grouped-coverage-results.json");
    fs.writeFileSync(outputPath, JSON.stringify(grouped, null, 2), "utf8");
    console.log(`\n📄 Grouped results written to: ${outputPath}\n`);

    // Return grouped data for potential further processing
    return {
      grouped,
      stats,
      hhmSystems,
      mmbSystems,
      customerAccessSystems
    };
  } catch (error) {
    console.error("\n=== Error in group_by_coverage job ===");
    console.error(error.message);
    if (error.response) {
      console.error("API Response Status:", error.response.status);
      console.error("API Response Data:", error.response.data);
    }
    throw error;
  }
};

module.exports = group_by_coverage;
