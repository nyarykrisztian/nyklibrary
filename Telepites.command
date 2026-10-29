#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export NEXT_TELEMETRY_DISABLED=1
if command -v brew >/dev/null 2>&1; then
  brew_bin="$(command -v brew)"
elif [[ -x /opt/homebrew/bin/brew ]]; then
  brew_bin=/opt/homebrew/bin/brew
elif [[ -x /usr/local/bin/brew ]]; then
  brew_bin=/usr/local/bin/brew
else
  echo "Előbb telepítsd a Homebrew-t. Lásd a MAC-UTMUTATO.md 2. lépését."
  exit 1
fi
export PATH="$(dirname "$brew_bin"):$PATH"
echo "Az Ex Libris szükséges programjait telepítjük. Ez első alkalommal hosszabb ideig tarthat."
"$brew_bin" install node@24 python@3.12 ffmpeg tesseract
export PATH="$("$brew_bin" --prefix node@24)/bin:$("$brew_bin" --prefix)/bin:$PATH"
export EX_LIBRIS_SETUP_PYTHON="$("$brew_bin" --prefix python@3.12)/bin/python3.12"
npm run setup
echo ""
echo "A telepítés elkészült. Indítás: bash Inditas.command"
