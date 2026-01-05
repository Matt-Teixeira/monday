const { default: axios } = require("axios");

async function insert_to_mmb_cust(formatted) {
  const MONDAY_API_URL = "https://api.monday.com/v2";
  const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

  // Ensure BOARD_ID is a number (env vars are strings)
  const BOARD_ID = Number(process.env.MMB_CUST_WORKFLOW_ID);
  const GROUP_ID = "topics";

  const mondayClient = axios.create({
    baseURL: MONDAY_API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_API_TOKEN
    }
  });

  const query = `
    mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        group_id: $groupId,
        item_name: $itemName,
        column_values: $columnValues
      ) { id }
    }
  `;

  // name maps to item_name; everything else goes in column_values
  const { name, ...columnValuesObj } = formatted;

  const variables = {
    boardId: BOARD_ID,
    groupId: GROUP_ID,
    itemName: name || "RTT Item",
    columnValues: JSON.stringify(columnValuesObj)
  };

  const res = await mondayClient.post("", { query, variables });

  if (res.data.errors) {
    throw new Error(JSON.stringify(res.data.errors, null, 2));
  }

  return res.data.data.create_item.id;
}

module.exports = insert_to_mmb_cust;
