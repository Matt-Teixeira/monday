const { get_acu_equip_rtt } = require("../../api");
const {
  get_all_acumatica_rtt_feed,
  insert_db_rtt,
  insert_db_rtt_rmv,
  get_all_acumatica_rtt_feed_rmv
} = require("../../sql/qf-provider");
const { send_teams_card, diff_by_key } = require("../../tools");
const insert_to_mmb_cust = require("../update-mri-report-board/update-cust-workflow");

// TODO: use update_cust_workflow() to insert to mmb cust board

const { default: axios } = require("axios");

const update_rtt_board = async (cap_datetime) => {
  // Get systems from db
  const db_rtt_feed = await get_all_acumatica_rtt_feed();
  const db_rtt_feed_rmv = await get_all_acumatica_rtt_feed_rmv();

  console.log("\ndb_rtt_feed_rmv");
  console.log(db_rtt_feed_rmv);

  // Get rtt systems from api
  let api_rtt_feed = await get_acu_equip_rtt();
  api_rtt_feed = api_rtt_feed.value ?? [];

  // Delta Check
  const { added_rtt, removed_rtt } = diff_by_key(
    api_rtt_feed,
    db_rtt_feed,
    (item) => String(item.Description ?? item.description).trim()
  );

  // console.log("\n *** Need to INSERT into DB:", added_rtt);
  // console.log("\n *** Need to DELETE from DB:", removed_rtt);

  // Add to rmv table
  // build lookup set from DB
  const dbDescriptions = new Set(
    db_rtt_feed_rmv.map((item) => item.description.trim())
  );

  // items in API but not in DB
  const add_to_rmv = removed_rtt.filter(
    (item) => !dbDescriptions.has(item.description.trim())
  );

  for (let system of add_to_rmv) {
    await insert_db_rtt_rmv([system.description, system.capture_datetime]);
  }

  // New MRI systems in Acumatica and not in DB/Monday that will go to mmb-cust-workflow
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

    // Insert all to Monday: ACUMATICA-RTT-SYSTEMS && NEW-RTT-ADDITIONS
    if (added_rtt.length) {
      // ACUMATICA-RTT-SYSTEMS
      insert_monday_rtt(added_rtt, cap_datetime, "topics")
        .then(() => console.log("Done syncing RTT Feed to Monday"))
        .catch((e) => console.error("Fatal error syncing RTT feed:", e));

      // NEW-RTT-ADDITIONS
      insert_monday_rtt(added_rtt, cap_datetime, "group_mkzb5ahp")
        .then(() =>
          console.log("Done syncing New Additions to RTT Feed to Monday")
        )
        .catch((e) => console.error("Fatal error syncing New RTT Feed:", e));
    }

    // Insert to Monday: REMOVED-FROM-RTT
    if (add_to_rmv.length) {
      insert_monday_rtt(removed_rtt, cap_datetime, "group_mkzbkhkt")
        .then(() =>
          console.log("Done syncing removed systems to RTT Feed to Monday")
        )
        .catch((e) =>
          console.error("Fatal error syncing removed systems RTT Feed:", e)
        );
    }
  } catch (error) {
    console.log(error);
  }
};

// HELPER FUNCTIONS

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

async function insert_monday_rtt(systems, cap_datetime, board_name) {
  for (const rtt of systems) {
    try {
      const id = await createRttItem(rtt, cap_datetime, board_name);
      console.log(
        `Created RTT-FEED Item: ${id} for ${rtt.Description ?? rtt.description}`
      );
    } catch (err) {
      console.error(
        `Error creating item for ${rtt.Description}:`,
        err.response?.data || err.message
      );
    }
  }
}

