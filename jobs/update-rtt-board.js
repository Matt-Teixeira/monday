const { get_acu_equip_rtt } = require("../api");
const {
  get_all_acumatica_rtt_feed,
  insert_db_rtt
} = require("../sql/qf-provider");

const { default: axios } = require("axios");

const update_rtt_board = async () => {
  const db_data = await get_all_acumatica_rtt_feed();

  let acu_rtt_data = await get_acu_equip_rtt();
  acu_rtt_data = acu_rtt_data.value;

  const added_to_db = [];
  for (let rtt_system of acu_rtt_data) {
    const found = db_data.find(
      (system) => system.description === rtt_system.Description
    );

    if (!found) {
      let values_arr = [];
      for (let prop in rtt_system) {
        if (rtt_system[prop] === null || rtt_system[prop] == undefined) {
          values_arr.push(null);
        } else {
          values_arr.push(String(rtt_system[prop]).trim());
        }
      }
      added_to_db.push(rtt_system);
      await insert_db_rtt(values_arr);
    }
  }

  console.log("\nSYSTEMS ADDED");
  console.log(added_to_db);

  insert_monday(added_to_db)
    .then(() => console.log("Done syncing RTT feed to Monday"))
    .catch((e) => console.error("Fatal error syncing RTT feed:", e));
};

async function insert_monday(systems) {
  for (const rtt of systems) {
    try {
      const id = await createRttItem(rtt);
      console.log(`Created Monday item ${id} for ${rtt.Description}`);
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

function buildColumnValues(rtt) {
  const cols = {
    // CustomerID
    text_mkyfbpee: norm(rtt.CustomerID),

    // LocationID
    text_mkyf6p0x: norm(rtt.LocationID),

    // ServiceContractID
    text_mkyfyhr0: norm(rtt.ServiceContractID),

    // CustomerContractID
    text_mkyfba0y: norm(rtt.CustomerContractID),

    // EquipmentDescription
    text_mkyfyb98: norm(rtt.EquipmentDescription),

    // SerialNbr
    text_mkyfsnjp: norm(rtt.SerialNbr),

    // Status
    text_mkyfdta3: norm(rtt.Status),

    // Room
    text_mkyf4nqv: norm(rtt.Room),

    // SoftwareRelease
    text_mkyf6y7e: norm(rtt.SoftwareRelease),

    // SystemIPAddress
    text_mkyftz9a: norm(rtt.SystemIPAddress),

    // Modality
    text_mkyfk8xm: norm(rtt.Modality),

    // ModelDescription
    text_mkyfnce5: norm(rtt.ModelDescription),

    // CustomerName
    text_mkyf9nmy: norm(rtt.CustomerName),

    // LocationName
    text_mkyfw4xn: norm(rtt.LocationName),

    // AddressLine1
    text_mkyfzn5b: norm(rtt.AddressLine1),

    // AddressLine2
    text_mkyf6fmd: norm(rtt.AddressLine2),

    // City
    text_mkyfm6yt: norm(rtt.City),

    // State
    text_mkyfk2we: norm(rtt.State),

    // PostalCode
    text_mkyfp1vm: norm(rtt.PostalCode),

    // Model
    text_mkyfek5s: norm(rtt.Model),

    // CustomerUniqueID
    text_mkyfc4e9: norm(rtt.CustomerUniqueID),

    // Manufacturer
    text_mkyf8pat: norm(rtt.Manufacturer),

    // LastPMCompleted
    text_mkyfmws4: norm(rtt.LastPMCompleted),

    // PMFrequencyinmonths
    text_mkyf6jdh: norm(rtt.PMFrequencyinmonths),

    // LegacyEquipmentID
    text_mkyfy5m1: norm(rtt.LegacyEquipmentID),

    // ShowonRemoteServicesWebsite
    text_mkyf3e0p: norm(rtt.ShowonRemoteServicesWebsite),

    // ServiceContractCustomerID
    text_mkyf5ccy: norm(rtt.ServiceContractCustomerID),

    // ServiceContractCustomerName
    text_mkyfgfhd: norm(rtt.ServiceContractCustomerName),

    // CustomerContractCustomerID
    text_mkyfe84s: norm(rtt.CustomerContractCustomerID),

    // CustomerContractCustomerName
    text_mkyfzd0g: norm(rtt.CustomerContractCustomerName),

    // ServiceContractStatus
    text_mkyft88f: norm(rtt.ServiceContractStatus),

    // CustomerContractStatus
    text_mkyffwj2: norm(rtt.CustomerContractStatus),

    // ServiceContractLocationID
    text_mkyf1hxh: norm(rtt.ServiceContractLocationID),

    // ServiceContractLocationName
    text_mkyfs9mr: norm(rtt.ServiceContractLocationName),

    // CustomerContractLocationID
    text_mkyfpqpd: norm(rtt.CustomerContractLocationID),

    // CustomerContractLocationName
    text_mkyftcwr: norm(rtt.CustomerContractLocationName),

    // ExpirationDate
    text_mkyf5kda: norm(rtt.ExpirationDate),

    // MMBControlNumber
    text_mkyffczk: norm(rtt.MMBControlNumber),

    // IGAHCreated
    text_mkyfw4ya: norm(rtt.IGAHCreated),

    // IGAHCreatedBy
    text_mkyfrpcp: norm(rtt.IGAHCreatedBy),

    // IGAHUpdatedBy
    text_mkyf9r2g: norm(rtt.IGAHUpdatedBy),

    // IGAHUpdated
    text_mkyfv5dz: norm(rtt.IGAHUpdated),

    // IGAHActive (boolean → string)
    text_mkyf6kdy: norm(rtt.IGAHActive),

    // RemoteConnectivityImplemeted
    text_mkyfrkz2: norm(rtt.RemoteConnectivityImplemeted),

    // PrimaryEngineer
    text_mkyf17nb: norm(rtt.PrimaryEngineer),

    // PrimaryEngineer_2
    text_mkyfvfxe: norm(rtt.PrimaryEngineer_2),

    // EmployeeName
    text_mkyfgxms: norm(rtt.EmployeeName),

    // SecondaryEngineer
    text_mkyfvdzx: norm(rtt.SecondaryEngineer),

    // SecondaryEngineer_2
    text_mkyfd9h7: norm(rtt.SecondaryEngineer_2),

    // EmployeeName_2
    text_mkyfrrz9: norm(rtt.EmployeeName_2)
  };

  // Monday expects column_values as a JSON string
  return JSON.stringify(cols);
}

async function createRttItem(rtt) {
  const MONDAY_API_URL = "https://api.monday.com/v2";
  const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
  const BOARD_ID = process.env.MONDAY_BOARD_ID_3;
  const GROUP_ID = "topics";

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
    itemName: rtt.Description || rtt.EquipmentID || "RTT Item",
    columnValues: buildColumnValues(rtt)
  };

  const res = await mondayClient.post("", { query, variables });

  if (res.data.errors) {
    throw new Error(JSON.stringify(res.data.errors, null, 2));
  }

  return res.data.data.create_item.id;
}

module.exports = update_rtt_board;
