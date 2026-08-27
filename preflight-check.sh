#!/usr/bin/env bash
# Preflight for monday — validates the environment the NEXT run will actually
# use. Fleet paradigm (data_acquisition/docs/migration_CLAUDE.md); adapted from
# data_acquisition's preflight. A clean run reports ZERO warnings: treat a
# persistent warning as a bug in the check itself, or it trains people to
# ignore output.
#
# Exit codes: 0 = pass (or warnings only), 1 = critical errors found.
set -u
cd "$(dirname "$0")"

ERRORS=0; WARNINGS=0; OKS=0
ok()    { echo "  OK    $*"; OKS=$((OKS+1)); }
warn()  { echo "  WARN  $*"; WARNINGS=$((WARNINGS+1)); }
error() { echo "  ERROR $*"; ERRORS=$((ERRORS+1)); }
info()  { echo "        $*"; }
section(){ echo; echo "== $* =="; }

# Read KEY= from .env, stripping quotes, dotenv-style inline comments and
# trailing whitespace. NEVER source this .env: it holds $$ in Acumatica URIs.
env_val() {
    grep "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- \
        | sed -e 's/[[:space:]]\+#.*$//' -e 's/[[:space:]]*$//' \
              -e "s/^['\"]//" -e "s/['\"]$//"
}

# ---------------------------------------------------------------- 1. host dirs
section "Host directories"
# files/ is export_csv's output dir: gitignored (missing in a fresh clone,
# entrypoint.sh creates it on first docker run) and recreated svc:docker by
# build-release.sh in the release copy.
if [ -d files ] && [ -w files ]; then
    ok "files/ writable ($(stat -c '%U:%G %a' files))"
elif [ -d files ]; then
    error "files/ exists but is not writable by $(id -un) ($(stat -c '%U:%G %a' files)) — export_csv dies"
else
    warn "files/ missing (entrypoint.sh creates it on first docker run; build-release.sh creates it in a release)"
fi

# ------------------------------------------------------------------- 2. docker
section "Docker"
if docker ps >/dev/null 2>&1; then ok "docker daemon reachable"; else error "docker daemon not reachable as $(id -un)"; fi
if id -nG | grep -qw docker; then ok "$(id -un) is in the docker group"; else error "$(id -un) not in docker group"; fi
if docker compose version >/dev/null 2>&1; then ok "docker compose available"; else error "docker compose not available"; fi

USER_ID_V="$(env_val USER_ID)"
if [ -n "$USER_ID_V" ]; then
    if docker image inspect "monday:${USER_ID_V}" >/dev/null 2>&1; then
        ok "image monday:${USER_ID_V} present"
    else
        error "image monday:${USER_ID_V} missing — run: bash build.sh"
    fi
fi

# ----------------------------------------------------------------- 3. networks
section "Networks"
if docker network inspect pg_net >/dev/null 2>&1; then ok "network pg_net exists"; else error "network pg_net missing"; fi

# --------------------------------------------------------------------- 4. .env
section ".env"
if [ ! -f .env ]; then
    error ".env missing — copy .env.example and fill it in"
else
    REQUIRED="APP_NAME USER_ID PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PG_SSLMODE
              MONDAY_API_TOKEN
              MONDAY_BOARD_MRI_PLATFORM_REPORTING MONDAY_BOARD_ALERT_MATRIX
              MONDAY_BOARD_ID_RTT_FEED MONDAY_BOARD_ID_RTT_FEED_ALL
              MONDAY_BOARD_MMB_CUST_WORKFLOW MONDAY_BOARD_HHM_CUST_WORKFLOW
              MONDAY_BOARD_TICKETS MONDAY_BOARD_AVCONN_TICKETS
              PROD_LOGIN_URI PROD_LOGIN_NAME PROD_LOGIN_PW PROD_LOGIN_COMPANY
              PROD_EQUIPMENT_URI PROD_EQUIPMENT_ALL_URI"
    for key in $REQUIRED; do
        v="$(env_val "$key")"
        if [ -z "$v" ]; then
            error ".env: $key is empty or missing"
        else
            case "$key" in
                *PW*|*PASSWORD*|*TOKEN*|*KEY*|*SECRET*) ok ".env: $key set (masked)" ;;
                *) ok ".env: $key=$v" ;;
            esac
        fi
    done

    # PGHOST empty is worse than a missing key here: utils/db/pg-pool.js falls
    # back PGHOST -> PG_HOST, and this .env keeps an active PG_HOST pointing at
    # Azure PROD (kept deliberately, 2026-08-25 decision — see CLAUDE.md).
    if [ -z "$(env_val PGHOST)" ] && [ -n "$(env_val PG_HOST)" ]; then
        error ".env: PGHOST empty while PG_HOST is set — pg-pool.js would silently target PG_HOST ($(env_val PG_HOST))"
    fi

    # Teams webhooks feed new_avconn_tickets only — a dead process (2026-04-21,
    # do not schedule). Presence is informational, not a warning.
    for key in TEAMS_WH_REMOTE_TECH TEAMS_WH_AVCON_TICKETS; do
        [ -n "$(env_val "$key")" ] || info ".env: $key empty (only used by dead job new_avconn_tickets)"
    done

    for retired in IMAGE_TAG RUN_USER; do
        grep -q "^$retired=" .env && warn ".env: retired key $retired still present — remove it (see .env.example)"
    done
