require("dotenv").config();
const { createClient } = require("./monday-client");

const monday = createClient();

/**
 * Fetch remaining items using cursor-based pagination
 *
 * @param {string} cursor - The cursor from the previous items_page response
 * @returns {Promise<Array>} All remaining items across subsequent pages
 */
async function fetchRemainingItems(cursor) {
  const allItems = [];
  let nextCursor = cursor;

  const query = `
    query GetNextItems($cursor: String!) {
      next_items_page(limit: 500, cursor: $cursor) {
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
  `;

  while (nextCursor) {
    const res = await monday.post("", {
      query,
      variables: { cursor: nextCursor }
    });

    if (res.data.errors) {
      console.error(
        "GraphQL errors (pagination):",
        JSON.stringify(res.data.errors, null, 2)
      );
      throw new Error("GraphQL error from monday.com during pagination");
    }

    const page = res.data.data?.next_items_page;
    if (!page) break;

    allItems.push(...(page.items || []));
    nextCursor = page.cursor;
  }

  return allItems;
}

/**
 * Get all items from a Monday.com board, optionally filtered by group
 *
 * @param {string} boardId - The Monday.com board ID
 * @param {string|string[]} groupId - Optional group ID(s) to filter items (queries at API level)
 * @returns {Promise<Array>} Array of items from the board
 */
async function getMondayBoardItems(boardId, groupId = null) {
  // If groupId provided, query directly from group to get only those items
  if (groupId) {
    const groupIds = Array.isArray(groupId) ? groupId : [groupId];

    const query = `
      query GetGroupItems($boardId: [ID!]!, $groupIds: [String!]!) {
        boards(ids: $boardId) {
          id
          name
          groups(ids: $groupIds) {
            id
            title
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
      }
    `;

    const variables = { boardId, groupIds };

    try {
      const res = await monday.post("", { query, variables });

      if (res.data.errors) {
        console.error(
          "GraphQL errors:",
          JSON.stringify(res.data.errors, null, 2)
        );
        throw new Error("GraphQL error from monday.com");
      }

      const boards = res.data.data?.boards;
      if (!boards || !boards.length) {
        throw new Error("No boards returned in response");
      }

      const board = boards[0];
      // Collect items from all requested groups (first page)
      const items = board.groups?.flatMap((g) => g.items_page?.items || []) || [];

      // Paginate remaining items for each group
      for (const group of board.groups || []) {
        const cursor = group.items_page?.cursor;
        if (cursor) {
          const remaining = await fetchRemainingItems(cursor);
          items.push(...remaining);
        }
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

  // No groupId - fetch all items from board
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
      console.error(
        "GraphQL errors:",
        JSON.stringify(res.data.errors, null, 2)
      );
      throw new Error("GraphQL error from monday.com");
    }

    const boards = res.data.data?.boards;
    if (!boards || !boards.length) {
      throw new Error("No boards returned in response");
    }

    const board = boards[0];
    const items = board.items_page?.items || [];

    // Paginate remaining items
    const cursor = board.items_page?.cursor;
    if (cursor) {
      const remaining = await fetchRemainingItems(cursor);
      items.push(...remaining);
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
