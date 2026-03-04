("use strict");
require("dotenv").config();
const jobs = require("./jobs");
const { capture_datetime } = require("./tools");
const { performance } = require("node:perf_hooks");
const db = require("./db/pgPool");

// Registry: map CLI name → handler function
// Each handler receives a context object with shared resources (cap_dt, etc.)
const jobs_registry = {
  inspect:                    (ctx) => jobs.inspect_board(),
  inspect_interactive:        (ctx) => jobs.interactive_inspect(),
  board_info_interactive:     (ctx) => jobs.interactive_board_info(),
  board_info:                 (ctx) => jobs.get_board_info().then(bi => console.log(bi.items_page.items)),
  group_coverage:             (ctx) => jobs.group_by_coverage(),
  sync_missing_data:          (ctx) => jobs.sync_missing_data(),
  inspect_missing_data_board: (ctx) => jobs.inspect_missing_data_board(),
  new_avconn_tickets:         (ctx) => jobs.new_avconn_tickets(),
  equipment_rtt:              (ctx) => jobs.update_rtt_board(ctx.cap_dt),
  process_new_additions:      (ctx) => jobs.process_new_additions(),
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
  const run_dt = capture_datetime("America/New_York");
  const job = process.argv[2];
  let status = "success";
  let error_message = null;

  try {
    if (!job) {
      throw new Error("Usage: node index.js <job_name>");
    }

    console.log(job);
    await run_job(job);

  } catch (err) {
    status = "error";
    error_message = err.message;
    console.error(err.message);
  } finally {
    const end = performance.now();
    const ms = end - start;
    console.log(`Total runtime: ${ms.toFixed(2)} ms (${(ms / 1000).toFixed(2)} s)`);

    if (job && job !== "list") {
      try {
        await db.none(
          `INSERT INTO stats.job_runs (app_name, job_name, run_datetime, run_time_ms, status, error_message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [process.env.APP_NAME, job, run_dt.toISO(), ms, status, error_message]
        );
      } catch (dbErr) {
        console.error("Failed to log job run:", dbErr.message);
      }
    }

    if (status === "error") process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

on_boot();
