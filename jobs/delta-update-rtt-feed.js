const { get_acu_equip_rtt } = require("../api");
const { getMondayBoardItems } = require("../api/get-monday-board-items");
const { changeColumnValues, moveItemToGroup } = require("../api/monday-client");
const { validateSystem } = require("../tools/validate-required-fields");
const { updateRttSystem } = require("../sql/qf-provider");
const mondayConfig = require("../config/monday-boards");
const { buildRTTColumnValues, norm } = require("../tools/monday-column-mapper");

// Reverse lookup: column ID → human-readable name
const columnIdToName = Object.fromEntries(
  Object.entries(mondayConfig.RTT_FEED.columns).map(([name, id]) => [id, name])
);

// Build set of column IDs to skip during delta comparison and update payloads
const ignoreColIds = new Set(
  (mondayConfig.RTT_FEED.deltaIgnoreColumns ?? [])
    .map(name => mondayConfig.RTT_FEED.columns[name])
    .filter(Boolean)
);

const delta_update_rtt_feed = async (cap_datetime) => {
  console.log("\n=== Starting Delta Update RTT Feed ===\n");

  // 1. Fetch OData systems and build lookup map
  const apiResponse = await get_acu_equip_rtt();
  const odataSystems = apiResponse.value ?? [];
  console.log(`Fetched ${odataSystems.length} systems from OData`);

  const odataMap = new Map();
  for (const system of odataSystems) {
    const key = String(system.Description ?? "").trim();
    if (key) odataMap.set(key, system);
  }

  // 2. Fetch Monday items from TOPICS, NEW_ADDITIONS, and MISSING_DATA groups
  const boardId = mondayConfig.RTT_FEED.boardId;
  const { items } = await getMondayBoardItems(boardId, [
    mondayConfig.RTT_FEED.groups.TOPICS,
    mondayConfig.RTT_FEED.groups.NEW_ADDITIONS,
    mondayConfig.RTT_FEED.groups.MISSING_DATA
  ]);

  // 3. Partition items by group
  // TOPICS is the scan source; NEW_ADDITIONS is an update target; MISSING_DATA is scanned + validated
  const topicsItems = [];
  const newAdditionsMap = new Map();
  const missingDataItems = [];

  for (const item of items) {
    const name = item.name.trim();
    if (item.group.id === mondayConfig.RTT_FEED.groups.TOPICS) {
      topicsItems.push(item);
    } else if (item.group.id === mondayConfig.RTT_FEED.groups.NEW_ADDITIONS) {
      newAdditionsMap.set(name, item);
    } else if (item.group.id === mondayConfig.RTT_FEED.groups.MISSING_DATA) {
      missingDataItems.push(item);
    }
  }

  console.log(`Found ${topicsItems.length} items in TOPICS (scan source)`);
  console.log(`Found ${newAdditionsMap.size} items in NEW_ADDITIONS`);
  console.log(`Found ${missingDataItems.length} items in MISSING_DATA`);

  // Build set of valid column IDs from the board's actual columns
  const validColumnIds = new Set();
  for (const item of items) {
    for (const col of item.column_values) {
      validColumnIds.add(col.id);
    }
    if (validColumnIds.size > 0) break;
  }

  // 4. Compare and update
  let updated = 0;
  let skipped = 0;
  let noMatch = 0;
  let errors = 0;

  for (const mondayItem of topicsItems) {
    const description = mondayItem.name.trim();
    const odataSystem = odataMap.get(description);

    if (!odataSystem) {
      noMatch++;
      console.log(`  No OData match for: ${description}`);
      continue;
    }

    // Build expected column values from OData (without cap_datetime for comparison)
    const expectedJson = buildRTTColumnValues(odataSystem);
    const expected = JSON.parse(expectedJson);

    // Build current column values from Monday item
    const current = {};
    for (const col of mondayItem.column_values) {
      current[col.id] = norm(col.text);
    }

    // Compare: check if any mapped column differs
    // Skip ignored columns and columns that don't exist on the board
    let hasChanges = false;
    const changedFields = []; // { colId, name, before, after }
    for (const [colId, expectedVal] of Object.entries(expected)) {
      if (ignoreColIds.has(colId)) continue;
      if (!validColumnIds.has(colId)) continue;

      const currentVal = current[colId] ?? "";
      if (expectedVal !== currentVal) {
        hasChanges = true;
        changedFields.push({
          colId,
          name: columnIdToName[colId] || colId,
          before: currentVal,
          after: expectedVal
        });
      }
    }

    if (!hasChanges) {
      skipped++;
      continue;
    }

    console.log(`\n  Changes detected for: ${description}`);
    console.log(`    Monday Item ID: ${mondayItem.id}`);
    console.log(`    Timestamp: ${cap_datetime.toISO()}`);
    console.log(`    Changed fields (${changedFields.length}):`);
    for (const field of changedFields) {
      console.log(`      ${field.name}:`);
      console.log(`        before: "${field.before}"`);
      console.log(`        after:  "${field.after}"`);
    }

    // Build update payload with cap_datetime, stripping columns not on the board or ignored
    const updateObj = JSON.parse(buildRTTColumnValues(odataSystem, cap_datetime));
    for (const colId of Object.keys(updateObj)) {
      if (!validColumnIds.has(colId) || ignoreColIds.has(colId)) delete updateObj[colId];
    }
    const updateColumnValues = JSON.stringify(updateObj);

    try {
      // a. Update TOPICS item (the scanned item)
      await changeColumnValues({
        boardId,
        itemId: mondayItem.id,
        columnValues: updateColumnValues
      });
      console.log(`    Updated TOPICS item ${mondayItem.id}`);

      // b. Update NEW_ADDITIONS item (if exists)
      const newAdditionsItem = newAdditionsMap.get(description);
      if (newAdditionsItem) {
        await changeColumnValues({
          boardId,
          itemId: newAdditionsItem.id,
          columnValues: updateColumnValues
        });
        console.log(`    Updated NEW_ADDITIONS item ${newAdditionsItem.id}`);
      }

      // c. Update database row
      await updateRttSystem(odataSystem, cap_datetime.toISO());
      console.log(`    Updated database row`);

      updated++;
    } catch (err) {
      errors++;
      console.error(`    ERROR updating ${description}: ${err.message}`);
    }
  }

  console.log("\n--- TOPICS Summary ---");
  console.log(`  Scanned: ${topicsItems.length}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Unchanged: ${skipped}`);
  console.log(`  No OData match: ${noMatch}`);
  console.log(`  Errors: ${errors}`);

  // ===== Phase 2: MISSING_DATA delta update =====
  console.log("\n=== Phase 2: MISSING_DATA Delta Update ===\n");

  let mdUpdated = 0;
  let mdSkipped = 0;
  let mdNoMatch = 0;
  let mdErrors = 0;

  for (const mondayItem of missingDataItems) {
    const description = mondayItem.name.trim();
    const odataSystem = odataMap.get(description);

    if (!odataSystem) {
      mdNoMatch++;
      console.log(`  No OData match for: ${description}`);
      continue;
    }

    const expectedJson = buildRTTColumnValues(odataSystem);
    const expected = JSON.parse(expectedJson);

    const current = {};
    for (const col of mondayItem.column_values) {
      current[col.id] = norm(col.text);
    }

    let hasChanges = false;
    const changedFields = [];
    for (const [colId, expectedVal] of Object.entries(expected)) {
      if (ignoreColIds.has(colId)) continue;
      if (!validColumnIds.has(colId)) continue;

      const currentVal = current[colId] ?? "";
      if (expectedVal !== currentVal) {
        hasChanges = true;
        changedFields.push({
          colId,
          name: columnIdToName[colId] || colId,
          before: currentVal,
          after: expectedVal
        });
      }
    }

    if (!hasChanges) {
      mdSkipped++;
      continue;
    }

    console.log(`\n  Changes detected for: ${description}`);
    console.log(`    Monday Item ID: ${mondayItem.id}`);
    console.log(`    Timestamp: ${cap_datetime.toISO()}`);
    console.log(`    Changed fields (${changedFields.length}):`);
    for (const field of changedFields) {
      console.log(`      ${field.name}:`);
      console.log(`        before: "${field.before}"`);
      console.log(`        after:  "${field.after}"`);
    }

    const updateObj = JSON.parse(buildRTTColumnValues(odataSystem, cap_datetime));
    for (const colId of Object.keys(updateObj)) {
      if (!validColumnIds.has(colId) || ignoreColIds.has(colId)) delete updateObj[colId];
    }
    const updateColumnValues = JSON.stringify(updateObj);

    try {
      await changeColumnValues({
        boardId,
        itemId: mondayItem.id,
        columnValues: updateColumnValues
      });
      console.log(`    Updated MISSING_DATA item ${mondayItem.id}`);

      mdUpdated++;
    } catch (err) {
      mdErrors++;
      console.error(`    ERROR updating ${description}: ${err.message}`);
    }
  }

  console.log("\n--- MISSING_DATA Summary ---");
  console.log(`  Scanned: ${missingDataItems.length}`);
  console.log(`  Updated: ${mdUpdated}`);
  console.log(`  Unchanged: ${mdSkipped}`);
  console.log(`  No OData match: ${mdNoMatch}`);
  console.log(`  Errors: ${mdErrors}`);

  // ===== Phase 3: MISSING_DATA → NEW_ADDITIONS promotion =====
  console.log("\n=== Phase 3: MISSING_DATA Promotion Check ===\n");

  let promoted = 0;
  let promotionErrors = 0;

  for (const mondayItem of missingDataItems) {
    const description = mondayItem.name.trim();
    const odataSystem = odataMap.get(description);

    if (!odataSystem) continue;

    const { isValid, missingFields } = validateSystem(odataSystem);

    if (!isValid) {
      continue;
    }

    try {
      await moveItemToGroup(mondayItem.id, mondayConfig.RTT_FEED.groups.NEW_ADDITIONS);
      console.log(`  Promoted: ${description} → NEW_ADDITIONS`);
      promoted++;
    } catch (err) {
      promotionErrors++;
      console.error(`  ERROR promoting ${description}: ${err.message}`);
    }
  }

  console.log("\n--- Promotion Summary ---");
  console.log(`  Promoted to NEW_ADDITIONS: ${promoted}`);
  console.log(`  Errors: ${promotionErrors}`);

  console.log("\n=== Delta Update Complete ===");
};

module.exports = delta_update_rtt_feed;
