package io.ionic.starter;

import android.os.Bundle;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.BridgeActivity;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.util.Log;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebChromeClient;
import android.webkit.ConsoleMessage;
import android.net.Uri;

public class MainActivity extends BridgeActivity {
  private static final String TAG = "GhostTalk";
  
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Check first launch status
    SharedPreferences prefs = getSharedPreferences("GhostTalkPrefs", MODE_PRIVATE);
    boolean firstLaunch = prefs.getBoolean("firstLaunch", true);
    
    if (firstLaunch) {
      Log.d(TAG, "First launch detected, will set up onboarding");
      SharedPreferences.Editor editor = prefs.edit();
      editor.putBoolean("firstLaunch", false);
      editor.apply();
    }
    
    // Access WebView after Bridge initialization
    WebView webView = this.bridge.getWebView();
    
    // Configure WebView settings
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowFileAccessFromFileURLs(true);
    settings.setAllowUniversalAccessFromFileURLs(true);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    
    // WebView debugging (remove in production)
    WebView.setWebContentsDebuggingEnabled(true);
    
    // Set up WebViewClient for path fixing and redirection
    webView.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        
        // Log important resource requests for debugging
        if (url.contains(".css") || url.contains(".js")) {
          Log.d(TAG, "Loading resource: " + url);
        }
        
        return super.shouldInterceptRequest(view, request);
      }
      
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        Log.d(TAG, "URL loading: " + url);
        
        // Redirect any localhost URLs to file protocol
        if (url.startsWith("https://localhost/") || url.startsWith("http://localhost/")) {
          String path = url.substring(url.indexOf("/", 8)); // Get path after localhost
          String newUrl = "file:///android_asset/public" + path;
          Log.d(TAG, "Redirecting to: " + newUrl);
          view.loadUrl(newUrl);
          return true;
        }
        
        return false;
      }
      
      @Override
      public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        Log.d(TAG, "Page starting: " + url);
      }
      
      @Override
      public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        Log.d(TAG, "Page finished loading: " + url);
        
        // Fix issues in the loaded page for Android WebView
        String fixScript = 
            "console.log('Running protocol and path fixes...');" +
            
            // Fix 1: Ensure proper base href
            "var baseEl = document.querySelector('base') || document.createElement('base');" +
            "baseEl.href = 'file:///android_asset/public/';" +
            "if (!baseEl.parentNode) document.head.insertBefore(baseEl, document.head.firstChild);" +
            
            // Fix 2: Fix CSS stylesheet paths
            "document.querySelectorAll('link[rel=\"stylesheet\"]').forEach(function(link) {" +
            "  var href = link.getAttribute('href');" +
            "  if (href && href.startsWith('/')) {" +
            "    var fixedHref = 'file:///android_asset/public' + href;" +
            "    console.log('Fixing CSS path: ' + href + ' -> ' + fixedHref);" +
            "    link.setAttribute('href', fixedHref);" +
            "  }" +
            "});" +
            
            // Fix 3: Patch history API to handle file:// URLs properly
            "if (!window.history._replace) {" +
            "  window.history._replace = window.history.replaceState;" +
            "  window.history.replaceState = function(state, title, url) {" +
            "    try {" +
            "      if (url && url.startsWith('file:///')) {" +
            "        url = url.substring(url.lastIndexOf('/')+1);" +
            "        console.log('Fixed URL for history: ' + url);" +
            "      }" +
            "      return window.history._replace(state, title, url);" +
            "    } catch(e) {" +
            "      console.error('History API error: ' + e);" +
            "    }" +
            "  };" +
            "}";
        
        view.evaluateJavascript(fixScript, null);
        
        // Handle first launch - Show onboarding
        if (firstLaunch) {
          // Wait a bit to ensure page is fully loaded
          new Handler(Looper.getMainLooper()).postDelayed(() -> {
            String onboardingScript = 
                "localStorage.setItem('forceOnboarding', 'true');" +
                "console.log('First launch detected, showing onboarding');" +
                // Direct navigation approach using hash routing
                "window.location.hash = '/onboarding';";
            
            view.evaluateJavascript(onboardingScript, null);
          }, 500);
        }
      }
    });
    
    // Inside your onCreate method, add this to the webView config
    webView.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        Log.d("DeepLink", "Processing URL: " + url);
        
        // Fix for app-specific deep links
        if (url.contains("localhost") && url.contains("/")) {
          String path = url.substring(url.indexOf("/", 8));
          Log.d("DeepLink", "Path component: " + path);
          
          // Don't override app navigation
          return false;
        }
        return super.shouldOverrideUrlLoading(view, request);
      }
    });
    
    // Console logging for debugging
    webView.setWebChromeClient(new WebChromeClient() {
      @Override
      public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
        Log.d(TAG + "-Web", consoleMessage.message());
        return true;
      }
    });
    
    // Register the first launch plugin
    registerPlugin(FirstLaunchPlugin.class);
  }
  
  @CapacitorPlugin(name = "FirstLaunch")
  public static class FirstLaunchPlugin extends Plugin {
    @PluginMethod()
    public void checkFirstLaunch(PluginCall call) {
      SharedPreferences prefs = getContext().getSharedPreferences("GhostTalkPrefs", MODE_PRIVATE);
      boolean isFirstLaunchPending = prefs.getBoolean("firstLaunchPending", false);
      
      JSObject ret = new JSObject();
      ret.put("isFirstLaunch", isFirstLaunchPending);
      
      // Clear the first launch flag if it was set
      if (isFirstLaunchPending) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean("firstLaunchPending", false);
        editor.apply();
      }
      
      call.resolve(ret);
    }
  }
}
