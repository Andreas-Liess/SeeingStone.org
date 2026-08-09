#!/usr/bin/env bash
# Encode a captured frame directory into a delivery MP4.
#
#   bin/encode.sh <frames-dir> <out.mp4> [width] [height]
#
# H.264 High, yuv420p, +faststart — the combination LinkedIn and Instagram
# both ingest without re-encoding artefacts. CRF 16 because flat black and
# fine 1px hairlines are exactly what a lossy encoder destroys first.

set -euo pipefail

FRAMES="${1:?frames dir}"
OUT="${2:?output mp4}"
W="${3:-1080}"
H="${4:-1920}"

mkdir -p "$(dirname "$OUT")"

ffmpeg -y -hide_banner -loglevel error \
  -framerate 30 \
  -i "${FRAMES}/%05d.png" \
  -vf "scale=${W}:${H}:flags=lanczos,format=yuv420p" \
  -c:v libx264 \
  -profile:v high \
  -preset slow \
  -crf 16 \
  -x264-params "keyint=60:min-keyint=30:scenecut=0" \
  -movflags +faststart \
  -r 30 \
  "$OUT"

echo "[encode] $(du -h "$OUT" | cut -f1)  →  $OUT"
