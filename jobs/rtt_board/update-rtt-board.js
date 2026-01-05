const { get_acu_equip_rtt } = require("../../api");
const {
  get_all_acumatica_rtt_feed,
  insert_db_rtt
} = require("../../sql/qf-provider");
const { send_teams_card } = require("../../tools");
const insert_to_mmb_cust = require("../update-mri-report-board/update-cust-workflow");

// TODO: use update_cust_workflow() to insert to mmb cust board

const { default: axios } = require("axios");

const update_rtt_board = async (cap_datetime) => {
  // Get systems from db
  const db_data = await get_all_acumatica_rtt_feed();

  // Get rtt systems from api
  let acu_rtt_data = await get_acu_equip_rtt();
  acu_rtt_data = acu_rtt_data.value ?? [];

  const added_to_db = [];
  const to_mmb_workflow = [];
  for (let rtt_system of acu_rtt_data) {
    rtt_system.capture_datetime = cap_datetime.toISO();
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
      console.log("\nINSERTED:");
      console.log(rtt_system);

      if (rtt_system.Modality === "MRI") to_mmb_workflow.push(rtt_system);
    }
  }

  try {
    for (const system of to_mmb_workflow) {
      // MRI insert to Monday: mmb-cust-workflow
      console.log("NOW ADDING TO MMB FEED: " + system.Description);
      const formatted_obj = format_for_mmb_workflow(system);
      await insert_to_mmb_cust(formatted_obj);
      await send_teams_card(system);
      console.log(`\nAdded To MMB Feed: ${formatted_obj.name}\n`);
    }

    // Insert all to Monday: RTT-FEED
    insert_monday(added_to_db, cap_datetime)
      .then(() => console.log("Done syncing RTT feed to Monday"))
      .catch((e) => console.error("Fatal error syncing RTT feed:", e));
  } catch (error) {
    console.log(error);
  }
};

function format_for_mmb_workflow(system) {
  return {
    name: system.Description,
    status: { label: "NEW" },
    text_mkxjfnc4: system.CustomerName,
    text_mkxjn0xh: system.CustomerContractLocationName,
    text_mkxjzsj3: "MRI",
    text_mkyfmb6e: system.Manufacturer,
    text_mkyfthry: system.CustomerUniqueID
  };
}

async function insert_monday(systems, cap_datetime) {
  for (const rtt of systems) {
    try {
      const id = await createRttItem(rtt, cap_datetime);
      console.log(`Created RTT-FEED Item: ${id} for ${rtt.Description}`);
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
    text_mkyfrrz9: norm(rtt.EmployeeName_2),

    date_mkypgn4f: {
      date: cap_datetime.toISODate(),
      time: cap_datetime.toFormat("HH:mm:ss")
    }
  };

  // Monday expects column_values as a JSON string
  return JSON.stringify(cols);
}

async function createRttItem(rtt, cap_datetime) {
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
    columnValues: buildColumnValues(rtt, cap_datetime)
  };

  const res = await mondayClient.post("", { query, variables });

  if (res.data.errors) {
    throw new Error(JSON.stringify(res.data.errors, null, 2));
  }

  return res.data.data.create_item.id;
}

module.exports = update_rtt_board;

