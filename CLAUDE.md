# CLAUDE.md

> ## ⚠️ MID-MIGRATION (started 2026-08-25) — read this first
>
> **monday is being migrated to the fleet dev/release paradigm.** The spec is
> `/opt/apps/data_acquisition/docs/migration_CLAUDE.md` (Part 1 = conventions,
> Part 3 = migration checklist); the local reference implementation is
> **data_acquisition** (dev clone `~/apps/data_acquisition`). Until this banner
> is removed, sections below may describe either the pre-migration state or the
> target — each is labelled. When this file disagrees with the paradigm docs,
> **the paradigm docs win**.
>
> Migration state right now:
> - `/opt/apps/monday` (this tree) is **frozen** — docs-only commits, no code.
>   It will be wiped and replaced by `build-release.sh` output at cutover.
> - The editable tree will be the dev clone at `~/apps/monday`.
> - **The schedule is deliberately stopped** (by Matt, 2026-08-19). Nothing is
>   running from this tree. It restarts at cutover from the svc crontab.
> - `docs/run.sh` describes the pre-migration run flow (npm ci into a shared
>   cache mount). It is superseded by this file as migration commits land.

**monday** is a Node.js job runner that syncs Avante's Monday.com boards with
the staging database and Acumatica: it pulls equipment data from Acumatica's
API and `acumatica_rtt_feed` tables, pushes column updates / new items to
Monday.com boards (RTT-FEED, MMB/HHM customer workflow, tickets), and posts
Teams cards for ticket events. Run-once by design — each invocation runs one
named job and exits.

## Running a job

```bash
# Current (pre-migration) form — every run executes as svc:
docker compose run --rm app node index.js <job_name>
node index.js list          # print the job registry

# Target (post-migration) form:
#   dev:     RUN_USER=<you> docker compose run --rm app node index.js <job_name>   (from ~/apps/monday)
#   release: docker compose run --rm app node index.js <job_name>                  (from /opt/apps/monday, defaults to svc)
```

Job registry lives in [index.js](index.js). Jobs and what they touch:

| Job | External effects |
|---|---|
| `process_new_additions` | **writes** Monday.com boards (move items, set columns) |
| `update_mmb_he_data`, `update_hhm_status`, `delta_update_rtt_feed`, `equipment_rtt`, `rtt_feed_all`, `update_hhm_status` | **write** Monday.com boards; some read Acumatica |
| `new_avconn_tickets` | posts Teams webhook cards — **dead process since 2026-04-21, do not schedule** |
| `export_csv` | read-only: Monday.com board reads + Acumatica login/read → CSVs in `files/` |
| `mapping_report` | local only: code reflection → md report in repo root |
| `inspect*`, `board_info*`, `group_coverage` | interactive/diagnostic; some write `data_outputs/` |

**Any job named in the schedule mutates Monday.com boards. For smoke tests use
`list`, `mapping_report`, or `export_csv` only.**

## Run record: `stats.job_runs` (NOT `util.app_run_logs`)

monday does not use the fleet's vendored file logger — `utils/logger/` is
**dead code here**. The only run record is one row per run in
**`stats.job_runs`** (shared table; data_acquisition writes it too), inserted
by `index.js` in a `finally` block: `app_name, job_name, run_datetime,
run_time_ms, status ('success'|'error'), error_message`. Console output is the
only other trace (captured by cron `.out` files post-migration).

```sql
SELECT job_name, run_datetime, status, error_message
FROM stats.job_runs WHERE app_name='monday'
ORDER BY run_datetime DESC LIMIT 20;
```

Decision 2026-08-25: **no schema change** to `stats.job_runs` for release
provenance. `RELEASE_SHA` will be stamped into the deployed `.env` and printed
on the boot console line (→ cron `.out`), not stored per-row.

## Docker setup

Current state (pre-migration; target in parentheses):

- **Dockerfile** — `node:lts` + gosu; users `svc`/`jonathan-pope`/`matt-teixeira`
  from no-default ARGs `DOCKER_GID`, `UID_0/1/2` (a strength — keep);
  entrypoint **baked** via COPY. (Target adds `ARG USER_ID` +
  `LABEL version="${USER_ID}"`.)
- **entrypoint.sh** — gosu drop to `RUN_USER`, default `svc`. (Target adds
  while-still-root repair of `files/` and `data_outputs/` — Docker creates
  missing bind-mount sources root-owned and `export_csv` dies writing there.)
- **docker-compose.yaml** — image `monday:${IMAGE_TAG}`; mounts `./:/workspace`,
  a shared node_modules cache (`/opt/resources/node_mod_cache/monday`), and a
  dead `/opt/run-logs/monday` mount; `RUN_USER` defaulted in compose **and**
  pinned `svc` in `.env`. (Target: `monday:${USER_ID}`, in-tree node_modules,
  both extra mounts removed, `RUN_USER: ${RUN_USER:-}` so the entrypoint alone
  decides identity.)
- **build.sh / build-release.sh / preflight-check.sh** — do not exist yet.
  (Target: per the paradigm — in-tree npm install as the calling user;
  clean-tree-guarded tar-pipe release to `/opt/apps/monday` with `#RELEASE:`
  overrides and `RELEASE_SHA` stamp, built as svc with
  `HOME=/opt/apps/.svc-home`; preflight with authenticated PG check from a
  sibling container + read-only Monday.com `me` query.)

## Environment

`.env` is gitignored; `.env.example` is the tracked record. DB access uses the
**`PGHOST` family** (`PGHOST=pg_db`, `PGDATABASE=staging`, `PGUSER`,
`PGPASSWORD`) via [utils/db/pg-pool.js](utils/db/pg-pool.js); compose forces
`PG_SSLMODE=require`.

**Known warts — kept deliberately (decision 2026-08-25), handle with care:**

- `.env` also carries an **active `PG_*` block pointing at Azure PROD**
  (`PG_HOST=prod-avante-connected...`, `PG_DB=prod`). `pg-pool.js` falls back
  `PGHOST → PG_HOST`, so if the `PGHOST` line is ever removed the app silently
  aims at prod. Do not remove the `PGHOST` lines; do not "clean up" the PROD
  block without Matt's sign-off.
- [db/pgPool.js](db/pgPool.js) is an **unused** second pool hardwired to Azure
  PROD. Nothing requires it. Do not import it.
- `utils/` is mostly inherited dead code from the shared-utils era (mmb-rpp and
  reports SQL, vpn/, units/, config-processor/). Only `utils/db/pg-pool.js` is
  live. Cleanup is deferred until after cutover.

Secrets in `.env` (postgres superuser password, Monday API token, Acumatica
prod credentials, Teams webhooks) are live. The deployed copy goes mode 640 at
release. Registration with the host rotation script for `PGPASSWORD` is
pending.

## Schedule (svc crontab — to be installed at cutover)

Deliberately stopped 2026-08-19. Historical cadences, to be restored as
hardened svc-crontab entries (absolute paths, `flock -n` where overlap could
double-process, `-T`, bounded `.out` files in `/opt/run-logs/monday/`):

| Job | Cadence (ET) |
|---|---|
| `process_new_additions` | every 10 min |
| `update_mmb_he_data` | every 30 min at :20/:50 |
| `update_hhm_status` | hourly at :50 |
| `delta_update_rtt_feed` | daily 00:20 |
| `equipment_rtt` | daily 03:25 |

Baseline (healthy week 2026-08-12→19): 1008 / 336 / 168 / 7 / 7 runs,
≤1 error per family. Post-cutover verification diffs `stats.job_runs` against
these numbers. Expect a first-cycle surge while the 6-day backlog drains.
