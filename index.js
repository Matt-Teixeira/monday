("use strict");
require("dotenv").config();
const db = require("./db/pgPool");
const {
  inspect_board,
  get_board_info,
  create_row,
  update_mri_report,
  update_rtt_board
} = require("./jobs");

const run_job = async (job) => {
  switch (job) {
    case "inspect":
      await inspect_board();
      break;
    case "board_info":
      let bi = await get_board_info();

      console.log(bi);
      break;
    case "update_mri_reports":
      await update_mri_report();
      break;

    case "equipment_rtt":
      console.log("\nequipment_rtt");
      await update_rtt_board();
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
