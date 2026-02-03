require("dotenv").config();
const { createClient } = require("../api/monday-client");

const monday = createClient();

async function get_board_info(boardId = process.env.MONDAY_BOARD_TICKETS) {
  const query = `
    query GetBoardItems($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id
        name
        columns {
          id
          title
          type
        }
        groups {
          id
          title
        }
        items_page(limit: 100) {
          items {
            id
            name
            created_at
            updated_at
            group {
              id
              title
            }
            column_values {
              id
              text
              type
              value
              column {
                id
                title
              }
            }
          }
        }
      }
    }
  `;

  const variables = { boardId };

  const res = await monday.post("", { query, variables });

  // More defensive error handling
  if (res.data.errors) {
    console.error("GraphQL errors:", JSON.stringify(res.data.errors, null, 2));
    throw new Error("GraphQL error from monday.com");
  }

  const boards = res.data.data?.boards;
  if (!boards || !boards.length) {
    throw new Error("No boards returned in response");
  }

  return boards[0];
}

module.exports = get_board_info;
