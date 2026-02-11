("use strict");
require("dotenv").config();
const jobs = require("./jobs");
const { capture_datetime } = require("./tools");

// Registry: map CLI name → handler function
// Each handler receives a context object with shared resources (cap_dt, etc.)
const jobs_registry = {
  inspect:                    (ctx) => jobs.inspect_board(),
  inspect_interactive:        (ctx) => jobs.interactive_inspect(),
  board_info_interactive:     (ctx) => jobs.interactive_board_info(),
  board_info:                 (ctx) => jobs.get_board_info().then(bi => console.log(bi.items_page.items)),
  equipment_rtt:              (ctx) => jobs.update_rtt_board(ctx.cap_dt),
  group_coverage:             (ctx) => jobs.group_by_coverage(),
  sync_missing_data:          (ctx) => jobs.sync_missing_data(),
  inspect_missing_data_board: (ctx) => jobs.inspect_missing_data_board(),
  process_new_additions:      (ctx) => jobs.process_new_additions(),
  new_avconn_tickets:         (ctx) => jobs.new_avconn_tickets(),
  rtt_feed_all:               (ctx) => jobs.rtt_feed_all(ctx.cap_dt),
};

const run_job = async (name) => {
  if (name === "list") {
    console.log("Available jobs:\n" + Object.keys(jobs_registry).map(k => `  - ${k}`).join("\n"));
    return;
  }

  const handler = jobs_registry[name];
  if (!handler) {
    console.error(`Unknown job: "${name}"`);
    console.error("Run with 'list' to see available jobs.");
    process.exit(1);
  }

  const ctx = { cap_dt: capture_datetime("America/New_York") };
  await handler(ctx);
};

const on_boot = async () => {
  const job = process.argv[2];
  if (!job) {
    console.error("Usage: node index.js <job_name>");
    console.error("Run with 'list' to see available jobs.");
    process.exit(1);
  }
  console.log(job);
  await run_job(job);
};

on_boot();
