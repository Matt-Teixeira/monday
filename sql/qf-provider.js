const db = require("../db/pgPool");
const pgp = db.$config.pgp; // reuse the already-initialized pg-promise instance
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
    console.error(error);
    throw error;
  }
};

const insert_db_rtt = async (args) => {
  try {
    return db.any(insert_rtt_feed.systems, args);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get_all_acumatica_rtt_feed_rmv = async () => {
  try {
    return db.any(get_acumatica_rtt_feed_rmv.systems);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const insert_db_rtt_rmv = async (args) => {
  try {
    return db.any(insert_rtt_feed_rmv.systems, args);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Explicit field order matching the INSERT query ($1-$73, $74=capture_datetime)
const INSERT_FIELD_ORDER = [
  'Description', 'CustomerID', 'LocationID', 'ServiceContractID',
  'CustomerContractID', 'EquipmentDescription', 'SerialNbr', 'Status',
  'Room', 'SoftwareRelease', 'SystemIPAddress', 'Modality',
  'ModelDescription', 'CustomerName', 'LocationName', 'AddressLine1',
  'AddressLine2', 'City', 'State', 'PostalCode', 'Model',
  'CustomerUniqueID', 'Manufacturer', 'LastPMCompleted',
  'PMFrequencyinmonths', 'LegacyEquipmentID', 'ShowonRemoteServicesWebsite',
  'ServiceContractCustomerID', 'ServiceContractCustomerName',
  'CustomerContractCustomerID', 'CustomerContractCustomerName',
  'ServiceContractStatus', 'CustomerContractStatus',
  'ServiceContractLocationID', 'ServiceContractLocationName',
  'CustomerContractLocationID', 'CustomerContractLocationName',
  'ExpirationDate', 'MMBControlNumber', 'IGAHCreated', 'IGAHCreatedBy',
  'IGAHUpdatedBy', 'IGAHUpdated', 'IGAHActive',
  'RemoteConnectivityImplemeted', 'PrimaryEngineer', 'PrimaryEngineer_2',
  'EmployeeName', 'SecondaryEngineer', 'SecondaryEngineer_2',
  'EmployeeName_2', 'Workgroup', 'BAWorkgroup', 'RemoteCoverage',
  'SCDesc', 'HostImplementationDate', 'RTTNotes', 'SiteID', 'SiteID_2',
  'RemoteConnectivityStatus', 'AccountID', 'ManufacturerID', 'Model_2',
  'AddressID', 'ManufacturerID_2', 'EntityType', 'ContractID',
  'ServiceContractID_2', 'EquipmentID', 'AccountID_2', 'CustomerID_2',
  'EquipmentNbr', 'Login'
];

/**
 * Convert a system object to values array and insert to DB
 * Uses explicit field order to match SQL INSERT column positions
 *
 * @param {Object} system - RTT system object from API
 * @param {string} captureDatetime - ISO datetime string for capture_datetime
 * @returns {Promise<void>}
 */
const insertNewRttSystem = async (system, captureDatetime) => {
  const values = INSERT_FIELD_ORDER.map((field) => {
    const val = system[field];
    return val == null ? null : String(val).trim();
  });
  values.push(captureDatetime); // $74 = capture_datetime

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

  // Return the affected row count so callers can detect a no-op UPDATE
  // (Description not present in the DB) instead of silently assuming success.
  return db.result(update_rtt_feed.systems, values, (r) => r.rowCount);
};

const get_all_he_level = async () => {
  try {
    return db.any(get_he_level_all.systems);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get_all_he_pressure = async () => {
  try {
    return db.any(get_he_pressure_all.systems);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get_all_comp_status = async () => {
  try {
    return db.any(get_comp_status.systems);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const get_all_hhm_status = async () => {
  try {
    return db.any(get_hhm_status.systems);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ColumnSet for batch-inserting field-level change rows (defined once at load).
// inserted_at is omitted so the DB default (now()) fills it.
const rttChangesCS = new pgp.helpers.ColumnSet(
  [
    "description",
    "monday_item_id",
    "board_id",
    "group_id",
    "column_id",
    "column_name",
    "before_value",
    "after_value",
    "capture_datetime",
    "job_name"
  ],
  { table: { table: "rtt_feed_changes", schema: "monday" } }
);

/**
 * Batch-insert field-level change rows into monday.rtt_feed_changes.
 * No-op on empty input. Returns the number of rows inserted.
 *
 * @param {Array<Object>} rows - objects matching rttChangesCS columns
 * @returns {Promise<number>}
 */
const logRttFeedChanges = async (rows) => {
  if (!rows || rows.length === 0) return 0;
  await db.none(pgp.helpers.insert(rows, rttChangesCS));
  return rows.length;
};

/**
 * Read change-history rows, newest first. Optionally filter to changes at or
 * after a given ISO timestamp.
 *
 * @param {string|null} sinceIso - ISO timestamp lower bound, or null for all
 * @returns {Promise<Array<Object>>}
 */
const getRecentRttFeedChanges = async (sinceIso = null) =>
  db.any(
    `SELECT description, column_name, column_id, before_value, after_value,
            group_id, monday_item_id, capture_datetime, job_name
       FROM monday.rtt_feed_changes
      WHERE ($1::timestamptz IS NULL OR capture_datetime >= $1)
      ORDER BY capture_datetime DESC, description, column_name`,
    [sinceIso]
  );

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
  get_all_hhm_status,
  logRttFeedChanges,
  getRecentRttFeedChanges
};
