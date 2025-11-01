#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" ]; then
  IP="$1"
else
  iface=$(ip -o link show 2>/dev/null | grep -vE 'lo|docker|br-|veth' | head -n1 | awk -F': ' '{print $2}' || true)
  ip_addr=""
  if [ -n "$iface" ]; then
    ip_addr=$(ip -4 addr show "$iface" 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || true)
  fi
  IP=${ip_addr:-}
fi

if [ -z "${IP:-}" ]; then
  echo "Could not determine IP. Provide it as first argument or ensure scripts/ip.sh is present." >&2
  exit 2
fi

echo "Using IP: $IP"

set_urls_in_file() {
  local file="$1"

  if grep -q -E '^\s*BACKEND_URL\s*=' "$file"; then
    sed -i "s|^\s*BACKEND_URL\s*=.*|BACKEND_URL=\"http://${IP}:4000\"|" "$file"
  else
    echo "BACKEND_URL=\"http://${IP}:4000\"" >> "$file"
  fi

  # Replace FRONTEND_URL if it exists
  if grep -q -E '^\s*FRONTEND_URL\s*=' "$file"; then
    sed -i "s|^\s*FRONTEND_URL\s*=.*|FRONTEND_URL=\"http://${IP}:5173\"|" "$file"
  fi
}

found=0
while IFS= read -r -d $'\0' envfile; do
  found=1
  set_urls_in_file "$envfile"
done < <(find ./backend -type f -name "*.env" -print0)

if [ $found -eq 0 ]; then
  echo "No .env files found under ./backend." >&2
fi

if [ -f docker-compose.yml ]; then
  sed -i.tmp -E "s|^([[:space:]]*-?[[:space:]]*HOST_EXTERNAL[[:space:]]*=).*|\1${IP}|" docker-compose.yml && rm -f docker-compose.yml.tmp
else
  echo "docker-compose.yml not found; skipped updating HOST_EXTERNAL"
fi

echo "backend URL : http://${IP}:4000"
echo "frontend URL: http://${IP}:8080"

exit 0
