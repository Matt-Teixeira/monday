("use strict");
require("dotenv").config();
const {
  inspect_board,
  interactive_inspect,
  interactive_board_info,
  get_board_info,
  update_rtt_board,
  group_by_coverage,
  sync_missing_data,
  process_new_additions,
  new_avconn_tickets
} = require("./jobs");
const inspect_missing_data_board = require("./jobs/inspect-missing-data-board");
const { capture_datetime } = require("./tools");

const run_job = async (job) => {
  let cap_dt = capture_datetime("America/New_York");
  switch (job) {
    case "inspect":
      await inspect_board();
      break;

    case "inspect_interactive":
      await interactive_inspect();
      break;

    case "board_info_interactive":
      await interactive_board_info();
      break;

    case "board_info":
      let bi = await get_board_info();
      console.log(bi.items_page.items);
      break;
    case "equipment_rtt":
      await update_rtt_board(cap_dt);
      break;
    case "group_coverage":
      await group_by_coverage();
      break;
    case "sync_missing_data":
      await sync_missing_data();
      break;
    case "inspect_missing_data_board":
      await inspect_missing_data_board();
      break;
    case "process_new_additions":
      await process_new_additions();
      break;
    case "new_avconn_tickets":
      await new_avconn_tickets();
      break;
    default:
      break;
  }
};

const on_boot = async () => {
  const job = process.argv[2];
  console.log(job);

  await run_job(job);
};

on_boot();
