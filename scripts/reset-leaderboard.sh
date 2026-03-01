#!/bin/bash
# Reset leaderboard - deletes all entries from Supabase leaderboard_entries table
# Also resets games_played count for all users
# Usage: ./scripts/reset-leaderboard.sh
#
# NOTE: RLS policies must allow DELETE on leaderboard_entries for this to work.
# If entries persist after running this script, run the SQL manually in Supabase Dashboard:
#   DELETE FROM leaderboard_entries;
#   UPDATE users SET games_played = 0, total_score = 0, best_score = 0;

set -e

# Load env vars (only lines without spaces around =)
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v ' = ' | xargs)
elif [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep -v ' = ' | xargs)
fi

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set"
  exit 1
fi

echo "Deleting all leaderboard entries..."
curl -s -X DELETE \
  "${VITE_SUPABASE_URL}/rest/v1/leaderboard_entries?id=neq.00000000-0000-0000-0000-000000000000" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal"

echo "Done! Leaderboard has been reset."

echo ""
echo "Resetting games_played for all users..."
curl -s -X PATCH \
  "${VITE_SUPABASE_URL}/rest/v1/users?id=neq.00000000-0000-0000-0000-000000000000" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"games_played": 0, "total_score": 0, "best_score": 0}'

echo "Done! All user stats have been reset."
