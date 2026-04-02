/**
 * Shared Monday.com API Client
 * Centralized client for all Monday.com API operations
 */
const fetch = require("node-fetch");
const mondayConfig = require("../config/monday-boards");
const { buildRTTColumnValues } = require("../tools/monday-column-mapper");

const MONDAY_API_URL = "https://api.monday.com/v2";

/**
 * Create configured HTTP client for Monday.com API
 */
function createClient() {
  return {
    async post(path, body) {
      const res = await fetch(MONDAY_API_URL + path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.MONDAY_API_TOKEN
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        const error = new Error(`Monday API ${res.status}: ${text}`);
        error.response = { status: res.status, data: text };
        throw error;
      }

      const data = await res.json();
      return { data };
    }
  };
}

/**
 * Create a single item on Monday.com board
 *
 * @param {Object} options - Item creation options
 * @param {string} options.boardId - Board ID
 * @param {string} options.groupId - Group ID
 * @param {string} options.itemName - Name for the item
 * @param {string} options.columnValues - JSON string of column values
 * @returns {Promise<{id: string, name: string}>} Created item
 */
async function createItem({ boardId, groupId, itemName, columnValues }) {
  const client = createClient();

  const query = `
    mutation CreateItem(
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
        name
      }
    }
  `;

  const variables = {
    boardId,
    groupId,
    itemName,
    columnValues
  };

  const response = await client.post("", { query, variables });

  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors, null, 2));
  }

  return response.data.data.create_item;
}

/**
 * Create an RTT system item on Monday.com
 *
 * @param {Object} system - RTT system data
 * @param {string} groupId - Target group ID
 * @param {Object} [capDatetime] - Optional DateTime object for capture timestamp
 * @returns {Promise<{id: string, name: string}>} Created item
 */
async function createRttItem(system, groupId, capDatetime = null) {
  const itemName = system.Description || system.description || "RTT Item";
  const columnValues = buildRTTColumnValues(system, capDatetime);

  return createItem({
    boardId: mondayConfig.RTT_FEED.boardId,
    groupId,
    itemName,
    columnValues
  });
}

/**
 * Insert multiple RTT systems to Monday.com with logging
 *
 * @param {Array} systems - Array of RTT system objects
 * @param {Object} capDatetime - DateTime object for capture timestamp
 * @param {string} groupId - Target group ID
 * @param {Object} [options] - Additional options
 * @param {number} [options.delayMs=0] - Delay between inserts (for rate limiting)
 * @param {boolean} [options.logProgress=true] - Whether to log progress
 * @returns {Promise<{success: number, errors: number}>} Results summary
 */
async function insertRttSystems(systems, capDatetime, groupId, options = {}) {
  const { delayMs = 0, logProgress = true } = options;
  let success = 0;
  let errors = 0;

  for (const system of systems) {
    try {
      const result = await createRttItem(system, groupId, capDatetime);
      success++;

      if (logProgress) {
        console.log(
          `Created RTT Item: ${result.id} for ${system.Description || system.description}`
        );
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (err) {
      errors++;
      console.error(
        `Error creating item for ${system.Description || system.description}:`,
        err.message
      );
    }
  }

  return { success, errors };
}

/**
 * Move an item to a different group on the same board
 *
 * @param {string} itemId - The ID of the item to move
 * @param {string} groupId - The target group ID
 * @returns {Promise<{id: string}>} Moved item info
 */
async function moveItemToGroup(itemId, groupId) {
  const client = createClient();

  const query = `
    mutation MoveItem($itemId: ID!, $groupId: String!) {
      move_item_to_group(item_id: $itemId, group_id: $groupId) {
        id
      }
    }
  `;

  const response = await client.post("", {
    query,
    variables: { itemId, groupId }
  });

  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors, null, 2));
  }

  return response.data.data.move_item_to_group;
}

/**
 * Update column values on an existing Monday.com item
 *
 * @param {Object} options - Update options
 * @param {string} options.boardId - Board ID
 * @param {string} options.itemId - Item ID to update
 * @param {string} options.columnValues - JSON string of column values to update
 * @returns {Promise<{id: string}>} Updated item
 */
async function changeColumnValues({ boardId, itemId, columnValues }) {
  const client = createClient();

  const query = `
    mutation ChangeColumnValues(
      $boardId: ID!,
      $itemId: ID!,
      $columnValues: JSON!
    ) {
      change_multiple_column_values(
        board_id: $boardId,
        item_id: $itemId,
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const variables = {
    boardId,
    itemId,
    columnValues
  };

  const response = await client.post("", { query, variables });

  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors, null, 2));
  }

  return response.data.data.change_multiple_column_values;
}

module.exports = {
  createClient,
  createItem,
  createRttItem,
  insertRttSystems,
  moveItemToGroup,
  changeColumnValues
};
