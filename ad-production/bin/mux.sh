#!/usr/bin/env bash
# Marry a rendered film to its synthesised sound bed.
#
#   bin/mux.sh <video.mp4> <audio.wav> <out.mp4>
#
# Video is copied, never re-encoded — muxing must not cost a generation.
# Audio is AAC 192k, and loudness is normalised toward -19 LUFS, which is
# quiet: these beds are ambience under a silent-first film, not a mix.

set -euo pipefail

VIDEO="${1:?input mp4}"
AUDIO="${2:?input wav}"
OUT="${3:?output mp4}"

mkdir -p "$(dirname "$OUT")"

ffmpeg -y -hide_banner -loglevel error \
  -i "$VIDEO" -i "$AUDIO" \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy \
  -af "loudnorm=I=-19:TP=-2.0:LRA=11" \
  -c:a aac -b:a 192k -ar 48000 \
  -shortest -movflags +faststart \
  "$OUT"

echo "[mux] $(du -h "$OUT" | cut -f1)  →  $OUT"
