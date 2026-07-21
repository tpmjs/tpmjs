#!/usr/bin/env bash

# Transactional on-box deployment for the two TPMJS services built from this
# repository. A candidate image must pass its own runtime smoke test before the
# live tag moves. If activation fails, the ERR trap restores the exact prior
# image and restarts the service before returning a failure to the operator.

set -Eeuo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly REPO_ROOT
readonly EXECUTOR_IMAGE='localhost/tpmjs-railway-executor:local'
readonly WEB_IMAGE='localhost/tpmjs-web:built'
readonly EXECUTOR_SERVICE='tpmjs-railway-executor.service'
readonly WEB_SERVICE='tpmjs-web.service'
readonly EXECUTOR_HEALTH_URL='http://127.0.0.1:3210/health'
readonly WEB_HEALTH_URL='http://127.0.0.1:3200/api/health'
readonly PUBLIC_WEB_HEALTH_URL='https://tpmjs.com/api/health'
readonly MIN_FREE_KB=$((5 * 1024 * 1024))

COMMIT_SHA=''
COMMIT_MESSAGE=''
CURRENT_TARGET=''
CURRENT_LIVE_IMAGE=''
CURRENT_OLD_IMAGE=''
CURRENT_OLD_REVISION=''
CURRENT_SERVICE=''
CURRENT_ACTIVATED=0
CANDIDATE_CONTAINER=''
CANDIDATE_IMAGE=''

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-on-box.sh <executor|web|all|verify>

  executor  Build, smoke-test, and transactionally activate the Deno executor.
  web       Build, smoke-test, and transactionally activate the Next.js app.
  all       Deploy executor first, then web.
  verify    Make no changes; prove both live services match origin/main.
USAGE
}

log() {
  printf '[tpmjs-deploy] %s\n' "$*"
}

