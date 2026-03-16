const { getMondayBoardItems } = require("../api/get-monday-board-items");
const { moveItemToGroup, changeColumnValues } = require("../api/monday-client");
const { getCoverageInfo } = require("../config/remote-coverage");
const mondayConfig = require("../config/monday-boards");
const {
  format_for_mmb_workflow,
  insert_to_mmb_cust
} = require("./update-mri-report-board/update-cust-workflow");
const {
  format_for_hhm_workflow,
  insert_to_hhm_cust
} = require("./update-hhm-report-board/update-hhm-workflow");

const SUB_GROUP_COLUMN_ID = mondayConfig.RTT_FEED.columns.SUB_GROUP;
const REMOTE_COVERAGE_COLUMN_ID = mondayConfig.RTT_FEED.columns.REMOTE_COVERAGE;
const MODALITY_COLUMN_ID = mondayConfig.RTT_FEED.columns.MODALITY;

/**
 * Extract column value text by column ID from Monday item
 */
function getColumnValue(item, columnId) {
  const column = item.column_values.find((col) => col.id === columnId);
  return column?.text?.trim() || "";
}

/**
 * Convert Monday item column values back to system object format
 * Maps Monday column IDs to API-style property names (all fields)
 */
function itemToSystemObject(item) {
  const getValue = (colId) => getColumnValue(item, colId);
  const cols = mondayConfig.RTT_FEED.columns;

  return {
    Description: item.name,
    CustomerID: getValue(cols.CUSTOMER_ID),
    LocationID: getValue(cols.LOCATION_ID),
    ServiceContractID: getValue(cols.SERVICE_CONTRACT_ID),
    CustomerContractID: getValue(cols.CUSTOMER_CONTRACT_ID),
    EquipmentDescription: getValue(cols.EQUIPMENT_DESCRIPTION),
    SerialNbr: getValue(cols.SERIAL_NBR),
    Status: getValue(cols.STATUS),
    Room: getValue(cols.ROOM),
    SoftwareRelease: getValue(cols.SOFTWARE_RELEASE),
    SystemIPAddress: getValue(cols.SYSTEM_IP_ADDRESS),
    Modality: getValue(cols.MODALITY),
    ModelDescription: getValue(cols.MODEL_DESCRIPTION),
    CustomerName: getValue(cols.CUSTOMER_NAME),
    LocationName: getValue(cols.LOCATION_NAME),
    AddressLine1: getValue(cols.ADDRESS_LINE1),
    AddressLine2: getValue(cols.ADDRESS_LINE2),
    City: getValue(cols.CITY),
    State: getValue(cols.STATE),
    PostalCode: getValue(cols.POSTAL_CODE),
    Model: getValue(cols.MODEL),
    CustomerUniqueID: getValue(cols.CUSTOMER_UNIQUE_ID),
    Manufacturer: getValue(cols.MANUFACTURER),
    LastPMCompleted: getValue(cols.LAST_PM_COMPLETED),
    PMFrequencyinmonths: getValue(cols.PM_FREQUENCY_IN_MONTHS),
    LegacyEquipmentID: getValue(cols.LEGACY_EQUIPMENT_ID),
    ShowonRemoteServicesWebsite: getValue(cols.SHOW_ON_REMOTE_SERVICES_WEBSITE),
    RemoteConnectivityImplemeted: getValue(cols.REMOTE_CONNECTIVITY_IMPLEMENTED),
    RemoteCoverage: getValue(cols.REMOTE_COVERAGE),
    ServiceContractCustomerID: getValue(cols.SERVICE_CONTRACT_CUSTOMER_ID),
    ServiceContractCustomerName: getValue(cols.SERVICE_CONTRACT_CUSTOMER_NAME),
    CustomerContractCustomerID: getValue(cols.CUSTOMER_CONTRACT_CUSTOMER_ID),
    CustomerContractCustomerName: getValue(cols.CUSTOMER_CONTRACT_CUSTOMER_NAME),
    ServiceContractStatus: getValue(cols.SERVICE_CONTRACT_STATUS),
    CustomerContractStatus: getValue(cols.CUSTOMER_CONTRACT_STATUS),
    ServiceContractLocationID: getValue(cols.SERVICE_CONTRACT_LOCATION_ID),
    ServiceContractLocationName: getValue(cols.SERVICE_CONTRACT_LOCATION_NAME),
    CustomerContractLocationID: getValue(cols.CUSTOMER_CONTRACT_LOCATION_ID),
    CustomerContractLocationName: getValue(cols.CUSTOMER_CONTRACT_LOCATION_NAME),
    ExpirationDate: getValue(cols.EXPIRATION_DATE),
    MMBControlNumber: getValue(cols.MMB_CONTROL_NUMBER),
    IGAHCreated: getValue(cols.IGAH_CREATED),
    IGAHCreatedBy: getValue(cols.IGAH_CREATED_BY),
    IGAHUpdatedBy: getValue(cols.IGAH_UPDATED_BY),
    IGAHUpdated: getValue(cols.IGAH_UPDATED),
    IGAHActive: getValue(cols.IGAH_ACTIVE),
    PrimaryEngineer: getValue(cols.PRIMARY_ENGINEER),
    PrimaryEngineer_2: getValue(cols.PRIMARY_ENGINEER_2),
    EmployeeName: getValue(cols.EMPLOYEE_NAME),
    SecondaryEngineer: getValue(cols.SECONDARY_ENGINEER),
    SecondaryEngineer_2: getValue(cols.SECONDARY_ENGINEER_2),
    EmployeeName_2: getValue(cols.EMPLOYEE_NAME_2),
    CaptureDateTime: getValue(cols.CAPTURE_DATETIME),
    SubGroup: getValue(cols.SUB_GROUP)
  };
}

