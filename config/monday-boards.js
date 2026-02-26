/**
 * Monday.com Board Configuration
 * Single source of truth for all board IDs, group IDs, and column IDs
 */

module.exports = {
  /**
   * RTT Feed Board Configuration
   */
  RTT_FEED: {
    boardId: process.env.MONDAY_BOARD_ID_RTT_FEED,
    displayName: "RTT Feed",

    groups: {
      TOPICS: 'topics',
      NEW_ADDITIONS: 'group_mkzb5ahp',
      REMOVED: 'group_mkzbkhkt',
      MISSING_DATA: 'group_mkzsx8tb',
      WORKFLOW_PROCESSED: 'group_mkzvcfxp'
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
      CAPTURE_DATETIME: 'date_mkypgn4f',

      // User assignment
      SUB_GROUP: 'text_mkzt9pcm'
    }
  },

  /**
   * RTT Feed All Board Configuration
   */
  RTT_FEED_ALL: {
    boardId: process.env.MONDAY_BOARD_ID_RTT_FEED_ALL,
    displayName: "RTT Feed All",

    groups: {
      TOPICS: 'topics',
      NEW_ADDITIONS: 'group_mkzb5ahp',
      MISSING_DATA: 'group_mkzsx8tb',
      REMOVED: 'group_mkzbkhkt',
      WORKFLOW_PROCESSED: 'group_mkzvcfxp'
    },

    columns: {
      CUSTOMER_ID: 'text_mkyfbpee',
      SERVICE_CONTRACT_ID: 'text_mkyfyhr0',
      SERIAL_NBR: 'text_mkyfsnjp',
      REMOTE_COVERAGE: 'text_mkzdqcx3',
      SUB_GROUP: 'text_mkzt9pcm',
      CUSTOMER_NAME: 'text_mkyf9nmy',
      CUSTOMER_CONTRACT_CUSTOMER_NAME: 'text_mkyfzd0g',
      SERVICE_CONTRACT_CUSTOMER_NAME: 'text_mkyfgfhd',
      STATUS: 'text_mkyfdta3',
      ROOM: 'text_mkyf4nqv',
      SOFTWARE_RELEASE: 'text_mkyf6y7e',
      SYSTEM_IP_ADDRESS: 'text_mkyftz9a',
      MODALITY: 'text_mkyfk8xm',
      MODEL_DESCRIPTION: 'text_mkyfnce5',
      LOCATION_NAME: 'text_mkyfw4xn',
      ADDRESS_LINE1: 'text_mkyfzn5b',
      ADDRESS_LINE2: 'text_mkyf6fmd',
      CITY: 'text_mkyfm6yt',
      STATE: 'text_mkyfk2we',
      POSTAL_CODE: 'text_mkyfp1vm',
      MODEL: 'text_mkyfek5s',
      CUSTOMER_UNIQUE_ID: 'text_mkyfc4e9',
      MANUFACTURER: 'text_mkyf8pat',
      LOCATION_ID: 'text_mkyf6p0x',
      SERVICE_CONTRACT_CUSTOMER_ID: 'text_mkyf5ccy',
      CUSTOMER_CONTRACT_CUSTOMER_ID: 'text_mkyfe84s',
      SERVICE_CONTRACT_STATUS: 'text_mkyft88f',
      CUSTOMER_CONTRACT_STATUS: 'text_mkyffwj2',
      EXPIRATION_DATE: 'text_mkyf5kda',
      CAPTURE_DATETIME: 'date_mkypgn4f'
    }
  },

  /**
   * HHM Customer Workflow Board Configuration
   */
  HHM_CUST_WORKFLOW: {
    boardId: process.env.MONDAY_BOARD_HHM_CUST_WORKFLOW,
    displayName: "HHM Customer Workflow",

    groups: {
      ACTIVE_MAINTENANCE: 'topics',
      ADD_TO_ACTIVE: 'group_mm0y6vwr'
    },

    columns: {
      // Status columns
      BUSINESS_ADMIN: 'color_mkztyftg',
      REMOTE_ADMIN: 'color_mm0d3jnz',
      DEV_OPS: 'color_mm0dvwya',
      NETWORK_ADMIN: 'color_mm0dac13',

      // Text columns
      CUSTOMER_NAME: 'text_mkyf9nmy',
      SITE_NAME: 'text_mkyfgfhd',
      CUSTOMER_CONTRACT_CUSTOMER_NAME: 'text_mkyfzd0g',
      SUB_GROUP: 'text_mkzt9pcm',
      CUSTOMER_CONTRACT_ID: 'text_mkyfba0y',
      EQUIPMENT_DESCRIPTION: 'text_mkyfyb98',
      SERIAL_NBR: 'text_mkyfsnjp',
      STATUS: 'text_mkyfdta3',
      ROOM: 'text_mkyf4nqv',
      SOFTWARE_RELEASE: 'text_mkyf6y7e',
      SYSTEM_IP_ADDRESS: 'text_mkyftz9a',
      MODALITY: 'text_mkyfk8xm',
      MODEL_DESCRIPTION: 'text_mkyfnce5',
      ADDRESS: 'text_mkyfzn5b',
      MODEL: 'text_mkyfek5s',
      CUSTOMER_UNIQUE_ID: 'text_mkyfc4e9',
      MANUFACTURER: 'text_mkyf8pat',
      SERVICE_CONTRACT_CUSTOMER_ID: 'text_mkyf5ccy',
      CUSTOMER_CONTRACT_CUSTOMER_ID: 'text_mkyfe84s',
      SERVICE_CONTRACT_STATUS: 'text_mkyft88f',
      CUSTOMER_CONTRACT_STATUS: 'text_mkyffwj2',
      SERVICE_CONTRACT_LOCATION_NAME: 'text_mkyfs9mr',
      REMOTE_CONNECTIVITY_IMPLEMENTED: 'text_mkyfrkz2',
      CUSTOMER_ID: 'text_mkyfbpee',
      REMOTE_COVERAGE: 'text_mkzdqcx3',
      NOTES: 'text_mm0dcd13',
      REMOTE_SITE_DATE: 'text_mm0dsf42',

      // Date columns
      CAPTURE_DATETIME: 'date_mkypgn4f',
      LAST_LOG_DATE: 'date_mm0ytz39',
      LAST_CONNECTION_DATE: 'date_mm0y41ct',

      // Connectivity
      CONNECTIVITY_ERROR: 'text_mm0ykvwr'
    }
  },

  /**
   * MMB Customer Workflow Board Configuration
   */
  MMB_CUST_WORKFLOW: {
    boardId: process.env.MONDAY_BOARD_MMB_CUST_WORKFLOW,
    displayName: "MMB Customer Workflow",

    groups: {
      PLANNING_REVIEW: 'topics',
      IN_TRANSIT: 'group_mkxj31nc',
      DEPLOYMENT: 'group_mkxj1bmn',
      ACTIVE_MAINTENANCE: 'group_mkxjdb09',
      CONTRACT_END: 'group_mkyadk7j'
    },

    columns: {
      // Status columns
      BUSINESS_ADMIN_LOGISTICS: 'status',
      REMOTE_ADMIN: 'color_mm0aje8s',
      DEV_OPS: 'color_mm0am04z',
      NETWORK_ADMIN: 'color_mm0axxky',

      // Text columns
      CUSTOMER_NAME: 'text_mkxjfnc4',
      SUB_GROUP: 'text_mkxjrtzm',
      SITE_NAME: 'text_mkxjn0xh',
      BOX_ASSIGNED: 'text_mkxjhw6v',
      MAGNET_TYPE: 'text_mkxjzsj3',
      MODALITY: 'text_mm02w39g',
      MANUFACTURER: 'text_mkyfmb6e',
      MODEL: 'text_mkyfvyhj',
      SERIAL: 'text_mkyfthry',
      SVC: 'text_mkxjhc6f',
      COMPRESSOR_STATUS: 'text_mm0mv1b3',

      // Long text columns
      SHIPPING_INFO: 'long_text_mkxjc4hr',
      NOTES: 'long_text_mkxj53gr',
      SITE_ADDRESS: 'long_text_mkxq9d75',

      // Board relation
      REMOTE_BOX: 'board_relation_mkyasw0t',

      // Mirror columns
      MIRROR_BOX: 'lookup_mkyhd2n1',
      SSH_IP: 'lookup_mkyaadp1',
      MAC: 'lookup_mkyph4s5',

      // People
      PERSON: 'person',

      // Date
      DATE: 'date4',
      MAG_CAPTURE_DATETIME: 'date_mm0myzcp',

      // EDU
      EDU_CAPTURE_DATETIME: 'date_mm0pg81f',

      // Numbers
      HE_PRESSURE: 'numeric_mm0m2pxd',
      HE_LEVEL: 'numeric_mm0my38c'
    }
  },

  /**
   * MRI Platform Reporting Board Configuration
   */
  MRI_PLATFORM_REPORTING: {
    boardId: process.env.MONDAY_BOARD_MRI_PLATFORM_REPORTING,
    displayName: "MRI Platform Reporting",
    groups: {},
    columns: {}
  },

  /**
   * Alert Matrix Board Configuration
   */
  ALERT_MATRIX: {
    boardId: process.env.MONDAY_BOARD_ALERT_MATRIX,
    displayName: "Alert Matrix",
    groups: {},
    columns: {}
  },

  /**
   * Tickets Board Configuration (source for RemoteTechnology tickets)
   */
  TICKETS: {
    boardId: process.env.MONDAY_BOARD_TICKETS,
    displayName: "Tickets",
    groups: {
      OPEN_TICKETS: 'group_title',
      UNASSIGNED_TICKETS: 'topics'
    },
    columns: {
      LONG_TEXT: 'long_text7'
    }
  },

  /**
   * Avante Connected Tickets Board Configuration (destination)
   */
  AVCONN_TICKETS: {
    boardId: process.env.MONDAY_BOARD_AVCONN_TICKETS,
    displayName: "New Tickets",
    groups: {
      NEW: 'topics'
    },
    columns: {
      TICKET_ID: 'text_mm06fp18',
      PERSON: 'person',
      STATUS: 'status',
      DATE: 'date4'
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
  },

  /**
   * Get all boards for interactive menu
   * @returns {Array<{key: string, displayName: string, boardId: string}>}
   */
  getAllBoards() {
    return Object.entries(this)
      .filter(([key, val]) => typeof val === 'object' && val.boardId)
      .map(([key, val]) => ({
        key,
        displayName: val.displayName || key,
        boardId: val.boardId
      }));
  }
};
