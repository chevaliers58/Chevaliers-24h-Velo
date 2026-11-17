#!/usr/bin/env bash
# Preview only. Hosting authentication must be enabled before any deployment.
set -euo pipefail
if [[ "${VERCEL_ENV:-}" != "preview" ]]; then
  echo "Refusing non-preview deployment for Chevaliers 58." >&2
  exit 1
fi
export VITE_SUPABASE_PROJECT_ID=qxlsdauqoivqhoojlrwk
export VITE_SUPABASE_URL=https://qxlsdauqoivqhoojlrwk.supabase.co
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?Set the project publishable key in Preview environment only}"
if [[ "$VITE_SUPABASE_PUBLISHABLE_KEY" != sb_publishable_* || "$VITE_SUPABASE_PUBLISHABLE_KEY" == *placeholder* || "$VITE_SUPABASE_PUBLISHABLE_KEY" == *replace_with* ]]; then
  echo "A real publishable key is required (no private or CI placeholder key)." >&2
  exit 1
fi
export VITE_TROOP_NAME="Chevaliers 58"
export VITE_TROOP_STRAVA_CLUB_URL=https://www.strava.com/clubs/Chevaliers58
export VITE_BASE_PATH=/velo/
if [[ -z "${VITE_SITE_URL:-}" ]]; then
  : "${VERCEL_URL:?Set VITE_SITE_URL to the actual HTTPS preview URL with /velo}"
  export VITE_SITE_URL="https://${VERCEL_URL}/velo"
fi
if [[ ! "$VITE_SITE_URL" =~ ^https://[a-zA-Z0-9.-]+/velo/?$ || "$VITE_SITE_URL" == https://19-58.net/* ]]; then
  echo "Set a separate HTTPS preview URL ending in /velo." >&2
  exit 1
fi
export CF_PAGES_COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-preview}"
npm run build:pages
