const get_board_info = require("./get_board_info");
const inspect_board = require("./inspect_board");
const create_row = require("./monday_report_post");
const update_mri_report = require("./update-mri-report-board/update-mri-report-board");
const update_rtt_board = require("./update-rtt-board");

module.exports = {
  inspect_board,
  get_board_info,
  create_row,
  update_mri_report,
  update_rtt_board
};
