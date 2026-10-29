#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
revision="${1:-main}"
if [[ "$revision" != main && ! "$revision" =~ ^[a-f0-9]{40}$ ]]; then
  echo "Érvénytelen javításazonosító." >&2
  exit 1
fi
base="https://raw.githubusercontent.com/nyarykrisztian/nyklibrary/$revision"
temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/exlibris-repair.XXXXXX")"
trap 'rm -rf "$temp_dir"' EXIT
echo "A javított telepítőfájlok letöltése…"
curl --fail --location --retry 2 "$base/Telepites.command" -o "$temp_dir/Telepites.command"
curl --fail --location --retry 2 "$base/scripts/setup.sh" -o "$temp_dir/setup.sh"
curl --fail --location --retry 2 "$base/scripts/python-packages.py" -o "$temp_dir/python-packages.py"
bash -n "$temp_dir/Telepites.command" "$temp_dir/setup.sh"
mv "$temp_dir/Telepites.command" Telepites.command
mv "$temp_dir/setup.sh" scripts/setup.sh
mv "$temp_dir/python-packages.py" scripts/python-packages.py
echo "A javítás letöltve. Folytatjuk a telepítést; a könyvadatok megmaradnak."
bash Telepites.command
