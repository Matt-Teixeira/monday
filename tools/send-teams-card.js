const { default: axios } = require("axios");

async function send_teams_card(system) {
  const url = process.env.TEAMS_WH_REMOTE_TECH;

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
              text: "MMB-Workflow Update: TEST"
            },
            {
              type: "TextBlock",
              text: `**${system.Description}: TEST**`,
              wrap: true
            },
            {
              type: "FactSet",
              facts: [
                { title: "Customer", value: system.CustomerName ?? "—" },
                {
                  title: "Location",
                  value: system.CustomerContractLocationName ?? "—"
                },
                { title: "Modality", value: system.Modality ?? "MRI" },
                { title: "Manufacturer", value: system.Manufacturer ?? "—" },
                { title: "Serial", value: system.CustomerUniqueID ?? "—" }
              ]
            }
          ],
          actions: [
            // Optional: deep link to Monday item if you have it
            // { type: "Action.OpenUrl", title: "Open in Monday", url: system.mondayItemUrl }
          ]
        }
      }
    ]
  };

  await axios.post(url, card);
}

module.exports = send_teams_card;