fail() {
  printf '[tpmjs-deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

need_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

stop_candidate_container() {
  if [[ -n "$CANDIDATE_CONTAINER" ]]; then
    sudo podman rm --force "$CANDIDATE_CONTAINER" >/dev/null 2>&1 || true
    CANDIDATE_CONTAINER=''
  fi
}

remove_candidate_tag() {
  if [[ -n "$CANDIDATE_IMAGE" ]]; then
    sudo podman image rm "$CANDIDATE_IMAGE" >/dev/null 2>&1 || true
    CANDIDATE_IMAGE=''
  fi
}

cleanup() {
  stop_candidate_container
  remove_candidate_tag
}

rollback_current_service() {
  if ((CURRENT_ACTIVATED == 0)); then
    return 0
  fi

  printf '[tpmjs-deploy] ACTIVATION FAILED: restoring %s from %s\n' \
    "$CURRENT_TARGET" "${CURRENT_OLD_IMAGE:0:19}" >&2
  sudo podman tag "$CURRENT_OLD_IMAGE" "$CURRENT_LIVE_IMAGE"
  sudo systemctl restart "$CURRENT_SERVICE"
  sudo systemctl is-active --quiet "$CURRENT_SERVICE"
  if [[ "$CURRENT_TARGET" == 'executor' ]]; then
    wait_for_basic_health "$EXECUTOR_HEALTH_URL" executor
  else
    wait_for_basic_health "$WEB_HEALTH_URL" web
  fi
  printf '[tpmjs-deploy] rollback to %s is active and healthy\n' \
    "${CURRENT_OLD_REVISION:-${CURRENT_OLD_IMAGE:0:19}}" >&2
}

on_error() {
  local exit_code=$?
  local line=${1:-unknown}
  trap - ERR
  set +e
  printf '[tpmjs-deploy] command failed at line %s (exit %s)\n' "$line" "$exit_code" >&2
  stop_candidate_container
  rollback_current_service
  remove_candidate_tag
  exit "$exit_code"
}

trap 'on_error "$LINENO"' ERR
trap cleanup EXIT

image_revision() {
  sudo podman image inspect "$1" --format '{{ index .Labels "org.opencontainers.image.revision" }}'
}

safe_tag_fragment() {
  printf '%s' "$1" | tr -cs '[:alnum:]_.-' '-' | sed 's/^-//; s/-$//'
}

assert_image_revision() {
  local image=$1
  local actual
  actual=$(image_revision "$image")
  [[ "$actual" == "$COMMIT_SHA" ]] ||
    fail "image $image is stamped $actual, expected $COMMIT_SHA"
}

assert_free_space() {
  local mount=$1
  local available
  available=$(df -Pk "$mount" | awk 'NR == 2 { print $4 }')
  [[ "$available" =~ ^[0-9]+$ ]] || fail "could not measure free space on $mount"
  ((available >= MIN_FREE_KB)) ||
    fail "$mount has less than 5 GiB free; refusing to start an image build"
}

assert_migrations_applied() {
  local disk_migrations applied_migrations
  disk_migrations=$(find packages/db/prisma/migrations \
    -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)
  applied_migrations=$(sudo podman exec tpmjs-pg psql \
    --username tpmjs \
    --dbname tpmjs \
    --tuples-only \
    --no-align \
    --set ON_ERROR_STOP=1 \
    --command 'SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name;')

  if ! diff --unified \
    <(printf '%s\n' "$disk_migrations") \
    <(printf '%s\n' "$applied_migrations"); then
    fail 'production migrations differ from the repository; back up and migrate separately before deploying web'
  fi
}

preflight() {
  local target=$1
  local command
  for command in git sudo podman systemctl curl jq pnpm df awk sed tr seq date find sort diff; do
    need_command "$command"
  done

  sudo -n true >/dev/null 2>&1 || fail 'passwordless sudo is required for unattended rollback'
  cd "$REPO_ROOT"

  [[ "$(git branch --show-current)" == 'main' ]] || fail 'deployments must run from main'
  [[ -z "$(git status --porcelain --untracked-files=no)" ]] ||
    fail 'tracked worktree changes are present'

  local head remote_main
  head=$(git rev-parse HEAD)
  remote_main=$(git ls-remote --exit-code origin refs/heads/main | awk '{ print $1 }')
  [[ "$head" == "$remote_main" ]] ||
    fail "local HEAD $head does not equal origin/main $remote_main"

  COMMIT_SHA=$(git rev-parse --short=8 HEAD)
  COMMIT_MESSAGE=$(git log -1 --pretty=%s)

  assert_free_space /
  assert_free_space /mnt/donto-data
  if [[ "$target" != 'executor' ]]; then
    assert_migrations_applied
  fi
  log "preflight passed for $COMMIT_SHA"
}

wait_for_executor_health() {
  local url=$1
  local payload=''
  local attempt
  for attempt in $(seq 1 45); do
    if payload=$(curl --fail --silent --show-error --max-time 5 "$url" 2>/dev/null) &&
      jq --exit-status --arg sha "$COMMIT_SHA" \
        '.status == "ok" and .protocolVersion == "1.1" and .implementationVersion == $sha' \
        <<<"$payload" >/dev/null; then
      return 0
    fi
    sleep 1
  done
  printf '%s\n' "$payload" >&2
  return 1
}

wait_for_web_health() {
  local url=$1
  local payload=''
  local actual=''
  local attempt
  for attempt in $(seq 1 45); do
    if payload=$(curl --fail --silent --show-error --max-time 5 "$url" 2>/dev/null); then
      actual=$(jq --raw-output '.build.commitSha // empty' <<<"$payload")
      if jq --exit-status '.status == "ok" and .env.hasDatabase == true' \
        <<<"$payload" >/dev/null &&
        ((${#actual} >= 7)) && [[ "$COMMIT_SHA" == "$actual"* ]]; then
        return 0
      fi
    fi
    sleep 1
  done
  printf '%s\n' "$payload" >&2
  return 1
}

wait_for_basic_health() {
  local url=$1
  local kind=$2
  local payload=''
  local attempt
  for attempt in $(seq 1 45); do
    if payload=$(curl --fail --silent --show-error --max-time 5 "$url" 2>/dev/null); then
      if [[ "$kind" == 'executor' ]] &&
        jq --exit-status '.status == "ok"' <<<"$payload" >/dev/null; then
        return 0
      fi
      if [[ "$kind" == 'web' ]] &&
        jq --exit-status '.status == "ok" and .env.hasDatabase == true' \
          <<<"$payload" >/dev/null; then
        return 0
      fi
    fi
    sleep 1
  done
  printf '%s\n' "$payload" >&2
  return 1
}

smoke_executor_candidate() {
  local image=$1
  local payload=''
  local attempt

  CANDIDATE_CONTAINER="tpmjs-executor-candidate-${COMMIT_SHA}-$$"
  sudo podman run --detach --rm \
    --name "$CANDIDATE_CONTAINER" \
    --network tpmjs \
    --user deno \
    --cap-drop ALL \
    --security-opt no-new-privileges \
    --entrypoint deno \
    --env EXECUTOR_API_KEY=deploy-smoke \
    --env PORT=3002 \
    "$image" \
    run --allow-net --allow-env --allow-read --allow-write --allow-run --allow-sys --allow-ffi \
    server.ts >/dev/null

  for attempt in $(seq 1 30); do
    if payload=$(sudo podman exec "$CANDIDATE_CONTAINER" \
      curl --fail --silent --show-error http://127.0.0.1:3002/health 2>/dev/null) &&
      jq --exit-status --arg sha "$COMMIT_SHA" \
        '.status == "ok" and .protocolVersion == "1.1" and .implementationVersion == $sha' \
        <<<"$payload" >/dev/null; then
      break
    fi
    if ((attempt == 30)); then
      sudo podman logs "$CANDIDATE_CONTAINER" >&2 || true
      return 1
    fi
    sleep 1
  done

  payload=$(sudo podman exec "$CANDIDATE_CONTAINER" curl \
    --fail-with-body --silent --show-error --max-time 120 \
    --request POST http://127.0.0.1:3002/execute-tool \
    --header 'Authorization: Bearer deploy-smoke' \
    --header 'Content-Type: application/json' \
    --data-binary '{"packageName":"@tpmjs/tools-normalize-whitespace","name":"normalizeWhitespaceTool","version":"0.2.0","params":{"text":"hello   world"},"env":{}}')
  jq --exit-status '.success == true and .output.text == "hello world"' \
    <<<"$payload" >/dev/null

  stop_candidate_container
}

smoke_web_candidate() {
  local image=$1
  local attempt

  CANDIDATE_CONTAINER="tpmjs-web-candidate-${COMMIT_SHA}-$$"
  sudo podman run --detach --rm \
    --name "$CANDIDATE_CONTAINER" \
    --network tpmjs \
    --env-file /etc/donto/tpmjs-web.env \
    "$image" >/dev/null

  for attempt in $(seq 1 45); do
    if sudo podman exec "$CANDIDATE_CONTAINER" node -e '
      void (async () => {
        const expected = process.argv[1];
        const response = await fetch("http://127.0.0.1:3000/api/health");
        const body = await response.json();
        const actual = body?.build?.commitSha;
        if (!response.ok || body?.status !== "ok" || body?.env?.hasDatabase !== true ||
            typeof actual !== "string" || actual.length < 7 || !expected.startsWith(actual)) {
          process.exit(1);
        }
      })().catch(() => process.exit(1));
    ' "$COMMIT_SHA" >/dev/null 2>&1; then
      stop_candidate_container
      return 0
    fi
    if ((attempt == 45)); then
      sudo podman logs "$CANDIDATE_CONTAINER" >&2 || true
      return 1
    fi
    sleep 1
  done
}

prepare_activation() {
  local target=$1
  local live_image=$2
  local service=$3
  local old_revision rollback_fragment rollback_tag

  CURRENT_TARGET=$target
  CURRENT_LIVE_IMAGE=$live_image
  CURRENT_SERVICE=$service
  CURRENT_OLD_IMAGE=$(sudo podman image inspect "$live_image" --format '{{.Id}}')
  CURRENT_ACTIVATED=0

  old_revision=$(image_revision "$live_image")
  CURRENT_OLD_REVISION=$old_revision
  rollback_fragment=$(safe_tag_fragment "${old_revision:-${CURRENT_OLD_IMAGE:7:12}}")
  rollback_tag="${live_image%:*}:rollback-${rollback_fragment}-$(date -u +%Y%m%dT%H%M%SZ)"
  sudo podman tag "$CURRENT_OLD_IMAGE" "$rollback_tag"
  log "preserved $target rollback image as $rollback_tag"
}

activate_candidate() {
  local candidate=$1
  sudo podman tag "$candidate" "$CURRENT_LIVE_IMAGE"
  CURRENT_ACTIVATED=1
  sudo systemctl restart "$CURRENT_SERVICE"
  sudo systemctl is-active --quiet "$CURRENT_SERVICE"
}

finish_activation() {
  local target=$1
  CURRENT_ACTIVATED=0
  remove_candidate_tag
  log "$target $COMMIT_SHA is live and verified"
  CURRENT_TARGET=''
  CURRENT_LIVE_IMAGE=''
  CURRENT_OLD_IMAGE=''
  CURRENT_OLD_REVISION=''
  CURRENT_SERVICE=''
}

deploy_executor() {
  log 'building executor candidate'
  CANDIDATE_IMAGE="localhost/tpmjs-railway-executor:candidate-${COMMIT_SHA}"
  sudo podman build \
    --build-arg "COMMIT_SHA=$COMMIT_SHA" \
    --build-arg "COMMIT_MESSAGE=$COMMIT_MESSAGE" \
    --tag "$CANDIDATE_IMAGE" \
    apps/railway-executor/
  assert_image_revision "$CANDIDATE_IMAGE"
  smoke_executor_candidate "$CANDIDATE_IMAGE"
  log 'executor candidate passed protocol and real-tool smoke tests'

  prepare_activation executor "$EXECUTOR_IMAGE" "$EXECUTOR_SERVICE"
  activate_candidate "$CANDIDATE_IMAGE"
  wait_for_executor_health "$EXECUTOR_HEALTH_URL"
  [[ "$(image_revision "$EXECUTOR_IMAGE")" == "$COMMIT_SHA" ]]
  finish_activation executor
}

deploy_web() {
  log 'building Next.js standalone output'
  pnpm --filter @tpmjs/web build

  CANDIDATE_IMAGE="localhost/tpmjs-web:candidate-${COMMIT_SHA}"
  sudo podman build --no-cache --network=host \
    --build-arg "COMMIT_SHA=$COMMIT_SHA" \
    --build-arg "COMMIT_MESSAGE=$COMMIT_MESSAGE" \
    --tag "$CANDIDATE_IMAGE" \
    --file Dockerfile \
    apps/web/.next
  assert_image_revision "$CANDIDATE_IMAGE"
  smoke_web_candidate "$CANDIDATE_IMAGE"
  log 'web candidate passed database-aware runtime smoke test'

  prepare_activation web "$WEB_IMAGE" "$WEB_SERVICE"
  activate_candidate "$CANDIDATE_IMAGE"
  wait_for_web_health "$WEB_HEALTH_URL"
  wait_for_web_health "$PUBLIC_WEB_HEALTH_URL"
  [[ "$(image_revision "$WEB_IMAGE")" == "$COMMIT_SHA" ]]
  finish_activation web
}

verify_live() {
  sudo systemctl is-active --quiet "$EXECUTOR_SERVICE"
  sudo systemctl is-active --quiet "$WEB_SERVICE"
  [[ "$(image_revision "$EXECUTOR_IMAGE")" == "$COMMIT_SHA" ]]
  [[ "$(image_revision "$WEB_IMAGE")" == "$COMMIT_SHA" ]]
  wait_for_executor_health "$EXECUTOR_HEALTH_URL"
  wait_for_web_health "$WEB_HEALTH_URL"
  wait_for_web_health "$PUBLIC_WEB_HEALTH_URL"
  log "executor and web both match $COMMIT_SHA"
}

main() {
  local target=${1:-}
  case "$target" in
    executor | web | all | verify) ;;
    -h | --help)
      usage
      return 0
      ;;
    *)
      usage >&2
      return 2
      ;;
  esac

  preflight "$target"
  case "$target" in
    executor) deploy_executor ;;
    web) deploy_web ;;
    all)
      deploy_executor
      deploy_web
      ;;
    verify) verify_live ;;
  esac
}

main "$@"
