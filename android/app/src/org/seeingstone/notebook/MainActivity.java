package org.seeingstone.notebook;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Shows notebook/index.html (bundled in assets) in a WebView.
 * The page keeps its data in localStorage and, through the bridge below, in a file in the
 * app's private storage. The file is what Android's automatic backup picks up.
 */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0A0A0B"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        web.addJavascriptInterface(new Bridge(), "NBAndroid");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Stay inside the bundled page; there is nowhere else to go.
                return !url.startsWith("file:///android_asset/");
            }
        });
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        // Let the page close sheets and step back first; leave the app only if it does not handle it.
        web.evaluateJavascript(
            "(function(){try{return !!(window.__back&&window.__back())}catch(e){return false}})()",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String handled) {
                    if (!"true".equals(handled)) {
                        finish();
                    }
                }
            });
    }

    @Override
    protected void onPause() {
        // Make the page write any text it still holds back.
        web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))", null);
        super.onPause();
    }

    private class Bridge {
        @JavascriptInterface
        public void copy(final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null) {
                        cm.setPrimaryClip(ClipData.newPlainText("Black Notebook export", text));
                    }
                }
            });
        }

        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType("text/plain");
                        send.putExtra(Intent.EXTRA_SUBJECT, "Black Notebook export");
                        send.putExtra(Intent.EXTRA_TEXT, text);
                        startActivity(Intent.createChooser(send, "Share export"));
                    } catch (RuntimeException e) {
                        Toast.makeText(MainActivity.this, "Too large to share. Use Copy instead.", Toast.LENGTH_LONG).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void save(String json) {
            try {
                File dir = getFilesDir();
                File tmp = new File(dir, "notebook.json.tmp");
                FileOutputStream out = new FileOutputStream(tmp);
                try {
                    out.write(json.getBytes("UTF-8"));
                    out.getFD().sync();
                } finally {
                    out.close();
                }
                File dst = new File(dir, "notebook.json");
                if (!tmp.renameTo(dst)) {
                    dst.delete();
                    tmp.renameTo(dst);
                }
            } catch (IOException e) {
                // localStorage still holds the data
            }
        }

        @JavascriptInterface
        public String load() {
            try {
                File f = new File(getFilesDir(), "notebook.json");
                if (!f.exists()) {
                    return "";
                }
                FileInputStream in = new FileInputStream(f);
                ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int n;
                try {
                    while ((n = in.read(buf)) > 0) {
                        bytes.write(buf, 0, n);
                    }
                } finally {
                    in.close();
                }
                return bytes.toString("UTF-8");
            } catch (IOException e) {
                return "";
            }
        }
    }
}
