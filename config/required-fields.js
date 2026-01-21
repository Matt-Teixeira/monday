/**
 * Configuration for required fields validation
 *
 * This file defines which fields are critical and must have values
 * for systems in the Acumatica RTT feed.
 *
 * To add or remove required fields, simply update the array below.
 * The field names should match the property names from the OData API response.
 */

const requiredFields = [
  "Description",      // Equipment ID
  "Modality",         // System type (MRI, CT, etc.)
  "AddressLine1",     // Street address
  "Manufacturer",     // Equipment manufacturer name
  "ManufacturerID",    // Manufacturer identifier
  "RemoteCoverage"
];

/**
 * Optional: Field descriptions for reporting and documentation
 */
const fieldDescriptions = {
  Description: "Equipment ID - Unique identifier for the system",
  Modality: "System Type - Type of medical equipment (MRI, CT, CATH, etc.)",
  AddressLine1: "Street Address - Primary location address",
  Manufacturer: "Manufacturer Name - Full name of equipment manufacturer",
  ManufacturerID: "Manufacturer ID - Internal manufacturer identifier"
};

/**
 * Optional: Field display names for Monday.com or reports
 */
const fieldDisplayNames = {
  Description: "Equipment ID",
  Modality: "System Type",
  AddressLine1: "Address",
  Manufacturer: "Manufacturer",
  ManufacturerID: "Mfr ID"
};

module.exports = {
  requiredFields,
  fieldDescriptions,
  fieldDisplayNames
};
