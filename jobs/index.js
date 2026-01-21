const get_board_info = require("./get_board_info");
const inspect_board = require("./inspect_board");
const create_row = require("./monday_report_post");
const update_rtt_board = require("./rtt_board/update-rtt-board");
const group_by_coverage = require("./group-by-coverage");
const sync_missing_data = require("./sync-missing-data");

module.exports = {
  inspect_board,
  get_board_info,
  create_row,
  update_rtt_board,
  group_by_coverage,
  sync_missing_data
};
