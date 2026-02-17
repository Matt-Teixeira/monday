const { getMondayBoardItems } = require("../api/get-monday-board-items");
const { changeColumnValues } = require("../api/monday-client");
const { get_all_he_level, get_all_he_pressure, get_all_comp_status } = require("../sql/qf-provider");
const mondayConfig = require("../config/monday-boards");

const boardId = mondayConfig.MMB_CUST_WORKFLOW.boardId;
const groupId = mondayConfig.MMB_CUST_WORKFLOW.groups.ACTIVE_MAINTENANCE;
const HE_LEVEL = mondayConfig.MMB_CUST_WORKFLOW.columns.HE_LEVEL;
const HE_PRESSURE = mondayConfig.MMB_CUST_WORKFLOW.columns.HE_PRESSURE;
const COMPRESSOR_STATUS = mondayConfig.MMB_CUST_WORKFLOW.columns.COMPRESSOR_STATUS;
const MAG_CAPTURE_DATETIME = mondayConfig.MMB_CUST_WORKFLOW.columns.MAG_CAPTURE_DATETIME;
const EDU_CAPTURE_DATETIME = mondayConfig.MMB_CUST_WORKFLOW.columns.EDU_CAPTURE_DATETIME;

const update_mmb_he_data = async () => {
  // 1. Query DB for He-Level, HE-Pressure, and Compressor Status data
  const [heLevelData, hePressureData, compStatusData] = await Promise.all([
    get_all_he_level(),
    get_all_he_pressure(),
    get_all_comp_status()
  ]);
  console.log(`Fetched ${heLevelData.length} He-Level rows from database`);
  console.log(`Fetched ${hePressureData.length} HE-Pressure rows from database`);
  console.log(`Fetched ${compStatusData.length} Compressor-Status rows from database`);

  // 2. Merge by system_id
  const mergedMap = new Map();

  for (const row of heLevelData) {
    const id = String(row.system_id).trim();
    mergedMap.set(id, { heLevel: row.rpp_value, magCaptureDateTime: row.capture_datetime });
  }

  for (const row of hePressureData) {
    const id = String(row.system_id).trim();
    const existing = mergedMap.get(id) || {};
    existing.hePressure = row.rpp_value;
    if (!existing.magCaptureDateTime) {
      existing.magCaptureDateTime = row.capture_datetime;
    }
    mergedMap.set(id, existing);
  }

  for (const row of compStatusData) {
    const id = String(row.system_id).trim();
    const existing = mergedMap.get(id) || {};
    existing.compVibStatus = row.comp_vib_status;
    existing.eduDatetime = row.edu_datetime;
    mergedMap.set(id, existing);
  }

  // 3. Fetch existing items from Active & Maintenance group
  const { items } = await getMondayBoardItems(boardId, groupId);
  console.log(`Found ${items.length} items in Active & Maintenance group`);

  // 4. Build lookup map: item name -> item id
  const itemMap = new Map();
  for (const item of items) {
    itemMap.set(item.name.trim(), item.id);
  }

  // 5. Match and update
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const skippedSystems = [];

  for (const [systemId, data] of mergedMap) {
    const itemId = itemMap.get(systemId);

    if (!itemId) {
      skipped++;
      skippedSystems.push({ systemId, ...data });
      continue;
    }

    try {
      const cols = {};

      if (data.heLevel != null) {
        cols[HE_LEVEL] = data.heLevel;
      }

      if (data.hePressure != null) {
        cols[HE_PRESSURE] = data.hePressure;
      }

      if (data.compVibStatus != null) {
        cols[COMPRESSOR_STATUS] = data.compVibStatus ? "on" : "off";
      }

      if (data.magCaptureDateTime) {
        const dt = new Date(data.magCaptureDateTime);
        const datePart = dt.toISOString().split("T")[0];
        const timePart = dt.toTimeString().split(" ")[0]; // HH:mm:ss in local time
        cols[MAG_CAPTURE_DATETIME] = { date: datePart, time: timePart };
      }

      if (data.eduDatetime != null) {
        cols[EDU_CAPTURE_DATETIME] = String(data.eduDatetime);
      }

      if (Object.keys(cols).length === 0) {
        skipped++;
        continue;
      }

      await changeColumnValues({ boardId, itemId, columnValues: JSON.stringify(cols) });
      updated++;
      console.log(`Updated ${systemId}: He-Level=${data.heLevel}, HE-Pressure=${data.hePressure}, Comp-Status=${data.compVibStatus}`);
    } catch (err) {
      errors++;
      console.error(`Error updating ${systemId}:`, err.message);
    }
  }

  const summary = { updated, skipped, errors };
  console.log("MMB He data update complete:", summary);

  if (skippedSystems.length > 0) {
    console.log("Skipped systems (no matching board item):");
    console.table(skippedSystems);
  }
  return summary;
};

module.exports = update_mmb_he_data;
