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
import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Color;

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
      editor.putBoolean("firstLaunchPending", true); // Add this line to track pending first launch
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
    settings.setAllowContentAccess(true);
    settings.setBlockNetworkImage(false);
    settings.setBlockNetworkLoads(false);
    settings.setMediaPlaybackRequiresUserGesture(false);  // Add this
    settings.setDisplayZoomControls(false);               // Add this
    settings.setBuiltInZoomControls(false);               // Add this
    settings.setUseWideViewPort(true);                    // Add this
    settings.setLoadWithOverviewMode(true);               // Add this
    settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING); // Add this

    // Force background color
    webView.setBackgroundColor(Color.WHITE);
    
    // Set default app URL to load local files instead of 192.168.18.2
    // This is critical - we need to ensure we're starting with file:// URLs
    webView.loadUrl("file:///android_asset/public/index.html");
    
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
        
        // Intercept and redirect 192.168.18.2 requests for resources
        // Updated to handle IP address instead of 192.168.18.2
        if (url.contains("192.168.18.2:8100") || url.contains("192.168.18.2:8101")) {
          // Extract path after IP:port
          String path;
          if (url.contains("192.168.18.2:8100")) {
            path = url.substring(url.indexOf("192.168.18.2:8100") + "192.168.18.2:8100".length());
          } else if (url.contains("192.168.18.2:8101")) {
            path = url.substring(url.indexOf("192.168.18.2:8101") + "192.168.18.2:8101".length());
          } else {
            // Generic handling for other 192.168.18.2 URLs
            int portIndex = url.indexOf("192.168.18.2:") + "192.168.18.2:".length();
            int pathIndex = url.indexOf("/", portIndex);
            if (pathIndex > 0) {
              path = url.substring(pathIndex);
            } else {
              path = "/";
            }
          }
          
          if (!path.startsWith("/")) path = "/" + path;
          
          String localPath = "file:///android_asset/public" + path;
          Log.d(TAG, "Redirecting resource: " + url + " to " + localPath);
          
          // Handle common content types
          if (url.endsWith(".js")) {
            return new WebResourceResponse("application/javascript", "UTF-8", null);
          } else if (url.endsWith(".css")) {
            return new WebResourceResponse("text/css", "UTF-8", null);
          }
        }
        
        return super.shouldInterceptRequest(view, request);
      }
      
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        Log.d(TAG, "URL loading: " + url);
        
        // REMOVED 192.168.18.2 references - only handle IP URLs
        if (url.contains("192.168.18.2:8100") || url.contains("192.168.18.2:8101")) {
          
          String path;
          if (url.contains("192.168.18.2:8100")) {
            // Extract path after IP:8100
            int startIndex = url.indexOf("192.168.18.2:8100") + "192.168.18.2:8100".length();
            path = url.substring(startIndex);
          } else {
            // Extract path after IP:8101
            int startIndex = url.indexOf("192.168.18.2:8101") + "192.168.18.2:8101".length();
            path = url.substring(startIndex);
          }
          
          if (!path.startsWith("/")) path = "/" + path;
          
          String newUrl = "file:///android_asset/public" + path;
          Log.d(TAG, "Redirecting to: " + newUrl);
          view.loadUrl(newUrl);
          return true;
        }
        
        // Handle deep links - REMOVED 192.168.18.2 reference
        if (url.contains("192.168.18.2") && url.contains("/")) {
          String path = url.substring(url.indexOf("/", 8));
          Log.d("DeepLink", "Path component: " + path);
          
          // Don't override app navigation
          return false;
        }
        
        return super.shouldOverrideUrlLoading(view, request);
      }
      
      @Override
      public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        Log.d(TAG, "Page starting: " + url);
        
        // If we detect a 192.168.18.2 or IP URL starting to load, immediately redirect
        if (url.contains("192.168.18.2:8100") || url.contains("192.168.18.2:8101")) {
          String path;
          if (url.contains("192.168.18.2:8100")) {
            path = url.substring(url.indexOf("192.168.18.2:8100") + "192.168.18.2:8100".length());
          } else {
            path = url.substring(url.indexOf("192.168.18.2:8101") + "192.168.18.2:8101".length());
          }
          
          if (path.isEmpty() || path.equals("/")) path = "/index.html";
          if (!path.startsWith("/")) path = "/" + path;
          
          String newUrl = "file:///android_asset/public" + path;
          Log.d(TAG, "Intercepting start: redirecting to " + newUrl);
          view.stopLoading(); // Stop the current load
          view.loadUrl(newUrl); // Load the correct URL
        }
      }
      
      @Override
      public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        Log.d(TAG, "Page finished loading: " + url);
        
        // Enhanced fix script with more robust handling
        String fixScript = 
            "console.log('Running enhanced protocol and path fixes...');" +
            
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
            
            // Fix 3: More robust history API patching
            "if (!window.history._replace) {" +
            "  window.history._replace = window.history.replaceState;" +
            "  window.history.replaceState = function(state, title, url) {" +
            "    try {" +
            "      if (url && url.startsWith('file:///')) {" +
            "        url = url.substring(url.lastIndexOf('/')+1);" +
            "        console.log('Fixed URL for history: ' + url);" +
            "      } else if (url && (url.indexOf('192.168.18.2:8100') > -1 || url.indexOf('192.168.18.2:8101') > -1)) {" +
            "        url = url.replace(/https?:\\/\\/192\\.168\\.18\\.2:\\d+/g, '');" +
            "        console.log('Fixed IP URL for history: ' + url);" +
            "      }" +
            "      return window.history._replace(state, title, url);" +
            "    } catch(e) {" +
            "      console.error('History API error: ' + e);" +
            "    }" +
            "  };" +
            "};" +
            
            // Fix 4: Fix all IP references in the DOM
            "document.querySelectorAll('[href*=\"192.168.18.2:8100\"], [href*=\"192.168.18.2:8101\"], [src*=\"192.168.18.2:8100\"], [src*=\"192.168.18.2:8101\"]').forEach(function(el) {" +
            "  var attrName = el.hasAttribute('href') ? 'href' : 'src';" +
            "  var attrValue = el.getAttribute(attrName);" +
            "  if (attrValue) {" +
            "    var newValue = attrValue.replace(/https?:\\/\\/192\\.168\\.18\\.2:\\d+/g, '');" +
            "    console.log('Fixing IP attr: ' + attrValue + ' -> ' + newValue);" +
            "    el.setAttribute(attrName, newValue);" +
            "  }" +
            "});" +
            
            // Fix 5: Patch fetch and XMLHttpRequest to handle IP URLs only
            "if (!window._originalFetch) {" +
            "  window._originalFetch = window.fetch;" +
            "  window.fetch = function(url, options) {" +
            "    if (typeof url === 'string' && (url.includes('192.168.18.2:8100') || url.includes('192.168.18.2:8101'))) {" +
            "      url = url.replace(/https?:\\/\\/192\\.168\\.18\\.2:\\d+/g, '');" +
            "      console.log('Intercepted fetch to IP, redirecting to:', url);" +
            "    }" +
            "    return window._originalFetch(url, options);" +
            "  };" +
            "}" +
            
            // Fix for XHR - update to handle any IP port
            "var originalOpen = XMLHttpRequest.prototype.open;" +
            "XMLHttpRequest.prototype.open = function(method, url, async, user, password) {" +
            "  if (typeof url === 'string' && (url.includes('192.168.18.2:8100') || url.includes('192.168.18.2:8101'))) {" +
            "    url = url.replace(/https?:\\/\\/192\\.168\\.18\\.2:\\d+/g, '');" +
            "    console.log('Intercepted XHR to IP, redirecting to:', url);" +
            "  }" +
            "  return originalOpen.call(this, method, url, async, user, password);" +
            "};";
        
        view.evaluateJavascript(fixScript, null);
        
        // Handle first launch - Show onboarding
        if (firstLaunch) {
          // Wait a bit longer to ensure page is fully loaded and rendered
          new Handler(Looper.getMainLooper()).postDelayed(() -> {
            String onboardingScript = 
                "document.body.style.backgroundColor = 'white';" + // Force background color
                "document.body.style.visibility = 'visible';" +   // Ensure visibility
                "localStorage.setItem('forceOnboarding', 'true');" + 
                "localStorage.setItem('isAndroidApp', 'true');" +
                "console.log('First launch detected, showing onboarding');" +
                "setTimeout(function() {" +
                "  window.location.hash = '/onboarding';" +
                "}, 300);"; // Small delay for stability
            
            view.evaluateJavascript(onboardingScript, null);
            
            // Add additional logging for debugging
            Log.d(TAG, "Injected onboarding script, forcing navigation to onboarding");
          }, 1000); // Increased delay for more stable loading
        }
      }
      
      @Override
      public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
        Log.e(TAG, "WebView error: " + description + " for URL: " + failingUrl);
        
        // More verbose logging for debugging
        Log.d(TAG, "Attempting to recover from WebView error...");
        
        // REMOVED 192.168.18.2 check - only handle IP URLs
        if (failingUrl.contains("192.168.18.2")) {
          String path = "";
          
          if (failingUrl.contains("192.168.18.2:8100")) {
            path = failingUrl.substring(failingUrl.indexOf("192.168.18.2:8100") + "192.168.18.2:8100".length());
            Log.d(TAG, "Extracted path from 192.168.18.2:8100: " + path);
          } else if (failingUrl.contains("192.168.18.2:8101")) {
            path = failingUrl.substring(failingUrl.indexOf("192.168.18.2:8101") + "192.168.18.2:8101".length());
            Log.d(TAG, "Extracted path from 192.168.18.2:8101: " + path);
          } else {
            // Generic IP handling - extract whatever port it might have
            int portStartIdx = failingUrl.indexOf("192.168.18.2:") + "192.168.18.2:".length();
            int portEndIdx = failingUrl.indexOf("/", portStartIdx);
            
            if (portEndIdx > 0) {
              String port = failingUrl.substring(portStartIdx, portEndIdx);
              path = failingUrl.substring(portEndIdx);
              Log.d(TAG, "Extracted port: " + port + " and path: " + path);
            } else {
              path = "/";
              Log.d(TAG, "Could not extract path, using default: " + path);
            }
          }
          
          if (path.isEmpty() || path.equals("/")) path = "/index.html";
          if (!path.startsWith("/")) path = "/" + path;
          
          // Always use file protocol for local assets
          String newUrl = "file:///android_asset/public" + path;
          Log.d(TAG, "Error recovery: loading " + newUrl + " instead of " + failingUrl);
          view.loadUrl(newUrl);
        } else {
          Log.d(TAG, "Error was not for an IP URL, cannot recover");
        }
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
    // Register the permission manager plugin
    registerPlugin(PermissionManagerPlugin.class);
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

  @CapacitorPlugin(name = "PermissionManager")
  public static class PermissionManagerPlugin extends Plugin {
    private static final int CAMERA_PERMISSION_REQUEST = 1001;
    private static final int MICROPHONE_PERMISSION_REQUEST = 1002;
    
    @PluginMethod()
    public void checkPermissions(PluginCall call) {
      JSObject permissions = new JSObject();
      
      // Check camera permission
      if (getActivity().checkSelfPermission(Manifest.permission.CAMERA) == 
          PackageManager.PERMISSION_GRANTED) {
        permissions.put("camera", "granted");
      } else {
        permissions.put("camera", "denied");
      }
      
      // Check microphone permission
      if (getActivity().checkSelfPermission(Manifest.permission.RECORD_AUDIO) == 
          PackageManager.PERMISSION_GRANTED) {
        permissions.put("microphone", "granted");
      } else {
        permissions.put("microphone", "denied");
      }
      
      JSObject result = new JSObject();
      result.put("permissions", permissions);
      call.resolve(result);
    }
    
    @PluginMethod()
    public void requestCameraPermission(PluginCall call) {
      // Save the call for access in callback
      saveCall(call);
      
      if (getActivity().checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
        JSObject result = new JSObject();
        result.put("camera", "granted");
        call.resolve(result);
        return;
      }
      
      pluginRequestPermission(Manifest.permission.CAMERA, CAMERA_PERMISSION_REQUEST);
    }
    
    @PluginMethod()
    public void requestMicrophonePermission(PluginCall call) {
      // Save the call for access in callback
      saveCall(call);
      
      if (getActivity().checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
        JSObject result = new JSObject();
        result.put("microphone", "granted");
        call.resolve(result);
        return;
      }
      
      pluginRequestPermission(Manifest.permission.RECORD_AUDIO, MICROPHONE_PERMISSION_REQUEST);
    }

    @PluginMethod()
    public void requestNotificationPermission(PluginCall call) {
        // For Android 13+ (API 33+)
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            saveCall(call);
            pluginRequestPermission(Manifest.permission.POST_NOTIFICATIONS, 1003);
        } else {
            // For older Android versions, notifications don't need runtime permission
            JSObject result = new JSObject();
            result.put("notifications", "granted");
            call.resolve(result);
        }
    }

    @PluginMethod()
    public void requestStoragePermission(PluginCall call) {
        saveCall(call);
        pluginRequestPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE, 1004);
    }
    
    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
      super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
      
      PluginCall savedCall = getSavedCall();
      if (savedCall == null) {
        return;
      }
      
      JSObject result = new JSObject();
      
      if (requestCode == CAMERA_PERMISSION_REQUEST) {
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
          result.put("camera", "granted");
        } else {
          result.put("camera", "denied");
        }
        savedCall.resolve(result);
      } else if (requestCode == MICROPHONE_PERMISSION_REQUEST) {
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
          result.put("microphone", "granted");
        } else {
          result.put("microphone", "denied");
        }
        savedCall.resolve(result);
      }
    }
  }
}
