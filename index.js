("use strict");
require("dotenv").config();
const jobs = require("./jobs");
const { capture_datetime } = require("./tools");
const { performance } = require("node:perf_hooks");
const db = require("./utils/db/pg-pool");

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
  update_hhm_status:          (ctx) => jobs.update_hhm_status(),
  rtt_hhm_drift:              (ctx) => jobs.rtt_hhm_drift(ctx.cap_dt),
  rtt_feed_change_report:     (ctx) => jobs.rtt_feed_change_report(ctx.cap_dt, process.argv[3]),
  export_csv:                 (ctx) => jobs.export_csv(),
  mapping_report:             (ctx) => jobs.mapping_report(ctx.cap_dt)
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

// Set while a job is running so the signal handlers can record a killed run;
// cleared before the finally-block insert so a late signal can't double-log.
let active_run = null;
let shutting_down = false;

const on_boot = async () => {
  const start = performance.now();
  const run_dt = capture_datetime("America/New_York");
  const job = process.argv[2];
  let status = "success";
  let error_message = null;
  active_run = { job, run_dt, start };

  // Release provenance: build-release.sh stamps RELEASE_SHA into the DEPLOYED
  // .env; a dev tree has no key and prints 'dev-tree'. This boot line is the
  // run's provenance record — cron captures it in the per-job .out file.
  // A scheduled run printing 'dev-tree' means cron is running the wrong copy.
  console.log(
    `[monday] job=${job || "(none)"} release_sha=${process.env.RELEASE_SHA || "dev-tree"}`
  );

  try {
    if (!job) {
      throw new Error("Usage: node index.js <job_name>");
    }

    await run_job(job);

  } catch (err) {
    status = "error";
    error_message = err.message;
    console.error(err.message);
  } finally {
    active_run = null;
    const end = performance.now();
    const ms = end - start;
    console.log(`Total runtime: ${ms.toFixed(2)} ms (${(ms / 1000).toFixed(2)} s)`);

    if (job && job !== "list") {
      try {
        await db.none(
          `INSERT INTO stats.job_runs (app_name, job_name, run_datetime, run_time_ms, status, error_message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [process.env.APP_NAME, job, run_dt.toISO(), +ms.toFixed(1), status, error_message]
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

// A killed run must still leave a stats.job_runs row and exit non-zero:
// without this, SIGTERM/SIGINT skip the finally-block insert and the run
// vanishes without a trace — no row, no honest exit code. gosu execs node as
// PID 1, so docker stop / cron kills deliver the signal directly. Once-guard
// so a second signal during the flush can't double-insert or recurse.
const record_kill = async (signal) => {
  if (shutting_down) return;
  shutting_down = true;
  console.error(`[monday] ${signal} received — recording killed run, exiting 1`);
  const run = active_run;
  if (run && run.job && run.job !== "list") {
    const ms = performance.now() - run.start;
    try {
      await Promise.race([
        db.none(
          `INSERT INTO stats.job_runs (app_name, job_name, run_datetime, run_time_ms, status, error_message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [process.env.APP_NAME, run.job, run.run_dt.toISO(), +ms.toFixed(1),
           "error", `${signal} received — run killed before completion`]
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("kill-log insert timed out")), 5000)
        ),
      ]);
    } catch (dbErr) {
      console.error("Failed to log killed run:", dbErr.message);
    }
  }
  process.exit(1);
};

process.on("SIGTERM", () => record_kill("SIGTERM"));
process.on("SIGINT", () => record_kill("SIGINT"));

on_boot();
