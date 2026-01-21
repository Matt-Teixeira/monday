/**
 * Monday.com Board Configuration
 * Single source of truth for all board IDs, group IDs, and column IDs
 */

module.exports = {
  /**
   * RTT Feed Board Configuration
   */
  RTT_FEED: {
    boardId: process.env.MONDAY_BOARD_ID_3,

    groups: {
      TOPICS: 'topics',
      NEW_ADDITIONS: 'group_mkzb5ahp',
      REMOVED: 'group_mkzbkhkt',
      MISSING_DATA: 'group_mkzsx8tb'
    },

    columns: {
      // Core identification fields
      CUSTOMER_ID: 'text_mkyfbpee',
      LOCATION_ID: 'text_mkyf6p0x',
      SERVICE_CONTRACT_ID: 'text_mkyfyhr0',
      CUSTOMER_CONTRACT_ID: 'text_mkyfba0y',

      // Equipment details
      EQUIPMENT_DESCRIPTION: 'text_mkyfyb98',
      SERIAL_NBR: 'text_mkyfsnjp',
      STATUS: 'text_mkyfdta3',
      ROOM: 'text_mkyf4nqv',
      SOFTWARE_RELEASE: 'text_mkyf6y7e',
      SYSTEM_IP_ADDRESS: 'text_mkyftz9a',

      // System specifications
      MODALITY: 'text_mkyfk8xm',
      MODEL_DESCRIPTION: 'text_mkyfnce5',
      MODEL: 'text_mkyfek5s',
      MANUFACTURER: 'text_mkyf8pat',
      MANUFACTURER_ID: 'text_mkyfhzrz',

      // Customer information
      CUSTOMER_NAME: 'text_mkyf9nmy',
      LOCATION_NAME: 'text_mkyfw4xn',
      ADDRESS_LINE1: 'text_mkyfzn5b',
      ADDRESS_LINE2: 'text_mkyf6fmd',
      CITY: 'text_mkyfm6yt',
      STATE: 'text_mkyfk2we',
      POSTAL_CODE: 'text_mkyfp1vm',
      CUSTOMER_UNIQUE_ID: 'text_mkyfc4e9',

      // Maintenance
      LAST_PM_COMPLETED: 'text_mkyfmws4',
      PM_FREQUENCY_IN_MONTHS: 'text_mkyf6jdh',
      LEGACY_EQUIPMENT_ID: 'text_mkyfy5m1',

      // Remote services
      SHOW_ON_REMOTE_SERVICES_WEBSITE: 'text_mkyf3e0p',
      REMOTE_CONNECTIVITY_IMPLEMENTED: 'text_mkyfrkz2',
      REMOTE_COVERAGE: 'text_mkzdqcx3',

      // Service contract details
      SERVICE_CONTRACT_CUSTOMER_ID: 'text_mkyf5ccy',
      SERVICE_CONTRACT_CUSTOMER_NAME: 'text_mkyfgfhd',
      SERVICE_CONTRACT_STATUS: 'text_mkyft88f',
      SERVICE_CONTRACT_LOCATION_ID: 'text_mkyf1hxh',
      SERVICE_CONTRACT_LOCATION_NAME: 'text_mkyfs9mr',

      // Customer contract details
      CUSTOMER_CONTRACT_CUSTOMER_ID: 'text_mkyfe84s',
      CUSTOMER_CONTRACT_CUSTOMER_NAME: 'text_mkyfzd0g',
      CUSTOMER_CONTRACT_STATUS: 'text_mkyffwj2',
      CUSTOMER_CONTRACT_LOCATION_ID: 'text_mkyfpqpd',
      CUSTOMER_CONTRACT_LOCATION_NAME: 'text_mkyftcwr',

      // Additional fields
      EXPIRATION_DATE: 'text_mkyf5kda',
      MMB_CONTROL_NUMBER: 'text_mkyffczk',

      // IGAH fields
      IGAH_CREATED: 'text_mkyfw4ya',
      IGAH_CREATED_BY: 'text_mkyfrpcp',
      IGAH_UPDATED_BY: 'text_mkyf9r2g',
      IGAH_UPDATED: 'text_mkyfv5dz',
      IGAH_ACTIVE: 'text_mkyf6kdy',

      // Engineer assignments
      PRIMARY_ENGINEER: 'text_mkyf17nb',
      PRIMARY_ENGINEER_2: 'text_mkyfvfxe',
      EMPLOYEE_NAME: 'text_mkyfgxms',
      SECONDARY_ENGINEER: 'text_mkyfvdzx',
      SECONDARY_ENGINEER_2: 'text_mkyfd9h7',
      EMPLOYEE_NAME_2: 'text_mkyfrrz9',

      // Timestamps
      CAPTURE_DATETIME: 'date_mkypgn4f'
    }
  },

  /**
   * Get group ID by name
   * @param {string} board - Board name (e.g., 'RTT_FEED')
   * @param {string} groupName - Group name (e.g., 'TOPICS', 'NEW_ADDITIONS')
   * @returns {string} Group ID
   */
  getGroupId(board, groupName) {
    return this[board].groups[groupName];
  },

  /**
   * Get column ID by name
   * @param {string} board - Board name (e.g., 'RTT_FEED')
   * @param {string} columnName - Column name (e.g., 'CUSTOMER_ID')
   * @returns {string} Column ID
   */
  getColumnId(board, columnName) {
    return this[board].columns[columnName];
  }
};