fi

# ---------------------------------------------------------------- 5. app files
section "Application files"
for f in index.js package.json Dockerfile entrypoint.sh docker-compose.yaml build.sh build-release.sh; do
    if [ -f "$f" ]; then ok "$f present"; else error "$f missing"; fi
done
for d in api config jobs sql tools utils/db; do
    if [ -d "$d" ]; then ok "$d/ present"; else error "$d/ missing"; fi
done
if [ -e utils/.git ]; then error "utils/.git exists — utils must be app-owned, not a nested repo"; else ok "utils/ is app-owned (no nested .git)"; fi

# --------------------------------------------------------------------- 6. deps
section "Dependencies"
if [ -d node_modules ] && [ -n "$(ls -A node_modules 2>/dev/null)" ]; then
    ok "root node_modules present ($(ls node_modules | wc -l) entries)"
else
    error "root node_modules missing or empty — run: bash build.sh"
fi

# ------------------------------------------------- 7. external services (AUTH)
section "External services (authenticated checks)"

# The Postgres auth test MUST run from a sibling container on pg_net, never
# via `docker exec <pg_container> psql`: pg_hba trusts local and loopback, so
# an exec'd psql succeeds with a deliberately WRONG password (that path hid a
# rotated password for three weeks on a sibling app). This mirrors how the app
# connects (utils/db/pg-pool.js): PG_SSLMODE from .env (require on this host).
PGHOST_V="$(env_val PGHOST)"; PGPORT_V="$(env_val PGPORT)"; PGUSER_V="$(env_val PGUSER)"
PGPASSWORD_V="$(env_val PGPASSWORD)"; PGDATABASE_V="$(env_val PGDATABASE)"
PG_SSLMODE_V="$(env_val PG_SSLMODE)"; PG_SSLMODE_V="${PG_SSLMODE_V:-require}"
if [ -z "$PGPASSWORD_V" ]; then
    error "PGPASSWORD empty in .env — cannot verify PostgreSQL authentication"
elif ! docker image inspect postgres:16 >/dev/null 2>&1; then
    # An unverified check must never look like a passing one.
    warn "postgres:16 image absent — PostgreSQL auth NOT verified"
    info "Fix: docker pull postgres:16   (needed only for this check)"
else
    PG_OUT=$(docker run --rm --network pg_net \
        -e PGPASSWORD="$PGPASSWORD_V" -e PGSSLMODE="$PG_SSLMODE_V" \
        -e PGCONNECT_TIMEOUT=10 \
        postgres:16 \
        psql -h "$PGHOST_V" -p "$PGPORT_V" -U "$PGUSER_V" -d "$PGDATABASE_V" \
             -tAc "SELECT 'ok'" 2>&1)
    if [ "$(echo "$PG_OUT" | tail -1 | tr -d '[:space:]')" = "ok" ]; then
        ok "PostgreSQL auth OK (sibling-container SSL connection as $PGUSER_V)"
    elif echo "$PG_OUT" | grep -qi "password authentication failed\|no password supplied"; then
        error "PostgreSQL rejected PGPASSWORD from .env — likely a rotated credential"
        info "Fix: check the secret with its owner; update BOTH copies' .env (dev clone + release)"
    elif echo "$PG_OUT" | grep -qi "certificate\|SSL"; then
        error "PostgreSQL SSL failure: $(echo "$PG_OUT" | head -2)"
    else
        error "PostgreSQL check failed: $(echo "$PG_OUT" | head -2)"
    fi
