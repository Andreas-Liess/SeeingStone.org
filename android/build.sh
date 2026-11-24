#!/usr/bin/env bash
# Builds the Black Notebook APK from notebook/index.html, without Gradle.
#
# Tools (Ubuntu/Debian):
#   apt-get install -y openjdk-21-jdk-headless aapt android-framework-res android-sdk-platform-23 \
#                      dalvik-exchange zipalign apksigner
#
# Run:   bash android/build.sh        Result: android/dist/BlackNotebook.apk
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/android/app"
DIST="$ROOT/android/dist"
FRAMEWORK=/usr/share/android-framework-res/framework-res.apk
ANDROID_JAR=/usr/lib/android-sdk/platforms/android-23/android.jar
DX=/usr/lib/android-sdk/build-tools/debian/dx
KEYSTORE="${NOTEBOOK_KEYSTORE:-$ROOT/android/notebook.keystore}"
KEYPASS="${NOTEBOOK_KEYPASS:-blacknotebook}"

# The version code rises with every commit. A newer APK then installs over the old one and keeps the notes.
VERSION_CODE="${VERSION_CODE:-$(git -C "$ROOT" rev-list --count HEAD)}"
VERSION_NAME="1.$VERSION_CODE"

OUT="$(mktemp -d)"
mkdir -p "$OUT/assets" "$OUT/classes" "$DIST"
cp "$ROOT/notebook/index.html" "$OUT/assets/index.html"

# 1. Manifest, resources and the page. resources.arsc must stay uncompressed (-0 arsc) for Android 11+.
aapt package -f \
  -M "$APP/AndroidManifest.xml" -S "$APP/res" -A "$OUT/assets" -I "$FRAMEWORK" \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  -0 arsc -F "$OUT/unsigned.apk"

# 2. Java -> dex
javac -source 8 -target 8 -Xlint:-options -bootclasspath "$ANDROID_JAR" \
  -d "$OUT/classes" "$APP"/src/org/seeingstone/notebook/*.java
"$DX" --dex --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && aapt add unsigned.apk classes.dex > /dev/null)

# 3. Align and sign. The same keystore must be used for every build, or updates will not install.
#    The keystore is not in git. A missing one is created here; keep that file safe.
if [ ! -f "$KEYSTORE" ]; then
  echo "No signing key found. Creating $KEYSTORE. Keep it: only APKs signed with it can update the installed app."
  keytool -genkeypair -keystore "$KEYSTORE" -storetype PKCS12 -storepass "$KEYPASS" -alias notebook \
    -keyalg RSA -keysize 2048 -validity 36500 -dname "CN=Black Notebook"
fi
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KEYPASS" --key-pass "pass:$KEYPASS" --v4-signing-enabled false \
  --out "$DIST/BlackNotebook.apk" "$OUT/aligned.apk"
apksigner verify --print-certs "$DIST/BlackNotebook.apk" | head -3
echo "Built $DIST/BlackNotebook.apk (version $VERSION_NAME)"