/**
 * Process new RTT additions that have been assigned a Sub-Group
 * Routes systems to MMB and/or HHM boards based on RemoteCoverage
 */
const process_new_additions = async () => {
  console.log(
    "\n=== Processing NEW_ADDITIONS with Sub-Group assignments ===\n"
  );

  try {
    // Fetch items from NEW_ADDITIONS and TOPICS groups in parallel
    const [newAdditionsResult, topicsResult] = await Promise.all([
      getMondayBoardItems(mondayConfig.RTT_FEED.boardId, [mondayConfig.RTT_FEED.groups.NEW_ADDITIONS]),
      getMondayBoardItems(mondayConfig.RTT_FEED.boardId, [mondayConfig.RTT_FEED.groups.TOPICS])
    ]);

    const items = newAdditionsResult.items;
    const topicsItems = topicsResult.items;

    console.log(`Found ${items.length} total items in NEW_ADDITIONS group`);

    // Build name-to-item lookup for TOPICS group
    const topicsItemMap = new Map();
    for (const topicItem of topicsItems) {
      const name = topicItem.name?.trim();
      if (name) {
        topicsItemMap.set(name, topicItem);
      }
    }
    console.log(`Loaded ${topicsItemMap.size} TOPICS items for SUB_GROUP sync`);

    // Filter items that have Sub-Group assigned
    const itemsWithSubGroup = items.filter((item) => {
      const subGroup = getColumnValue(item, SUB_GROUP_COLUMN_ID);
      return subGroup && subGroup.length > 0;
    });

    console.log(
      `Found ${itemsWithSubGroup.length} items with Sub-Group assigned\n`
    );

    if (itemsWithSubGroup.length === 0) {
      console.log("No items to process. Exiting.");
      return { processed: 0, mmb: 0, hhm: 0, moved: 0, errors: 0 };
    }

    const WORKFLOW_PROCESSED_GROUP = mondayConfig.RTT_FEED.groups.WORKFLOW_PROCESSED;

    let mmbCount = 0;
    let hhmCount = 0;
    let movedCount = 0;
    let topicsUpdatedCount = 0;
    let errorCount = 0;

    for (const item of itemsWithSubGroup) {
      const remoteCoverage = getColumnValue(item, REMOTE_COVERAGE_COLUMN_ID);
      const subGroup = getColumnValue(item, SUB_GROUP_COLUMN_ID);
      const coverageInfo = getCoverageInfo(remoteCoverage);

      console.log(`\nProcessing: ${item.name}`);
      console.log(`  Sub-Group: ${subGroup}`);
      console.log(`  RemoteCoverage: ${remoteCoverage}`);
      console.log(`  MMB: ${coverageInfo.mmb}, HHM: ${coverageInfo.hhm}`);

      // Update matching TOPICS item with SUB_GROUP value
      const matchingTopicItem = topicsItemMap.get(item.name?.trim());
      if (matchingTopicItem) {
        try {
          await changeColumnValues({
            boardId: mondayConfig.RTT_FEED.boardId,
            itemId: matchingTopicItem.id,
            columnValues: JSON.stringify({ [SUB_GROUP_COLUMN_ID]: subGroup })
          });
          topicsUpdatedCount++;
          console.log(`  -> Updated SUB_GROUP on TOPICS item ${matchingTopicItem.id}`);
        } catch (topicErr) {
          console.error(`  -> WARN: Failed to update TOPICS item SUB_GROUP: ${topicErr.message}`);
        }
      } else {
        console.log(`  -> No matching TOPICS item found for "${item.name}"`);
      }

      // Convert Monday item to system object for workflow functions
      const system = itemToSystemObject(item);

      // Route to MMB based on coverage; MRI modality always routes to MMB
      const modality = getColumnValue(item, MODALITY_COLUMN_ID);
      let routeToMmb = coverageInfo.mmb === true;
      if (!routeToMmb && modality && modality.toUpperCase() === "MRI") {
        routeToMmb = true;
        console.log(`  -> Modality is MRI, routing to MMB`);
      }

      // Route to HHM based on coverage; default to HHM when coverage is unknown (null)
      let routeToHhm = coverageInfo.hhm === true;
      if (coverageInfo.hhm == null) {
        routeToHhm = true;
        console.log(`  -> Unknown/empty HHM coverage, defaulting to HHM`);
      }

      try {
        // Route to MMB if coverage or MRI modality
        if (routeToMmb) {
          console.log(`  -> Inserting to MMB-Cust-Workflow...`);
          const formatted = format_for_mmb_workflow(system);
          await insert_to_mmb_cust(formatted);
          console.log(`  -> Added to MMB Feed: ${formatted.name}`);
          mmbCount++;
        }

        // Route to HHM if coverage indicates hhm: true
        if (routeToHhm) {
          console.log(`  -> Inserting to HHM-Cust-Workflow...`);
          const formatted = format_for_hhm_workflow(system);
          await insert_to_hhm_cust(formatted);
          console.log(`  -> Added to HHM Feed: ${formatted.name}`);
          hhmCount++;
        }

        // Move to WORKFLOW_PROCESSED group after routing
        console.log(`  -> Moving to Workflow-Processed...`);
        await moveItemToGroup(item.id, WORKFLOW_PROCESSED_GROUP);
        movedCount++;
        console.log(`  -> Moved item ${item.id}`);
      } catch (err) {
        console.error(`  -> ERROR processing ${item.name}: ${err.message}`);
        errorCount++;
      }
    }

    console.log("\n=== Processing Complete ===");
    console.log(`Processed: ${itemsWithSubGroup.length}`);
    console.log(`Routed to MMB: ${mmbCount}`);
    console.log(`Routed to HHM: ${hhmCount}`);
    console.log(`TOPICS SUB_GROUP updated: ${topicsUpdatedCount}`);
    console.log(`Moved to Workflow-Processed: ${movedCount}`);
    console.log(`Errors: ${errorCount}`);

    return {
      processed: itemsWithSubGroup.length,
      mmb: mmbCount,
      hhm: hhmCount,
      topicsUpdated: topicsUpdatedCount,
      moved: movedCount,
      errors: errorCount
    };
  } catch (error) {
    console.error("Error in process_new_additions:", error);
    throw error;
  }
};

module.exports = process_new_additions;