// helper to normalize values (trim strings, handle nulls)
function norm(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function buildColumnValues(rtt, cap_datetime) {
  const cols = {
    // CustomerID
    text_mkyfbpee: norm(rtt.CustomerID ?? rtt.customerid),

    // LocationID
    text_mkyf6p0x: norm(rtt.LocationID ?? rtt.locationid),

    // ServiceContractID
    text_mkyfyhr0: norm(rtt.ServiceContractID ?? rtt.servicecontractid),

    // CustomerContractID
    text_mkyfba0y: norm(rtt.CustomerContractID ?? rtt.customercontractid),

    // EquipmentDescription
    text_mkyfyb98: norm(rtt.EquipmentDescription ?? rtt.equipmentdescription),

    // SerialNbr
    text_mkyfsnjp: norm(rtt.SerialNbr ?? rtt.serialnbr),

    // Status
    text_mkyfdta3: norm(rtt.Status ?? rtt.status),

    // Room
    text_mkyf4nqv: norm(rtt.Room ?? rtt.room),

    // SoftwareRelease
    text_mkyf6y7e: norm(rtt.SoftwareRelease ?? rtt.softwarerelease),

    // SystemIPAddress
    text_mkyftz9a: norm(rtt.SystemIPAddress ?? rtt.systemipaddress),

    // Modality
    text_mkyfk8xm: norm(rtt.Modality ?? rtt.modality),

    // ModelDescription
    text_mkyfnce5: norm(rtt.ModelDescription ?? rtt.modeldescription),

    // CustomerName
    text_mkyf9nmy: norm(rtt.CustomerName ?? rtt.customername),

    // LocationName
    text_mkyfw4xn: norm(rtt.LocationName ?? rtt.locationname),

    // AddressLine1
    text_mkyfzn5b: norm(rtt.AddressLine1 ?? rtt.addressline1),

    // AddressLine2
    text_mkyf6fmd: norm(rtt.AddressLine2 ?? rtt.addressline2),

    // City
    text_mkyfm6yt: norm(rtt.City ?? rtt.city),

    // State
    text_mkyfk2we: norm(rtt.State ?? rtt.state),

    // PostalCode
    text_mkyfp1vm: norm(rtt.PostalCode ?? rtt.postalcode),

    // Model
    text_mkyfek5s: norm(rtt.Model ?? rtt.model),

    // CustomerUniqueID
    text_mkyfc4e9: norm(rtt.CustomerUniqueID ?? rtt.customeruniqueid),

    // Manufacturer
    text_mkyf8pat: norm(rtt.Manufacturer ?? rtt.manufacturer),

    // LastPMCompleted
    text_mkyfmws4: norm(rtt.LastPMCompleted ?? rtt.lastpmcompleted),

    // PMFrequencyinmonths
    text_mkyf6jdh: norm(rtt.PMFrequencyinmonths ?? rtt.pmfrequencyinmonths),

    // LegacyEquipmentID
    text_mkyfy5m1: norm(rtt.LegacyEquipmentID ?? rtt.legacyequipmentid),

    // ShowonRemoteServicesWebsite
    text_mkyf3e0p: norm(
      rtt.ShowonRemoteServicesWebsite ?? rtt.showonremoteserviceswebsite
    ),

    // ServiceContractCustomerID
    text_mkyf5ccy: norm(
      rtt.ServiceContractCustomerID ?? rtt.servicecontractcustomerid
    ),

    // ServiceContractCustomerName
    text_mkyfgfhd: norm(
      rtt.ServiceContractCustomerName ?? rtt.servicecontractcustomername
    ),

    // CustomerContractCustomerID
    text_mkyfe84s: norm(
      rtt.CustomerContractCustomerID ?? rtt.customercontractcustomerid
    ),

    // CustomerContractCustomerName
    text_mkyfzd0g: norm(
      rtt.CustomerContractCustomerName ?? rtt.customercontractcustomername
    ),

    // ServiceContractStatus
    text_mkyft88f: norm(rtt.ServiceContractStatus ?? rtt.servicecontractstatus),

    // CustomerContractStatus
    text_mkyffwj2: norm(
      rtt.CustomerContractStatus ?? rtt.customercontractstatus
    ),

    // ServiceContractLocationID
    text_mkyf1hxh: norm(
      rtt.ServiceContractLocationID ?? rtt.servicecontractlocationid
    ),

    // ServiceContractLocationName
    text_mkyfs9mr: norm(
      rtt.ServiceContractLocationName ?? rtt.servicecontractlocationname
    ),

    // CustomerContractLocationID
    text_mkyfpqpd: norm(
      rtt.CustomerContractLocationID ?? rtt.customercontractlocationid
    ),

    // CustomerContractLocationName
    text_mkyftcwr: norm(
      rtt.CustomerContractLocationName ?? rtt.customercontractlocationname
    ),

    // ExpirationDate
    text_mkyf5kda: norm(rtt.ExpirationDate ?? rtt.expirationdate),

    // MMBControlNumber
    text_mkyffczk: norm(rtt.MMBControlNumber ?? rtt.mmbcontrolnumber),

    // IGAHCreated
    text_mkyfw4ya: norm(rtt.IGAHCreated ?? rtt.igahcreated),

    // IGAHCreatedBy
    text_mkyfrpcp: norm(rtt.IGAHCreatedBy ?? rtt.igahcreatedby),

    // IGAHUpdatedBy
    text_mkyf9r2g: norm(rtt.IGAHUpdatedBy ?? rtt.igahupdatedby),

    // IGAHUpdated
    text_mkyfv5dz: norm(rtt.IGAHUpdated ?? rtt.igahupdated),

    // IGAHActive (boolean → string)
    text_mkyf6kdy: norm(rtt.IGAHActive ?? rtt.igahactive),

    // RemoteConnectivityImplemeted
    text_mkyfrkz2: norm(
      rtt.RemoteConnectivityImplemeted ?? rtt.remoteconnectivityimplemeted
    ),

    // PrimaryEngineer
    text_mkyf17nb: norm(rtt.PrimaryEngineer ?? rtt.primaryengineer),

    // PrimaryEngineer_2
    text_mkyfvfxe: norm(rtt.PrimaryEngineer_2 ?? rtt.primaryengineer_2),

    // EmployeeName
    text_mkyfgxms: norm(rtt.EmployeeName ?? rtt.employeename),

    // SecondaryEngineer
    text_mkyfvdzx: norm(rtt.SecondaryEngineer ?? rtt.secondaryengineer),

    // SecondaryEngineer_2
    text_mkyfd9h7: norm(rtt.SecondaryEngineer_2 ?? rtt.secondaryengineer_2),

    // EmployeeName_2
    text_mkyfrrz9: norm(rtt.EmployeeName_2 ?? rtt.employeename_2),

    text_mkzdqcx3: norm(rtt.RemoteCoverage ?? rtt.remotecoverage),

    date_mkypgn4f: {
      date: cap_datetime.toISODate(),
      time: cap_datetime.toFormat("HH:mm:ss")
    }
  };

  // Monday expects column_values as a JSON string
  return JSON.stringify(cols);
}

async function createRttItem(rtt, cap_datetime, board_name) {
  const MONDAY_API_URL = "https://api.monday.com/v2";
  const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
  const BOARD_ID = process.env.MONDAY_BOARD_ID_3;
  const GROUP_ID = board_name;

  const mondayClient = axios.create({
    baseURL: MONDAY_API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_API_TOKEN
    }
  });

  const query = `
    mutation (
      $boardId: ID!,
      $groupId: String!,
      $itemName: String!,
      $columnValues: JSON!
    ) {
      create_item(
        board_id: $boardId,
        group_id: $groupId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const variables = {
    boardId: BOARD_ID,
    groupId: GROUP_ID,
    // what shows up in the "Name" column
    itemName: rtt.Description || rtt.description || "RTT Item",
    columnValues: buildColumnValues(rtt, cap_datetime)
  };

  const res = await mondayClient.post("", { query, variables });

  if (res.data.errors) {
    throw new Error(JSON.stringify(res.data.errors, null, 2));
  }

  return res.data.data.create_item.id;
}

module.exports = update_rtt_board;