fi

# Monday.com: a read-only `me` query proves the token AUTHENTICATES — a
# non-empty token proves nothing (the Redis-NOAUTH lesson). Uses curl from the
# host; the token travels in a header, never in process args visible to ps.
MONDAY_TOKEN_V="$(env_val MONDAY_API_TOKEN)"
if [ -z "$MONDAY_TOKEN_V" ]; then
    error "MONDAY_API_TOKEN empty — cannot verify Monday.com auth"
elif ! command -v curl >/dev/null 2>&1; then
    warn "curl not available — Monday.com auth NOT verified"
else
    MB_OUT=$(curl -sS --max-time 15 -X POST https://api.monday.com/v2 \
        -H "Content-Type: application/json" \
        -H @<(printf 'Authorization: %s\n' "$MONDAY_TOKEN_V") \
        -d '{"query":"query { me { id name } }"}' 2>&1)
    if echo "$MB_OUT" | grep -q '"me":{"id"'; then
        ok "Monday.com auth OK (read-only me query)"
    elif echo "$MB_OUT" | grep -qi "not authenticated\|Unauthorized\|invalid token"; then
        error "Monday.com rejected MONDAY_API_TOKEN: $(echo "$MB_OUT" | head -c 200)"
    else
        error "Monday.com check failed: $(echo "$MB_OUT" | head -c 200)"
    fi
fi

# Acumatica: presence-only by decision (2026-08-25) — a real check would log
# into the production ERP. The export_csv smoke run exercises the real login.
info "Acumatica: presence-only (PROD_LOGIN_* checked above); real login exercised by export_csv"

# ----------------------------------------------- release currency (fleet-wide)
# FLEET-FINDINGS §4.1: two sessions shipped a release believing it contained
# work that existed only in the dev tree. Currency is a continuous property —
# check it on every preflight, from either copy.
section "Release currency"
if [ -d .git ]; then
    REL_DIR="/opt/apps/$(basename "$(pwd)")"
    REL_SHA="$(grep '^RELEASE_SHA=' "$REL_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d "'\"[:space:]")"
    HEAD_SHA="$(git rev-parse HEAD 2>/dev/null)"
    if [ -z "$HEAD_SHA" ]; then
        warn "cannot read git HEAD here — release currency not checked"
    elif [ -z "$REL_SHA" ]; then
        warn "no RELEASE_SHA at $REL_DIR/.env — release copy missing or never released"
    elif [ "$(git rev-parse --quiet --verify "$REL_SHA^{commit}" 2>/dev/null)" = "$HEAD_SHA" ]; then
        ok "release copy is current (RELEASE_SHA=$REL_SHA = HEAD)"
        [ -n "$(git status --porcelain 2>/dev/null)" ] && info "note: this tree has uncommitted changes — they are in NO release"
    else
        BEHIND="$(git rev-list --count "$REL_SHA..HEAD" 2>/dev/null)"
        if [ -n "$BEHIND" ] && [ "$BEHIND" -gt 0 ] 2>/dev/null; then
            warn "release copy is $BEHIND commit(s) behind HEAD (RELEASE_SHA=$REL_SHA) — /opt/apps runs OLD code until build-release.sh"
        else
            warn "deployed RELEASE_SHA=$REL_SHA is not an ancestor of HEAD (rebase? branch switch?) — verify what /opt/apps is running"
        fi
    fi
else
    REL_SHA="$(env_val RELEASE_SHA)"
    if [ -n "$REL_SHA" ]; then
        ok "release copy stamped RELEASE_SHA=$REL_SHA"
    else
        error "no RELEASE_SHA in this .env — this copy was not produced by build-release.sh"
    fi
fi

# ------------------------------------------------------------------ 8. summary
section "Summary"
echo "  $OKS ok, $WARNINGS warnings, $ERRORS errors"
if [ "$ERRORS" -gt 0 ]; then
    echo "  RESULT: FAIL"
    exit 1
fi
[ "$WARNINGS" -gt 0 ] && echo "  RESULT: PASS (with warnings — a clean run should report zero)"
[ "$WARNINGS" -eq 0 ] && echo "  RESULT: PASS"
