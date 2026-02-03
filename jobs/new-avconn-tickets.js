require("dotenv").config();
const get_board_info = require("./get_board_info");
const { createItem } = require("../api/monday-client");
const { getMondayBoardItems } = require("../api/get-monday-board-items");
const mondayConfig = require("../config/monday-boards");
const { itemMatchesPatterns } = require("../tools/ticket-pattern-matcher");

/**
 * Find tickets matching configured patterns in Open/Unassigned tickets groups
 * and insert them into the AVCONN_TICKETS board (preventing duplicates)
 *
 * Patterns are configured in: config/ticket-filter-patterns.js
 */
async function new_avconn_tickets() {
  console.log("Starting new_avconn_tickets job...");

  // 1. Fetch source board items
  const sourceBoard = await get_board_info();
  const items = sourceBoard.items_page?.items || [];

  // 2. Filter for target groups and apply pattern matching
  const targetGroups = ["Open tickets", "Unassigned tickets"];
  const matchingTickets = items.filter((item) => {
    if (!targetGroups.includes(item.group.title)) return false;
    return itemMatchesPatterns(item).matches;
  });

  console.log(`Found ${matchingTickets.length} tickets matching filter patterns in ${targetGroups.join(" / ")}`);

  if (matchingTickets.length === 0) {
    console.log("No matching tickets to process");
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  // 3. Fetch existing ticket IDs from destination board to prevent duplicates
  const ticketIdCol = mondayConfig.AVCONN_TICKETS.columns.TICKET_ID;
  const { items: existingItems } = await getMondayBoardItems(
    mondayConfig.AVCONN_TICKETS.boardId
  );

  const existingTicketIds = new Set(
    existingItems
      .map((item) => item.column_values.find((c) => c.id === ticketIdCol)?.text)
      .filter(Boolean)
  );

  console.log(`Found ${existingTicketIds.size} existing tickets in destination board`);

  // 4. Filter out duplicates
  const newTickets = matchingTickets.filter(
    (ticket) => !existingTicketIds.has(ticket.id)
  );

  console.log(`${newTickets.length} new tickets to insert`);

  // 5. Insert new tickets
  let inserted = 0;
  let errors = 0;

  for (const ticket of newTickets) {
    try {
      const now = new Date();
      const dateValue = {
        date: now.toISOString().split("T")[0],
        time: now.toISOString().split("T")[1].split(".")[0]
      };

      const result = await createItem({
        boardId: mondayConfig.AVCONN_TICKETS.boardId,
        groupId: mondayConfig.AVCONN_TICKETS.groups.NEW,
        itemName: ticket.name,
        columnValues: JSON.stringify({
          [ticketIdCol]: ticket.id,
          [mondayConfig.AVCONN_TICKETS.columns.STATUS]: { label: "NEW" },
          [mondayConfig.AVCONN_TICKETS.columns.DATE]: dateValue
        })
      });

      console.log(`Inserted ticket: ${result.name} (ID: ${ticket.id})`);
      inserted++;
    } catch (err) {
      console.error(`Error inserting ticket ${ticket.id}:`, err.message);
      errors++;
    }
  }

  const skipped = matchingTickets.length - newTickets.length;

  console.log("\n--- Summary ---");
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);

  return { inserted, skipped, errors };
}

module.exports = new_avconn_tickets;
