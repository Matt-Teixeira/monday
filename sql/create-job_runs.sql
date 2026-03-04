CREATE SCHEMA IF NOT EXISTS stats;

CREATE TABLE stats.job_runs (
    app_name       TEXT        NOT NULL,
    job_name       TEXT        NOT NULL,
    run_datetime   TIMESTAMPTZ NOT NULL,
    run_time_ms    NUMERIC     NOT NULL,
    status         TEXT        NOT NULL,
    error_message  TEXT,
    PRIMARY KEY (app_name, job_name, run_datetime)
);
