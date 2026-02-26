("use strict");
require("dotenv").config();
const jobs = require("./jobs");
const { capture_datetime } = require("./tools");
const { performance } = require("node:perf_hooks");

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
  update_mmb_he_data:         (ctx) => jobs.update_mmb_he_data(),
  delta_update_rtt_feed:      (ctx) => jobs.delta_update_rtt_feed(ctx.cap_dt),
  update_hhm_status:          (ctx) => jobs.update_hhm_status()
};

const run_job = async (name) => {
  if (name === "list") {
    console.log("Available jobs:\n" + Object.keys(jobs_registry).map(k => `  - ${k}`).join("\n"));
    return;
  }

  const handler = jobs_registry[name];
  if (!handler) {
    throw new Error(`Unknown job: "${name}". Run with 'list' to see available jobs.`);
  }

  const ctx = { cap_dt: capture_datetime("America/New_York") };
  await handler(ctx);
};

const on_boot = async () => {
  const start = performance.now();

  try {
    const job = process.argv[2];
    if (!job) {
      throw new Error("Usage: node index.js <job_name>");
    }

    console.log(job);
    await run_job(job);

  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    const end = performance.now();
    const ms = end - start;
    console.log(`Total runtime: ${ms.toFixed(2)} ms (${(ms / 1000).toFixed(2)} s)`);
  }
};

on_boot();
