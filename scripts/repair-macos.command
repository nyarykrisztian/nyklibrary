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
files=(Telepites.command Inditas.command scripts/setup.sh scripts/python-env.sh scripts/python-packages.py lib/python.ts lib/recognition.ts lib/hungarian.ts app/HungarianLookup.tsx app/page.tsx app/globals.css 'app/api/[...path]/route.ts')
echo "A javított telepítő- és indítófájlok letöltése…"
for file in "${files[@]}"; do
  mkdir -p "$temp_dir/$(dirname "$file")"
  curl --globoff --fail --location --retry 2 "$base/$file" -o "$temp_dir/$file"
done
bash -n "$temp_dir/Telepites.command" "$temp_dir/Inditas.command" "$temp_dir/scripts/setup.sh" "$temp_dir/scripts/python-env.sh"
for file in "${files[@]}"; do
  mv "$temp_dir/$file" "$file"
done
echo "A javítás letöltve. Folytatjuk a telepítést; a könyvadatok megmaradnak."
bash Telepites.command
