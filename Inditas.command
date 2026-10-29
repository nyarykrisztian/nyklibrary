#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export NEXT_TELEMETRY_DISABLED=1
if [[ -x /opt/homebrew/bin/brew ]]; then
  brew_bin=/opt/homebrew/bin/brew
elif [[ -x /usr/local/bin/brew ]]; then
  brew_bin=/usr/local/bin/brew
elif command -v brew >/dev/null 2>&1; then
  brew_bin="$(command -v brew)"
else
  echo "Előbb végezd el a telepítést a MAC-UTMUTATO.md alapján."
  exit 1
fi
export PATH="$("$brew_bin" --prefix node@24)/bin:$("$brew_bin" --prefix)/bin:$PATH"
export EX_LIBRIS_EXPAT_LIB_DIR="$("$brew_bin" --prefix expat)/lib"
source scripts/python-env.sh
if [[ ! -f .next/BUILD_ID || ! -d node_modules || ! -x .venv/bin/python ]]; then
  echo "Még nincs kész a telepítés. Előbb futtasd: bash Telepites.command"
  exit 1
fi
if ! exlibris_python .venv/bin/python -c 'from PIL import Image; import pyexpat; import platform; assert platform.mac_ver()[0]' >/dev/null 2>&1; then
  echo "A Python-környezet telepítése hiányos. Futtasd: bash Telepites.command"
  exit 1
fi
if curl --fail --silent --max-time 2 http://127.0.0.1:3000/api/books >/dev/null 2>&1; then
  echo "Az alkalmazás már fut. Megnyitjuk a böngészőben."
  open http://127.0.0.1:3000
  exit 0
fi
echo "Az Ex Libris indítása. Ezt az ablakot használat közben hagyd nyitva."
node --use-env-proxy node_modules/next/dist/bin/next start --hostname 127.0.0.1 &
server_pid=$!
cleanup() { kill -TERM "$server_pid" 2>/dev/null || true; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
ready=0
for attempt in {1..90}; do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "Nem sikerült az indítás. A fenti hibaüzenetet másold be a beszélgetésbe."
    exit 1
  fi
  if curl --fail --silent --max-time 2 http://127.0.0.1:3000/api/books >/dev/null 2>&1; then
    ready=1
    open http://127.0.0.1:3000
    break
  fi
  sleep 0.5
done
if [[ "$ready" != 1 ]]; then
  echo "Az alkalmazás nem válaszolt időben. A fenti hibaüzenetet másold be a beszélgetésbe."
  exit 1
fi
echo "A böngésző megnyílt. Leállítás: ebben az ablakban Control+C (nem Command+C)."
wait "$server_pid"
