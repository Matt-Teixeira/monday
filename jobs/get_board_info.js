require("dotenv").config();
const { createClient } = require("../api/monday-client");

const BOARD_ID = process.env.MONDAY_BOARD_TICKETS;
const monday = createClient();

async function get_board_info() {
  const query = `
    query GetBoardItems($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id
        name
        items_page(limit: 100) {
          items {
            id
            name            # "Item" column (your SME number)
            group {
              id
              title
            }
            column_values {
              id
              text          # human-readable value
              type          # column type, e.g. "text"
              value         # raw JSON as a string
            }
          }
        }
      }
    }
  `;

  const variables = { boardId: BOARD_ID };

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
