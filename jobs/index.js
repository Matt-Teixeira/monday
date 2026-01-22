const get_board_info = require("./get_board_info");
const inspect_board = require("./inspect_board");
const update_rtt_board = require("./rtt_board/update-rtt-board");
const group_by_coverage = require("./group-by-coverage");
const sync_missing_data = require("./sync-missing-data");
const process_new_additions = require("./process-new-additions");

module.exports = {
  inspect_board,
  get_board_info,
  update_rtt_board,
  group_by_coverage,
  sync_missing_data,
  process_new_additions
};
