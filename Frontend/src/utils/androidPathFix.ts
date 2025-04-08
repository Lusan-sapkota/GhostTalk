import { Capacitor } from '@capacitor/core';
import { isPlatform } from '@ionic/react';

export const fixAndroidPaths = () => {
  // Only run on Android native platform
  if (!(isPlatform('android') && Capacitor.isNativePlatform())) {
    return;
  }
  
  console.log('Applying Android path fixes');
  
  // Fix CSS paths
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('/')) {
      const newHref = `file:///android_asset/public${href}`;
      console.log(`Fixing CSS path: ${href} -> ${newHref}`);
      link.setAttribute('href', newHref);
    }
  });
  
  // Set base href
  const base = document.querySelector('base') || document.createElement('base');
  base.href = 'file:///android_asset/public/';
  if (!base.parentNode) {
    document.head.insertBefore(base, document.head.firstChild);
  }
  
  // Fix navigation for android
  if (window.history && !window.history._replace) {
    const originalReplace = window.history.replaceState;
    window.history.replaceState = function(state, title, url) {
      try {
        if (url && url.startsWith('file:///')) {
          url = url.substring(url.lastIndexOf('/')+1);
          console.log('Fixed URL for history: ' + url);
        }
        return originalReplace.call(this, state, title, url);
      } catch(e) {
        console.error('History API error:', e);
      }
    };
  }
  
  // Fix any URLs in the page
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      link.setAttribute('href', href.replace(/^\//, ''));
    }
  });
  
  // Check for onboarding flag
  if (localStorage.getItem('forceOnboarding') === 'true') {
    console.log('First time user detected, showing onboarding');
  }
};