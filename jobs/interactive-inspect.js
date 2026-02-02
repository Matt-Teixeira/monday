// interactive-inspect.js
require("dotenv").config();
const readline = require("readline");
const inspect_board = require("./inspect_board");
const mondayConfig = require("../config/monday-boards");

/**
 * Display the menu of available boards
 * @param {Array} boards - Array of board objects
 */
function displayMenu(boards) {
  console.log("\n========================================");
  console.log("       Monday.com Board Inspector");
  console.log("========================================\n");
  console.log("Available boards:\n");

  boards.forEach((board, index) => {
    console.log(`  ${index + 1}. ${board.displayName}`);
    console.log(`     ID: ${board.boardId}\n`);
  });

  console.log("  0. Exit\n");
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
async function interactiveInspect() {
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
    console.log(`Inspecting: ${selectedBoard.displayName}`);
    console.log(`Board ID: ${selectedBoard.boardId}`);
    console.log("----------------------------------------\n");

    try {
      await inspect_board(selectedBoard.boardId);
    } catch (err) {
      console.error(`\nFailed to inspect board: ${err.message}\n`);
    }

    await prompt(rl, "\nPress Enter to continue...");
  }

  rl.close();
}

module.exports = interactiveInspect;

// Allow direct execution
if (require.main === module) {
  interactiveInspect();
}
