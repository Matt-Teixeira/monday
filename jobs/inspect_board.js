// inspect_board.js
require("dotenv").config();
const { createClient } = require("../api/monday-client");
const mondayConfig = require("../config/monday-boards");

const monday = createClient();

async function inspect_board(boardId = process.env.MONDAY_BOARD_TICKETS) {
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

  const variables = { boardId };

  try {
    const res = await monday.post("", { query, variables });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error inspecting board:");
    console.error(err.response?.data || err.message);
  }
}

module.exports = inspect_board;
