require("dotenv").config();
const axios = require("axios");

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN; // from .env

const monday = axios.create({
  baseURL: "https://api.monday.com/v2",
  headers: {
    "Content-Type": "application/json",
    Authorization: MONDAY_API_TOKEN
  }
});

async function get_board_info(BOARD_ID) {
  const query = `
    query GetAlertMatrixGrouped($boardIds: [ID!]!) {
      boards(ids: $boardIds) {
        name
        groups {
          id
          title
          items_page(limit: 200) {
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    }
  `;

  const variables = { boardIds: [BOARD_ID] };

  const res = await monday.post("", { query, variables });
  
  return res.data.data.boards[0];
}

module.exports = get_board_info;
