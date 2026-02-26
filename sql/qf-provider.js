const db = require("../db/pgPool");
const {
  get_acumatica_rtt_feed,
  insert_rtt_feed,
  insert_rtt_feed_rmv,
  get_acumatica_rtt_feed_rmv,
  get_he_level_all,
  get_he_pressure_all,
  get_comp_status,
  update_rtt_feed,
  get_hhm_status
} = require("./sql");

const get_all_acumatica_rtt_feed = async () => {
  try {
    return db.any(get_acumatica_rtt_feed.systems);
  } catch (error) {
    console.log(error);
  }
};

const insert_db_rtt = async (args) => {
  try {
    return db.any(insert_rtt_feed.systems, args);
  } catch (error) {
    console.log(error);
  }
};

const get_all_acumatica_rtt_feed_rmv = async () => {
  try {
    return db.any(get_acumatica_rtt_feed_rmv.systems);
  } catch (error) {
    console.log(error);
  }
};

const insert_db_rtt_rmv = async (args) => {
  try {
    return db.any(insert_rtt_feed_rmv.systems, args);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Convert a system object to values array and insert to DB
 * Handles null/undefined normalization for all properties
 *
 * @param {Object} system - RTT system object from API
 * @param {string} captureDatetime - ISO datetime string for capture_datetime
 * @returns {Promise<void>}
 */
const insertNewRttSystem = async (system, captureDatetime) => {
  const systemWithCapture = { ...system, capture_datetime: captureDatetime };
  const values = [];

  for (const prop in systemWithCapture) {
    const val = systemWithCapture[prop];
    if (val === null || val === undefined) {
      values.push(null);
    } else {
      values.push(String(val).trim());
    }
  }

  return insert_db_rtt(values);
};

// Explicit field order matching the UPDATE query ($2-$73)
const UPDATE_FIELD_ORDER = [
  'CustomerID', 'LocationID', 'ServiceContractID', 'CustomerContractID',
  'EquipmentDescription', 'SerialNbr', 'Status', 'Room', 'SoftwareRelease',
  'SystemIPAddress', 'Modality', 'ModelDescription', 'CustomerName',
  'LocationName', 'AddressLine1', 'AddressLine2', 'City', 'State',
  'PostalCode', 'Model', 'CustomerUniqueID', 'Manufacturer',
  'LastPMCompleted', 'PMFrequencyinmonths', 'LegacyEquipmentID',
  'ShowonRemoteServicesWebsite', 'ServiceContractCustomerID',
  'ServiceContractCustomerName', 'CustomerContractCustomerID',
  'CustomerContractCustomerName', 'ServiceContractStatus',
  'CustomerContractStatus', 'ServiceContractLocationID',
  'ServiceContractLocationName', 'CustomerContractLocationID',
  'CustomerContractLocationName', 'ExpirationDate', 'MMBControlNumber',
  'IGAHCreated', 'IGAHCreatedBy', 'IGAHUpdatedBy', 'IGAHUpdated',
  'IGAHActive', 'RemoteConnectivityImplemeted', 'PrimaryEngineer',
  'PrimaryEngineer_2', 'EmployeeName', 'SecondaryEngineer',
  'SecondaryEngineer_2', 'EmployeeName_2', 'Workgroup', 'BAWorkgroup',
  'RemoteCoverage', 'SCDesc', 'HostImplementationDate', 'RTTNotes',
  'SiteID', 'SiteID_2', 'RemoteConnectivityStatus', 'AccountID',
  'ManufacturerID', 'Model_2', 'AddressID', 'ManufacturerID_2',
  'EntityType', 'ContractID', 'ServiceContractID_2', 'EquipmentID',
  'AccountID_2', 'CustomerID_2', 'EquipmentNbr', 'Login'
];

const updateRttSystem = async (system, captureDatetime) => {
  const description = String(system.Description ?? "").trim();
  const values = [description]; // $1 = WHERE key

  for (const field of UPDATE_FIELD_ORDER) {
    const val = system[field];
    values.push(val === null || val === undefined ? null : String(val).trim());
  }

  values.push(captureDatetime); // $74 = capture_datetime

  return db.none(update_rtt_feed.systems, values);
};

const get_all_he_level = async () => {
  try {
    return db.any(get_he_level_all.systems);
  } catch (error) {
    console.log(error);
  }
};

const get_all_he_pressure = async () => {
  try {
    return db.any(get_he_pressure_all.systems);
  } catch (error) {
    console.log(error);
  }
};

const get_all_comp_status = async () => {
  try {
    return db.any(get_comp_status.systems);
  } catch (error) {
    console.log(error);
  }
};

const get_all_hhm_status = async () => {
  try {
    return db.any(get_hhm_status.systems);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  get_all_acumatica_rtt_feed,
  insert_db_rtt,
  insert_db_rtt_rmv,
  get_all_acumatica_rtt_feed_rmv,
  insertNewRttSystem,
  updateRttSystem,
  get_all_he_level,
  get_all_he_pressure,
  get_all_comp_status,
  get_all_hhm_status
};
