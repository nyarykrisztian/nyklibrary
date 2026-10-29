#!/bin/bash
# Source from the project root. Set library lookup only for Python processes:
# passing DYLD_* globally through Apple's protected shells is unreliable.
exlibris_python() {
  local expat_dir="${EX_LIBRIS_EXPAT_LIB_DIR:-}"
  if [[ "$(uname -s)" == Darwin ]]; then
    if [[ -z "$expat_dir" ]]; then
      if [[ -f /opt/homebrew/opt/expat/lib/libexpat.1.dylib ]]; then
        expat_dir=/opt/homebrew/opt/expat/lib
      elif [[ -f /usr/local/opt/expat/lib/libexpat.1.dylib ]]; then
        expat_dir=/usr/local/opt/expat/lib
      fi
    fi
    if [[ -n "$expat_dir" && -f "$expat_dir/libexpat.1.dylib" ]]; then
      env DYLD_LIBRARY_PATH="$expat_dir${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}" "$@"
      return $?
    fi
  fi
  "$@"
}
