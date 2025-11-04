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

set_postman_baseurl() {
  local file="$1"
  local value="$2"
  if [ ! -f "$file" ]; then
    echo "Postman collection $file not found; skipping postman baseUrl update"
    return 0
  fi

  echo "Updating Postman collection baseUrl to: $value (using sed)"

  # Escape slashes & ampersands for sed replacement
  esc_value=$(printf '%s' "$value" | sed -e 's/[\/&]/\\&/g')

  # Replace the value for the variable with key=="baseUrl".
  # This handles both formats where key and value are on the same line or on adjacent lines.
  sed -i -E "/\"key\"[[:space:]]*:[[:space:]]*\"baseUrl\"/ {\
    N;\
    s/(\"value\"[[:space:]]*:[[:space:]]*)\"[^\"]*\"/\1\"${esc_value}\"/;\
  }" "$file"
  echo "Updated $file using sed"
}

set_urls_in_file() {
  local file="$1"

  echo "Updating URLs in $file"

 
  # Replace VITE_API_BASE_URL if it exists
  if grep -q -E '^\s*VITE_API_BASE_URL\s*=' "$file"; then
    sed -i "s|^\s*VITE_API_BASE_URL\s*=.*|VITE_API_BASE_URL=http://${IP}:4000/api|" "$file"
  fi

  # Replace BACKEND_URL if it exists
  if grep -q -E '^\s*BACKEND_URL\s*=' "$file"; then
    sed -i "s|^\s*BACKEND_URL\s*=.*|BACKEND_URL=\"http://${IP}:4000\"|" "$file"
  fi

  # Replace FRONTEND_URL if it exists
  if grep -q -E '^\s*FRONTEND_URL\s*=' "$file"; then
    sed -i "s|^\s*FRONTEND_URL\s*=.*|FRONTEND_URL=\"http://${IP}:8080\"|" "$file"
  fi

}

if [ -f docker-compose.yml ]; then
  sed -i.tmp -E "s|^([[:space:]]*-?[[:space:]]*HOST_EXTERNAL[[:space:]]*=).*|\1${IP}|" docker-compose.yml && rm -f docker-compose.yml.tmp
else
  echo "docker-compose.yml not found; skipped updating HOST_EXTERNAL"
fi


for file in $(find . -type f -name "*.env"); do
  echo "Processing: $file"
  set_urls_in_file $file
done



echo "backend URL : http://${IP}:4000"
echo "frontend URL: http://${IP}:8080"

# Update Postman collection baseUrl variable (sed-only)
POSTMAN_FILE="./postman/SquidPong-services.postman_collection.json"
BASE_URL="http://${IP}:4000"
set_postman_baseurl "$POSTMAN_FILE" "$BASE_URL" || true

exit 0
