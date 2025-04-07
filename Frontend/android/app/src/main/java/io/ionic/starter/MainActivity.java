package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import android.content.SharedPreferences;
import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import android.view.WindowManager;
import android.view.View;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.util.Log;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Register our custom plugin
    this.registerPlugin(FirstLaunchPlugin.class);
    
    // Enable debugging and file access
    WebView webView = this.bridge.getWebView();
    WebSettings settings = webView.getSettings();
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(true);
    settings.setAllowFileAccessFromFileURLs(true);
    settings.setAllowUniversalAccessFromFileURLs(true);
    settings.setDomStorageEnabled(true);  // Ensure localStorage works
    settings.setJavaScriptEnabled(true);  // Ensure JavaScript works
    settings.setMediaPlaybackRequiresUserGesture(false);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);

    // Enable remote debugging if in debug build
    WebView.setWebContentsDebuggingEnabled(true);
    
    // Status bar handling
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      getWindow().setStatusBarColor(getResources().getColor(R.color.colorPrimary));
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            decorView.getSystemUiVisibility() & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        );
      }
    }
    
    // Check if this is the first launch
    SharedPreferences prefs = getSharedPreferences("GhostTalk_Prefs", Context.MODE_PRIVATE);
    boolean firstLaunch = prefs.getBoolean("firstLaunch", true);
    
    if (firstLaunch) {
      Log.d("GhostTalk", "First launch detected, preparing to show onboarding");
      // Give more time for WebView to initialize
      new Handler(Looper.getMainLooper()).postDelayed(() -> {
        try {
          // Log to logcat for debugging
          Log.d("GhostTalk", "Loading onboarding page...");
          
          // Clear any existing localStorage value first
          webView.evaluateJavascript(
              "localStorage.removeItem('forceOnboarding');",
              null
          );
          
          // Set a flag in localStorage to force onboarding display
          webView.evaluateJavascript(
              "localStorage.setItem('forceOnboarding', 'true'); console.log('Force onboarding set in localStorage');",
              null
          );
          
          // Try a more robust approach to routing using the custom event you already have
          webView.evaluateJavascript(
              "try { " +
              "  console.log('Dispatching initialLoad event'); " +
              "  const event = new CustomEvent('initialLoad', {" +
              "    detail: JSON.stringify({ initialPath: '/onboarding' })" +
              "  }); " +
              "  window.dispatchEvent(event); " +
              "  console.log('Event dispatched successfully'); " +
              "} catch(e) { console.error('Error dispatching event:', e); }",
              null
          );
          
          // Mark as no longer first launch
          SharedPreferences.Editor editor = prefs.edit();
          editor.putBoolean("firstLaunch", false);
          editor.apply();
          Log.d("GhostTalk", "First launch flag updated in SharedPreferences");
        } catch (Exception e) {
          Log.e("GhostTalk", "Error loading onboarding", e);
        }
      }, 3000); // Increased delay for better reliability
    }
  }
  
  /**
   * Custom plugin to handle first launch status
   */
  @CapacitorPlugin(name = "FirstLaunch")
  public static class FirstLaunchPlugin extends Plugin {
    
    @PluginMethod
    public void checkFirstLaunch(PluginCall call) {
      SharedPreferences prefs = getContext().getSharedPreferences("GhostTalk_Prefs", Context.MODE_PRIVATE);
      boolean firstLaunch = prefs.getBoolean("firstLaunch", true);
      
      // If it's first launch, mark it as no longer first launch
      if (firstLaunch) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean("firstLaunch", false);
        editor.apply();
      }
      
      JSObject ret = new JSObject();
      ret.put("isFirstLaunch", firstLaunch);
      call.resolve(ret);
    }
  }
}
