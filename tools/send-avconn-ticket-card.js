const { default: axios } = require("axios");

/**
 * Send Teams adaptive card notification for a new AVCONN ticket
 *
 * @param {Object} ticket - Monday.com item object
 * @param {string} ticket.id - Item ID
 * @param {string} ticket.name - Ticket name/title
 * @param {Object} ticket.group - Group info
 * @param {string} ticket.group.title - Group name
 * @param {Object} matchResult - Pattern match result from itemMatchesPatterns()
 * @param {Object} matchResult.matchedPattern - The pattern that matched
 * @param {string} matchResult.matchedPattern.label - Human-readable pattern label
 */
async function send_avconn_ticket_card(ticket, matchResult) {
  const url = process.env.TEAMS_WH_AVCON_TICKETS;

  if (!url) {
    console.warn("TEAMS_WH_AVCON_TICKETS not configured, skipping notification");
    return;
  }

  const mondayItemUrl = `https://avante-main-account.monday.com/boards/${process.env.MONDAY_BOARD_TICKETS}/views/214669907/pulses/${ticket.id}`;
  const detectedAt = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "short",
    timeStyle: "short"
  });

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              size: "Large",
              weight: "Bolder",
              text: "New AVCONN Ticket Detected"
            },
            {
              type: "TextBlock",
              text: ticket.name,
              wrap: true,
              weight: "Bolder",
              size: "Medium"
            },
            {
              type: "FactSet",
              facts: [
                { title: "Ticket ID", value: ticket.id },
                { title: "Source Group", value: ticket.group?.title ?? "—" },
                { title: "Matched Pattern", value: matchResult?.matchedPattern?.label ?? "—" },
                { title: "Detected At", value: detectedAt }
              ]
            }
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "Open in Monday",
              url: mondayItemUrl
            }
          ]
        }
      }
    ]
  };

  await axios.post(url, card);
}

module.exports = send_avconn_ticket_card;
