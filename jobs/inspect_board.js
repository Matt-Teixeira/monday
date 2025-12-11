// inspect_board.js
require("dotenv").config();
const axios = require("axios");

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN; // from .env
const BOARD_ID = process.env.MONDAY_BOARD_ID_3; // your MRI-Platform-Reporting board ID

const monday = axios.create({
  baseURL: "https://api.monday.com/v2",
  headers: {
    "Content-Type": "application/json",
    Authorization: MONDAY_API_TOKEN
  }
});

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
