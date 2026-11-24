# Black Notebook (Android app)

A guided notebook. It walks through the questions one at a time, stamps every entry with the date and time,
and exports the whole history as JSON for an AI assistant. The questions are copied word for word from the slides.

The app is the page in `../notebook/index.html` inside a WebView. It has no network permission.

## Install on a phone

1. Open `android/dist/BlackNotebook.apk` on the phone (GitHub app or browser, "Download").
2. Allow "Install unknown apps" for the app you used to open it, when Android asks.
3. If Play Protect warns about an unknown developer, choose "Install anyway". The app is signed with the key in this folder.

## Where the notes live

- In the app's private storage: `localStorage` plus the file `files/notebook.json`.
- Android's automatic backup includes that file, so a new phone restores it when backup is on.
- The Export tab copies everything as JSON. "Restore from an export" reads that JSON back in.

Uninstalling the app deletes the notes. Copy an export first.

## Update the app

Install a newer APK over the old one. This keeps the notes, but only if the new APK is signed with the same key.
That key is `android/notebook.keystore`. It is not in git (it is in `.gitignore`), so keep a copy somewhere safe.
`build.sh` creates a new key when none exists. An APK signed with a different key will not install over the old app:
export your notes first, uninstall, install the new APK, then use "Restore from an export".
The version code is the number of git commits, so every build is newer than the last.

## Rebuild

```
apt-get install -y openjdk-21-jdk-headless aapt android-framework-res android-sdk-platform-23 dalvik-exchange zipalign apksigner
bash android/build.sh
```

No Gradle and no Android SDK download are needed. The script packages `notebook/index.html`, compiles
`app/src/.../MainActivity.java`, signs the result and writes `android/dist/BlackNotebook.apk`.

## Layout

| Path | What it is |
| --- | --- |
| `app/AndroidManifest.xml` | App id `org.seeingstone.notebook`, Android 7+ (API 24), no permissions |
| `app/src/org/seeingstone/notebook/MainActivity.java` | WebView, back button, copy / share / file save for the page |
| `app/res/` | Icon (adaptive and legacy), theme, app name |
| `build.sh` | Builds and signs the APK |
| `notebook.keystore` | Signing key (kept out of git) |
| `dist/BlackNotebook.apk` | The last build |
