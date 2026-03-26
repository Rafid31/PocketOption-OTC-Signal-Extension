// Background Service Worker for PocketOption OTC Signal Extension

console.log('[PO Signal] Background service worker initialized');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[PO Signal] Extension installed successfully');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SIGNAL_DETECTED') {
    console.log('[PO Signal] Signal detected:', request.signal);
    
    // Send notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: `${request.signal.type} Signal!`,
      message: `RSI: ${request.signal.rsi}, Stochastic: ${request.signal.stoch}`,
      priority: 2
    });
    
    sendResponse({ success: true });
  }
  return true;
});
