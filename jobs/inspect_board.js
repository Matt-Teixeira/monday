// inspect_board.js
require("dotenv").config();
const { createClient } = require("../api/monday-client");
const mondayConfig = require("../config/monday-boards");

const BOARD_ID = process.env.MMB_CUST_WORKFLOW_ID; 
// MMB_CUST_WORKFLOW_ID
// MONDAY_BOARD_ID_3
const monday = createClient();

async function inspect_board() {
  const query = `
    query GetBoardInfo($boardId: [ID!]!) {
      boards(ids: $boardId) {
        name
        groups {
          id
          title
        }
        columns {
          id
          title
          type
        }
      }
    }
  `;

  const variables = { boardId: BOARD_ID };

  try {
    const res = await monday.post("", { query, variables });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error inspecting board:");
    console.error(err.response?.data || err.message);
  }
}

module.exports = inspect_board;
