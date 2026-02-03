// interactive-board-info.js
require("dotenv").config();
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const get_board_info = require("./get_board_info");
const mondayConfig = require("../config/monday-boards");

const OUTPUT_DIR = path.join(__dirname, "..", "data_outputs");

/**
 * Display the menu of available boards
 * @param {Array} boards - Array of board objects
 */
function displayMenu(boards) {
  console.log("\n========================================");
  console.log("       Monday.com Board Info");
  console.log("========================================\n");
  console.log("Available boards:\n");

  boards.forEach((board, index) => {
    console.log(`  ${index + 1}. ${board.displayName}`);
    console.log(`     ID: ${board.boardId}\n`);
  });

  console.log("  0. Exit\n");
}

/**
 * Display board items in a formatted way
 * @param {Array} items - Array of item objects
 */
function displayItems(items) {
  if (!items || items.length === 0) {
    console.log("No items found on this board.");
    return;
  }

  console.log(`\nFound ${items.length} items:\n`);
  items.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.name}`);
    console.log(`     ID: ${item.id}`);
    if (item.group) {
      console.log(`     Group: ${item.group.title}`);
    }
    console.log("");
  });
}

/**
 * Save board data to a JSON file
 * @param {string} boardName - Name of the board
 * @param {Object} data - Board data to save
 * @returns {string} - Path to the saved file
 */
function saveToJson(boardName, data) {
  const sanitizedName = boardName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${sanitizedName}_${timestamp}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

/**
 * Prompt user for input
 * @param {readline.Interface} rl - Readline interface
 * @param {string} question - Question to ask
 * @returns {Promise<string>}
 */
function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Main interactive loop
 */
async function interactiveBoardInfo() {
  const boards = mondayConfig.getAllBoards();

  if (boards.length === 0) {
    console.error("No boards found in configuration.");
    console.error("Please ensure monday-boards.js contains board definitions.");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let running = true;

  while (running) {
    displayMenu(boards);

    const input = await prompt(rl, "Select a board number (or 0 to exit): ");
    const selection = parseInt(input, 10);

    if (isNaN(selection)) {
      console.log("\n[!] Invalid input. Please enter a number.\n");
      continue;
    }

    if (selection === 0) {
      console.log("\nGoodbye!\n");
      running = false;
      continue;
    }

    if (selection < 1 || selection > boards.length) {
      console.log(`\n[!] Please select a number between 0 and ${boards.length}.\n`);
      continue;
    }

    const selectedBoard = boards[selection - 1];

    console.log("\n----------------------------------------");
    console.log(`Fetching info for: ${selectedBoard.displayName}`);
    console.log(`Board ID: ${selectedBoard.boardId}`);
    console.log("----------------------------------------\n");

    try {
      const boardData = await get_board_info(selectedBoard.boardId);
      displayItems(boardData.items_page.items);

      const savedPath = saveToJson(selectedBoard.displayName, boardData);
      console.log(`\nData saved to: ${savedPath}`);
    } catch (err) {
      console.error(`\nFailed to fetch board info: ${err.message}\n`);
    }

    await prompt(rl, "\nPress Enter to continue...");
  }

  rl.close();
}

module.exports = interactiveBoardInfo;

// Allow direct execution
if (require.main === module) {
  interactiveBoardInfo();
}
