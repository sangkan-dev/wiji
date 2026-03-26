#!/usr/bin/env bash
# Re-download self-hosted WOFF2 files from Google Fonts (SIL Open Font License).
# Requires: curl, grep (Chrome-like User-Agent returns woff2).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FONTS="$ROOT/static/fonts"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'

mkdir -p "$FONTS/plus-jakarta-sans" "$FONTS/jetbrains-mono" "$FONTS/noto-sans-javanese"

fetch() {
	local dest="$1" url="$2"
	echo "-> $dest"
	curl -sL -A "$UA" -o "$dest" "$url"
}

# Plus Jakarta Sans variable: latin + latin-ext (subset order from CSS sheet)
PU="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800&display=swap"
P_LATIN="$(curl -sL -A "$UA" "$PU" | grep -Eo 'https://fonts.gstatic.com[^)]+woff2' | sed -n '4p')"
P_LATIN_EXT="$(curl -sL -A "$UA" "$PU" | grep -Eo 'https://fonts.gstatic.com[^)]+woff2' | sed -n '3p')"
fetch "$FONTS/plus-jakarta-sans/PlusJakartaSans-Variable.woff2" "$P_LATIN"
fetch "$FONTS/plus-jakarta-sans/PlusJakartaSans-Variable-ext.woff2" "$P_LATIN_EXT"

# JetBrains Mono variable: latin + latin-ext (last two entries in default CSS)
JM="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap"
J_LATIN_EXT="$(curl -sL -A "$UA" "$JM" | grep -Eo 'https://fonts.gstatic.com[^)]+woff2' | sed -n '5p')"
J_LATIN="$(curl -sL -A "$UA" "$JM" | grep -Eo 'https://fonts.gstatic.com[^)]+woff2' | sed -n '6p')"
fetch "$FONTS/jetbrains-mono/JetBrainsMono-Variable-ext.woff2" "$J_LATIN_EXT"
fetch "$FONTS/jetbrains-mono/JetBrainsMono-Variable.woff2" "$J_LATIN"

# Noto Sans Javanese
NJ="https://fonts.googleapis.com/css2?family=Noto+Sans+Javanese&display=swap"
N1="$(curl -sL -A "$UA" "$NJ" | grep -Eo 'https://fonts.gstatic.com[^)]+woff2' | sed -n '1p')"
N2="$(curl -sL -A "$UA" "$NJ" | grep -Eo 'https://fonts.gstatic.com[^)]+woff2' | sed -n '2p')"
N3="$(curl -sL -A "$UA" "$NJ" | grep -Eo 'https://fonts.gstatic.com[^)]+woff2' | sed -n '3p')"
fetch "$FONTS/noto-sans-javanese/javanese.woff2" "$N1"
fetch "$FONTS/noto-sans-javanese/latin-ext.woff2" "$N2"
fetch "$FONTS/noto-sans-javanese/latin.woff2" "$N3"

echo "Done."
