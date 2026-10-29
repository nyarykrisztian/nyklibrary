#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export NEXT_TELEMETRY_DISABLED=1
source scripts/python-env.sh
node -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(major<24||(major===24&&minor<5))throw Error("Node.js 24.5 vagy újabb szükséges.")'
setup_python="${EX_LIBRIS_SETUP_PYTHON:-python3}"
for tool in "$setup_python" ffmpeg ffprobe tesseract curl; do
  command -v "$tool" >/dev/null || { echo "Hiányzó program: $tool. Lásd README.md – Telepítés." >&2; exit 1; }
done
# macOS ships shasum; GNU/Linux normally provides sha256sum.
if command -v sha256sum >/dev/null; then
  checksum() { sha256sum --check; }
elif command -v shasum >/dev/null; then
  checksum() { shasum -a 256 --check; }
else
  echo "Hiányzó SHA-256 ellenőrző: sha256sum vagy shasum szükséges." >&2
  exit 1
fi
npm ci --no-audit --no-fund
base_version="$(exlibris_python "$setup_python" -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
venv_version="$(exlibris_python .venv/bin/python -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null || true)"
if [[ -d .venv ]]; then
  if [[ "$venv_version" != "$base_version" ]] || ! exlibris_python .venv/bin/python -m pip --version >/dev/null 2>&1; then
    backup=".venv-incomplete-$(date +%Y%m%d-%H%M%S)-$$"
    echo "Hiányos vagy más Python-verziójú környezet: megőrizzük itt: $backup"
    mv .venv "$backup"
  fi
fi
if [[ ! -x .venv/bin/python ]]; then
  echo "Python $base_version környezet létrehozása…"
  if ! exlibris_python "$setup_python" -m venv --without-pip .venv; then
    echo "Nem sikerült a Python-környezet létrehozása. A fenti hibaüzenetet másold be a beszélgetésbe." >&2
    exit 1
  fi
fi
if ! exlibris_python .venv/bin/python -m pip --version >/dev/null 2>&1; then
  echo "A Python csomagtelepítő offline előkészítése…"
  exlibris_python .venv/bin/python scripts/python-packages.py bootstrap
fi
exlibris_python .venv/bin/python scripts/python-packages.py install requirements.txt
mkdir -p .runtime/tessdata
for lang in eng hun; do
  if [[ "$lang" == eng ]]; then expected=7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2
  else expected=35067e7cfe102dcdc953f9a758fdfaa6296b17a1ee6d874ee780fa306430b9fb; fi
  model=".runtime/tessdata/$lang.traineddata"
  if [[ ! -f "$model" ]] || ! printf '%s  %s\n' "$expected" "$model" | checksum >/dev/null 2>&1; then
    curl --fail --location --retry 2 --max-time 90 "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/$lang.traineddata" -o "$model.download"
    printf '%s  %s\n' "$expected" "$model.download" | checksum
    mv "$model.download" "$model"
  fi
done
TESSDATA_PREFIX="$PWD/.runtime/tessdata" tesseract --list-langs
npm run build
