/**
 * Centralized Monday.com column mapping utilities for RTT board
 * This provides a single source of truth for column value mappings
 */

/**
 * Helper to normalize values (trim strings, handle nulls)
 */
function norm(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

/**
 * Build column values object for Monday.com RTT board items
 * Handles both API response format (PascalCase) and database format (lowercase)
 *
 * @param {Object} system - RTT system object from API or database
 * @param {Object} cap_datetime - Optional DateTime object for capture timestamp
 * @returns {string} JSON stringified column values for Monday API
 */
function buildRTTColumnValues(system, cap_datetime = null) {
  const cols = {
    // CustomerID
    text_mkyfbpee: norm(system.CustomerID ?? system.customerid),

    // LocationID
    text_mkyf6p0x: norm(system.LocationID ?? system.locationid),

    // ServiceContractID
    text_mkyfyhr0: norm(system.ServiceContractID ?? system.servicecontractid),

    // CustomerContractID
    text_mkyfba0y: norm(system.CustomerContractID ?? system.customercontractid),

    // EquipmentDescription
    text_mkyfyb98: norm(system.EquipmentDescription ?? system.equipmentdescription),

    // SerialNbr
    text_mkyfsnjp: norm(system.SerialNbr ?? system.serialnbr),

    // Status
    text_mkyfdta3: norm(system.Status ?? system.status),

    // Room
    text_mkyf4nqv: norm(system.Room ?? system.room),

    // SoftwareRelease
    text_mkyf6y7e: norm(system.SoftwareRelease ?? system.softwarerelease),

    // SystemIPAddress
    text_mkyftz9a: norm(system.SystemIPAddress ?? system.systemipaddress),

    // Modality
    text_mkyfk8xm: norm(system.Modality ?? system.modality),

    // ModelDescription
    text_mkyfnce5: norm(system.ModelDescription ?? system.modeldescription),

    // CustomerName
    text_mkyf9nmy: norm(system.CustomerName ?? system.customername),

    // LocationName
    text_mkyfw4xn: norm(system.LocationName ?? system.locationname),

    // AddressLine1
    text_mkyfzn5b: norm(system.AddressLine1 ?? system.addressline1),

    // AddressLine2
    text_mkyf6fmd: norm(system.AddressLine2 ?? system.addressline2),

    // City
    text_mkyfm6yt: norm(system.City ?? system.city),

    // State
    text_mkyfk2we: norm(system.State ?? system.state),

    // PostalCode
    text_mkyfp1vm: norm(system.PostalCode ?? system.postalcode),

    // Model
    text_mkyfek5s: norm(system.Model ?? system.model),

    // CustomerUniqueID
    text_mkyfc4e9: norm(system.CustomerUniqueID ?? system.customeruniqueid),

    // Manufacturer
    text_mkyf8pat: norm(system.Manufacturer ?? system.manufacturer),

    // LastPMCompleted
    text_mkyfmws4: norm(system.LastPMCompleted ?? system.lastpmcompleted),

    // PMFrequencyinmonths
    text_mkyf6jdh: norm(system.PMFrequencyinmonths ?? system.pmfrequencyinmonths),

    // LegacyEquipmentID
    text_mkyfy5m1: norm(system.LegacyEquipmentID ?? system.legacyequipmentid),

    // ShowonRemoteServicesWebsite
    text_mkyf3e0p: norm(
      system.ShowonRemoteServicesWebsite ?? system.showonremoteserviceswebsite
    ),

    // ServiceContractCustomerID
    text_mkyf5ccy: norm(
      system.ServiceContractCustomerID ?? system.servicecontractcustomerid
    ),

    // ServiceContractCustomerName
    text_mkyfgfhd: norm(
      system.ServiceContractCustomerName ?? system.servicecontractcustomername
    ),

    // CustomerContractCustomerID
    text_mkyfe84s: norm(
      system.CustomerContractCustomerID ?? system.customercontractcustomerid
    ),

    // CustomerContractCustomerName
    text_mkyfzd0g: norm(
      system.CustomerContractCustomerName ?? system.customercontractcustomername
    ),

    // ServiceContractStatus
    text_mkyft88f: norm(system.ServiceContractStatus ?? system.servicecontractstatus),

    // CustomerContractStatus
    text_mkyffwj2: norm(
      system.CustomerContractStatus ?? system.customercontractstatus
    ),

    // ServiceContractLocationID
    text_mkyf1hxh: norm(
      system.ServiceContractLocationID ?? system.servicecontractlocationid
    ),

    // ServiceContractLocationName
    text_mkyfs9mr: norm(
      system.ServiceContractLocationName ?? system.servicecontractlocationname
    ),

    // CustomerContractLocationID
    text_mkyfpqpd: norm(
      system.CustomerContractLocationID ?? system.customercontractlocationid
    ),

    // CustomerContractLocationName
    text_mkyftcwr: norm(
      system.CustomerContractLocationName ?? system.customercontractlocationname
    ),

    // ExpirationDate
    text_mkyf5kda: norm(system.ExpirationDate ?? system.expirationdate),

    // MMBControlNumber
    text_mkyffczk: norm(system.MMBControlNumber ?? system.mmbcontrolnumber),

    // IGAHCreated
    text_mkyfw4ya: norm(system.IGAHCreated ?? system.igahcreated),

    // IGAHCreatedBy
    text_mkyfrpcp: norm(system.IGAHCreatedBy ?? system.igahcreatedby),

    // IGAHUpdatedBy
    text_mkyf9r2g: norm(system.IGAHUpdatedBy ?? system.igahupdatedby),

    // IGAHUpdated
    text_mkyfv5dz: norm(system.IGAHUpdated ?? system.igahupdated),

    // IGAHActive (boolean → string)
    text_mkyf6kdy: norm(system.IGAHActive ?? system.igahactive),

    // RemoteConnectivityImplemeted
    text_mkyfrkz2: norm(
      system.RemoteConnectivityImplemeted ?? system.remoteconnectivityimplemeted
    ),

    // PrimaryEngineer
    text_mkyf17nb: norm(system.PrimaryEngineer ?? system.primaryengineer),

    // PrimaryEngineer_2
    text_mkyfvfxe: norm(system.PrimaryEngineer_2 ?? system.primaryengineer_2),

    // EmployeeName
    text_mkyfgxms: norm(system.EmployeeName ?? system.employeename),

    // SecondaryEngineer
    text_mkyfvdzx: norm(system.SecondaryEngineer ?? system.secondaryengineer),

    // SecondaryEngineer_2
    text_mkyfd9h7: norm(system.SecondaryEngineer_2 ?? system.secondaryengineer_2),

    // EmployeeName_2
    text_mkyfrrz9: norm(system.EmployeeName_2 ?? system.employeename_2),

    // RemoteCoverage
    text_mkzdqcx3: norm(system.RemoteCoverage ?? system.remotecoverage)
  };

  // Add ManufacturerID if present (used in sync-missing-data.js)
  if (system.ManufacturerID !== undefined || system.manufacturerid !== undefined) {
    cols.text_mkyfhzrz = norm(system.ManufacturerID ?? system.manufacturerid);
  }

  // Add capture datetime if provided (used in update-rtt-board.js)
  if (cap_datetime) {
    cols.date_mkypgn4f = {
      date: cap_datetime.toISODate(),
      time: cap_datetime.toFormat("HH:mm:ss")
    };
  }

  // Monday expects column_values as a JSON string
  return JSON.stringify(cols);
}

module.exports = {
  buildRTTColumnValues,
  norm
};
