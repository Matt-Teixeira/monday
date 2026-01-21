require("dotenv").config();
const axios = require("axios");

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

const monday = axios.create({
  baseURL: "https://api.monday.com/v2",
  headers: {
    "Content-Type": "application/json",
    Authorization: MONDAY_API_TOKEN
  }
});

/**
 * Get all items from a Monday.com board, optionally filtered by group
 *
 * @param {string} boardId - The Monday.com board ID
 * @param {string} groupId - Optional group ID to filter items
 * @returns {Promise<Array>} Array of items from the board
 */
async function getMondayBoardItems(boardId, groupId = null) {
  const query = `
    query GetBoardItems($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id
        name
        groups {
          id
          title
        }
        items_page(limit: 500) {
          cursor
          items {
            id
            name
            group {
              id
              title
            }
            column_values {
              id
              text
              type
              value
            }
          }
        }
      }
    }
  `;

  const variables = { boardId };

  try {
    const res = await monday.post("", { query, variables });

    if (res.data.errors) {
      console.error("GraphQL errors:", JSON.stringify(res.data.errors, null, 2));
      throw new Error("GraphQL error from monday.com");
    }

    const boards = res.data.data?.boards;
    if (!boards || !boards.length) {
      throw new Error("No boards returned in response");
    }

    const board = boards[0];
    let items = board.items_page?.items || [];

    // Filter by group if specified
    if (groupId) {
      items = items.filter((item) => item.group.id === groupId);
    }

    return {
      board,
      items,
      groups: board.groups
    };
  } catch (error) {
    console.error("Error fetching Monday board items:");
    console.error(error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get item names (Description/Equipment IDs) from a specific group
 * Useful for delta checking
 *
 * @param {string} boardId - The Monday.com board ID
 * @param {string} groupId - The group ID
 * @returns {Promise<Set>} Set of item names (for easy lookup)
 */
async function getMondayItemNames(boardId, groupId = null) {
  const { items } = await getMondayBoardItems(boardId, groupId);
  return new Set(items.map((item) => item.name.trim()));
}

module.exports = {
  getMondayBoardItems,
  getMondayItemNames
};
