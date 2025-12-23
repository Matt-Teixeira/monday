("use strict");
require("dotenv").config();
const {
  inspect_board,
  get_board_info,
  update_rtt_board
} = require("./jobs");
const { capture_datetime } = require("./tools");

const run_job = async (job) => {
  let cap_dt = capture_datetime("America/New_York");
  switch (job) {
    case "inspect":
      await inspect_board();
      break;

    case "board_info":
      let bi = await get_board_info();

      console.log(bi.items_page.items);
      break;
    case "equipment_rtt":
      await update_rtt_board(cap_dt);
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