/* 
  {
    Description: 'SME16434',
    CustomerID: 'C112313                       ',
    LocationID: 'MAIN      ',
    ServiceContractID: 'AHS00003330',
    CustomerContractID: 'CPPAHS77  ',
    EquipmentDescription: 'Achieva',
    SerialNbr: '22286',
    Status: 'Active',
    Room: null,
    SoftwareRelease: null,
    SystemIPAddress: '172.16.19.67',
    Modality: 'MRI',
    ModelDescription: 'Achieva',
    CustomerName: 'UT Health East Olympic Center',
    LocationName: 'Primary Location',
    AddressLine1: '700 Olympic Circle',
    AddressLine2: null,
    City: 'Tyler',
    State: 'TX',
    PostalCode: '75701',
    Model: 'ACHIEVA 1.5T',
    CustomerUniqueID: null,
    Manufacturer: 'Philips Medical Systems',
    LastPMCompleted: null,
    PMFrequencyinmonths: null,
    LegacyEquipmentID: null,
    ShowonRemoteServicesWebsite: null,
    ServiceContractCustomerID: 'C112313                       ',
    ServiceContractCustomerName: 'UT Health East Olympic Center',
    CustomerContractCustomerID: 'C0151                         ',
    CustomerContractCustomerName: 'Renovo Solutions, LLC',
    ServiceContractStatus: 'Active',
    CustomerContractStatus: 'Active',
    ServiceContractLocationID: 'MAIN      ',
    ServiceContractLocationName: 'Primary Location',
    CustomerContractLocationID: 'SHIP073   ',
    CustomerContractLocationName: 'UT Health East Texas Physicians',
    ExpirationDate: '2026-02-28T00:00:00',
    MMBControlNumber: null,
    IGAHCreated: '2023-03-31T18:34:29.22',
    IGAHCreatedBy: 'angela.schwartz',
    IGAHUpdatedBy: 'michelle.brock',
    IGAHUpdated: '2024-04-11T16:01:02.82',
    IGAHActive: true,
    RemoteConnectivityImplemeted: true,
    PrimaryEngineer: null,
    PrimaryEngineer_2: 'LORTIZ                        ',
    EmployeeName: 'Ortiz, Luis',
    SecondaryEngineer: null,
    SecondaryEngineer_2: null,
    EmployeeName_2: null,
    Workgroup: 'Dallas',
    BAWorkgroup: 'Dallas',
    RemoteCoverage: 'RMM',
    SCDesc: 'CPPAHS77 - Magnet Monitoring - Monday-Sunday - 24 Hours (Exp 2/28/26)',
    HostImplementationDate: '2023-10-06T00:00:00',
    RTTNotes: null,
    SiteID: 'CE# 36541 / Philips ID: 42919096',
    SiteID_2: null,
    AccountID: 172599,
    ManufacturerID: 'PHILIPS        ',
    Model_2: 'ACHIEVA 1.5T',
    AddressID: 787151,
    ManufacturerID_2: 'PHILIPS        ',
    EntityType: 'Contract',
    ContractID: 4724,
    ServiceContractID_2: 'AHS00003330',
    EquipmentID: 'SME16434',
    AccountID_2: 'C112313                       ',
    CustomerID_2: 'C112313                       ',
    EquipmentNbr: 'SME16434',
    Login: 'russ.gregory'
  }

  "columns": [
          {
            "id": "name",
            "title": "Name",
            "type": "name"
          },
          {
            "id": "subtasks_mkyavr54",
            "title": "Subitems",
            "type": "subtasks"
          },
          {
            "id": "status",
            "title": "Status",
            "type": "status"
          },
          {
            "id": "board_relation_mkyasw0t",
            "title": "RemoteBox_Monday_Import",
            "type": "board_relation"
          },
          {
            "id": "lookup_mkyhd2n1",
            "title": "Mirror-Box",
            "type": "mirror"
          },
          {
            "id": "lookup_mkyaadp1",
            "title": "SSH-IP",
            "type": "mirror"
          },
          {
            "id": "text_mkxjfnc4",
            "title": "Customer-Name",
            "type": "text"
          },
          {
            "id": "text_mkxjrtzm",
            "title": "Sub-Group",
            "type": "text"
          },
          {
            "id": "text_mkxjn0xh",
            "title": "Site-Name",
            "type": "text"
          },
          {
            "id": "text_mkxjzsj3",
            "title": "Modality",
            "type": "text"
          },
          {
            "id": "text_mkyfmb6e",
            "title": "Manufacturer",
            "type": "text"
          },
          {
            "id": "text_mkyfvyhj",
            "title": "Model",
            "type": "text"
          },
          {
            "id": "text_mkyfthry",
            "title": "Serial",
            "type": "text"
          },
          {
            "id": "text_mkxjhw6v",
            "title": "Box-Assinged",
            "type": "text"
          },
          {
            "id": "text_mkxjfakx",
            "title": "NUC_MAC",
            "type": "text"
          },
          {
            "id": "text_mkxjzjjw",
            "title": "SSH-IP",
            "type": "text"
          },
          {
            "id": "text_mkxjhc6f",
            "title": "SVC",
            "type": "text"
          },
          {
            "id": "long_text_mkxjc4hr",
            "title": "Shipping-Info",
            "type": "long_text"
          },
          {
            "id": "long_text_mkxj53gr",
            "title": "Notes",
            "type": "long_text"
          },
          {
            "id": "person",
            "title": "Person",
            "type": "people"
          },
          {
            "id": "date4",
            "title": "Date",
            "type": "date"
          },
          {
            "id": "long_text_mkxq9d75",
            "title": "Internal-Notes",
            "type": "long_text"
          }
        ]
*/
