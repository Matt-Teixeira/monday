require("dotenv").config();
const axios = require("axios");

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN; // from .env
const BOARD_ID = process.env.MMB_CUST_WORKFLOW_ID; // your MRI-Platform-Reporting board ID

const monday = axios.create({
  baseURL: "https://api.monday.com/v2",
  headers: {
    "Content-Type": "application/json",
    Authorization: MONDAY_API_TOKEN
  }
});

async function get_board_info() {
  const query = `
    query GetBoardItems($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id
        name
        items_page(limit: 50) {
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
