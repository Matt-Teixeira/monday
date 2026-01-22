require("dotenv").config();
const { createClient } = require("../api/monday-client");
const mondayConfig = require("../config/monday-boards");

const BOARD_ID = mondayConfig.RTT_FEED.boardId;
const monday = createClient();

/**
 * Inspect the Missing Data board to find group IDs
 */
async function inspectMissingDataBoard() {
  console.log(`\n=== Inspecting Monday Board ${BOARD_ID} ===\n`);

  const query = `
    query GetBoardInfo($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id
        name
        groups {
          id
          title
          color
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

    if (res.data.errors) {
      console.error("GraphQL errors:", JSON.stringify(res.data.errors, null, 2));
      throw new Error("GraphQL error from monday.com");
    }

    const boards = res.data.data?.boards;
    if (!boards || !boards.length) {
      throw new Error("No boards returned in response");
    }

    const board = boards[0];

    console.log(`Board Name: ${board.name}`);
    console.log(`Board ID: ${board.id}\n`);

    console.log("=== Available Groups ===");
    board.groups.forEach((group) => {
      console.log(`  ID: "${group.id}"`);
      console.log(`  Title: "${group.title}"`);
      console.log(`  Color: ${group.color}`);
      console.log("");
    });

    console.log("=== Available Columns ===");
    board.columns.forEach((col) => {
      console.log(`  ID: "${col.id}"`);
      console.log(`  Title: "${col.title}"`);
      console.log(`  Type: ${col.type}`);
      console.log("");
    });

    console.log("\n=== Next Steps ===");
    console.log("1. Find or create a group for 'Missing-Required-Data'");
    console.log("2. Add this to your .env file:");
    console.log("   MONDAY_MISSING_DATA_GROUP_ID=<group_id_here>");
    console.log("\n3. Update the column IDs in jobs/sync-missing-data.js");
    console.log("   (around line 139) to match your board's column structure\n");

    return board;
  } catch (error) {
    console.error("\n=== Error inspecting board ===");
    console.error(error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

module.exports = inspectMissingDataBoard;

// Run if called directly
if (require.main === module) {
  inspectMissingDataBoard().catch(console.error);
}
