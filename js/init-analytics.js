/**
 * Initialize Vercel Web Analytics
 * This script loads and initializes the Vercel Analytics package
 */
(function() {
  'use strict';
  
  // Inject Vercel Web Analytics
  // The analytics script is automatically served by Vercel at /_vercel/insights/script.js
  // This initialization ensures proper setup
  
  function initAnalytics() {
    // Initialize the queue for analytics events
    if (!window.va) {
      window.va = function() {
        (window.vaq = window.vaq || []).push(arguments);
      };
    }

    // Detect environment - use development mode for localhost
    var isDev = false;
    try {
      isDev = window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1' ||
              window.location.hostname.includes('192.168');
    } catch (e) {
      // If we can't detect, assume production
    }

    window.vam = isDev ? 'development' : 'production';

    // Log initialization in development
    if (isDev && console && console.log) {
      console.log('[Vercel Analytics] Initialized in development mode');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
  } else {
    initAnalytics();
  }
})();
