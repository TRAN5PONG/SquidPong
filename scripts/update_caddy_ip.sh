#!/usr/bin/env bash
set -euo pipefail

# update_caddy_ip.sh
# Usage: ./scripts/update_caddy_ip.sh <interface> [--file /path/to/Caddyfile] [--dry-run]
# Example: ./scripts/update_caddy_ip.sh enp0s3 --file ./Caddyfile

FILE="./Caddyfile"
DRY_RUN=0

# Default interface requested by user
DEFAULT_IFACE="enp0s31f6"
# If caller passes a positional interface (first arg not starting with -), use it;
# otherwise default to DEFAULT_IFACE. This allows calling the script with
# options only (e.g. --file) or with no args to use the default interface.
IFACE="$DEFAULT_IFACE"
if [ "$#" -ge 1 ] && [ "${1:0:1}" != "-" ]; then
  IFACE="$1"
  shift || true
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --file)
      FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      echo "Usage: $0 <interface> [--file /path/to/Caddyfile] [--dry-run]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 2
      ;;
  esac
done

if [ ! -f "$FILE" ]; then
  echo "Caddyfile not found at: $FILE"
  exit 3
fi

# Get IPv4 address for the interface
IP=$(ip -4 addr show dev "$IFACE" 2>/dev/null | awk '/inet /{print $2}' | cut -d/ -f1 | head -n1 || true)

if [ -z "$IP" ]; then
  echo "No IPv4 address found for interface '$IFACE'."
  echo "Run 'ip -4 addr' to inspect available interfaces and addresses."
  exit 4
fi

echo "Using IP $IP for interface $IFACE"

# If --dry-run, print transformed content to stdout without changing the file
if [ "$DRY_RUN" -eq 1 ]; then
  echo "--- DRY RUN: showing updated Caddyfile content (not written) ---"
  sed -E "s|http://[0-9]+(\.[0-9]+){3}(:4000|:80)|http://$IP\2|g" "$FILE"
  exit 0
fi

# create a timestamped backup
TS=$(date +%s)
BACKUP="$FILE.bak.$TS"
cp "$FILE" "$BACKUP"
echo "Backup saved to $BACKUP"

# perform in-place replacement for host IP in Caddyfile for :4000 and :80
sed -E -i "s|http://[0-9]+(\.[0-9]+){3}(:4000|:80)|http://$IP\2|g" "$FILE"

echo "Updated $FILE — replaced HTTP host for :4000 and :80 entries with $IP"

echo "--- Diff (backup -> updated) ---"
if command -v diff >/dev/null 2>&1; then
  diff -u "$BACKUP" "$FILE" || true
else
  echo "(diff not available)"
fi

exit 0