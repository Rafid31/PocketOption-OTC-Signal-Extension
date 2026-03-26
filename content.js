// PocketOption OTC Signal Extension - Main Content Script
// RSI + Stochastic Strategy for 1-minute trades with 30s candles

let signalEnabled = true;
let candleData = [];
let currentSignal = null;
let signalTimeout = null;

// Configuration
const CONFIG = {
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  stochPeriod: 5,
  stochOverbought: 80,
  stochOversold: 20,
  candleInterval: 30000, // 30 seconds
  signalDelayStart: 20000, // Show signal after 20s (last 10s of candle)
  signalDelayEnd: 25000   // Show signal after 25s (last 5s of candle)
};

// RSI Calculation
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Stochastic Calculation
function calculateStochastic(candles, period = 5) {
  if (candles.length < period) return null;
  
  const recentCandles = candles.slice(-period);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  const currentClose = candles[candles.length - 1].close;
  
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  
  if (highestHigh === lowestLow) return 50;
  return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
}

// Detect Trading Signal
function detectSignal() {
  if (candleData.length < CONFIG.rsiPeriod + 1) {
    console.log('[PO Signal] Not enough candle data yet');
    return null;
  }
  
  const closePrices = candleData.map(c => c.close);
  const rsi = calculateRSI(closePrices, CONFIG.rsiPeriod);
  const stoch = calculateStochastic(candleData, CONFIG.stochPeriod);
  
  if (!rsi || !stoch) return null;
  
  console.log(`[PO Signal] RSI: ${rsi.toFixed(2)}, Stochastic: ${stoch.toFixed(2)}`);
  
  // SELL Signal: Both indicators in overbought zone
  if (rsi >= CONFIG.rsiOverbought && stoch >= CONFIG.stochOverbought) {
    return {
      type: 'SELL',
      rsi: rsi.toFixed(2),
      stoch: stoch.toFixed(2),
      timestamp: Date.now()
    };
  }
  
  // BUY Signal: Both indicators in oversold zone
  if (rsi <= CONFIG.rsiOversold && stoch <= CONFIG.stochOversold) {
    return {
      type: 'BUY',
      rsi: rsi.toFixed(2),
      stoch: stoch.toFixed(2),
      timestamp: Date.now()
    };
  }
  
  return null;
}

// Show Signal Alert
function showSignalAlert(signal) {
  if (!signal) return;
  
  // Remove old signal if exists
  const oldAlert = document.getElementById('po-signal-alert');
  if (oldAlert) oldAlert.remove();
  
  // Create alert overlay
  const alert = document.createElement('div');
  alert.id = 'po-signal-alert';
  alert.className = `po-signal-${signal.type.toLowerCase()}`;
  alert.innerHTML = `
    <div class="po-signal-content">
      <div class="po-signal-icon">${signal.type === 'BUY' ? '📈' : '📉'}</div>
      <div class="po-signal-type">${signal.type}</div>
      <div class="po-signal-expiry">1 MINUTE</div>
      <div class="po-signal-indicators">
        <div>RSI: ${signal.rsi}</div>
        <div>Stoch: ${signal.stoch}</div>
      </div>
      <div class="po-signal-timer" id="po-signal-timer">5-10s</div>
    </div>
  `;
  
  document.body.appendChild(alert);
  currentSignal = signal;
  
  // Browser notification
  if (Notification.permission === 'granted') {
    new Notification(`${signal.type} Signal!`, {
      body: `RSI: ${signal.rsi}, Stochastic: ${signal.stoch}`,
      icon: '/icon48.png',
      tag: 'po-signal'
    });
  }
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (alert.parentElement) {
      alert.remove();
    }
  }, 10000);
}

// Monitor Price Data from PocketOption
function monitorPriceData() {
  setInterval(() => {
    try {
      // Try to find the current price from the chart
      const priceElements = document.querySelectorAll('[class*="price"], [class*="Price"]');
      let currentPrice = null;
      
      for (const elem of priceElements) {
        const text = elem.textContent.trim();
        const match = text.match(/([0-9]+\.[0-9]+)/);
        if (match && match[1]) {
          currentPrice = parseFloat(match[1]);
          break;
        }
      }
      
      if (!currentPrice) {
        // Fallback: try to intercept WebSocket data
        return;
      }
      
      // Check if 30 seconds passed (new candle)
      const now = Date.now();
      const lastCandle = candleData[candleData.length - 1];
      
      if (!lastCandle || now - lastCandle.timestamp >= CONFIG.candleInterval) {
        // New candle
        const newCandle = {
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
          timestamp: now
        };
        candleData.push(newCandle);
        
        // Keep only last 50 candles
        if (candleData.length > 50) {
          candleData.shift();
        }
        
        console.log('[PO Signal] New candle added', newCandle);
        
        // Schedule signal check at 20-25s mark
        clearTimeout(signalTimeout);
        signalTimeout = setTimeout(() => {
          if (signalEnabled) {
            const signal = detectSignal();
            if (signal) {
              showSignalAlert(signal);
            }
          }
        }, CONFIG.signalDelayStart);
      } else {
        // Update current candle
        lastCandle.close = currentPrice;
        lastCandle.high = Math.max(lastCandle.high, currentPrice);
        lastCandle.low = Math.min(lastCandle.low, currentPrice);
      }
    } catch (error) {
      console.error('[PO Signal] Error monitoring price:', error);
    }
  }, 1000); // Check every second
}

// Add control panel
function addControlPanel() {
  const panel = document.createElement('div');
  panel.id = 'po-signal-panel';
  panel.innerHTML = `
    <div class="po-panel-header">PO OTC Signal</div>
    <div class="po-panel-status">
      <span id="po-status-indicator" class="po-status-active">●</span>
      <span id="po-status-text">Active</span>
    </div>
    <div class="po-panel-stats">
      <div>Candles: <span id="po-candle-count">0</span></div>
      <div>RSI: <span id="po-rsi-value">--</span></div>
      <div>Stoch: <span id="po-stoch-value">--</span></div>
    </div>
    <button id="po-toggle-btn">Disable Signals</button>
  `;
  
  document.body.appendChild(panel);
  
  // Toggle button
  document.getElementById('po-toggle-btn').addEventListener('click', () => {
    signalEnabled = !signalEnabled;
    const btn = document.getElementById('po-toggle-btn');
    const indicator = document.getElementById('po-status-indicator');
    const statusText = document.getElementById('po-status-text');
    
    if (signalEnabled) {
      btn.textContent = 'Disable Signals';
      indicator.className = 'po-status-active';
      statusText.textContent = 'Active';
    } else {
      btn.textContent = 'Enable Signals';
      indicator.className = 'po-status-inactive';
      statusText.textContent = 'Inactive';
    }
  });
  
  // Update stats every second
  setInterval(() => {
    document.getElementById('po-candle-count').textContent = candleData.length;
    
    if (candleData.length >= CONFIG.rsiPeriod + 1) {
      const closePrices = candleData.map(c => c.close);
      const rsi = calculateRSI(closePrices, CONFIG.rsiPeriod);
      const stoch = calculateStochastic(candleData, CONFIG.stochPeriod);
      
      if (rsi) document.getElementById('po-rsi-value').textContent = rsi.toFixed(2);
      if (stoch) document.getElementById('po-stoch-value').textContent = stoch.toFixed(2);
    }
  }, 1000);
}

// Request notification permission
if (Notification.permission === 'default') {
  Notification.requestPermission();
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[PO Signal] Extension loaded');
    addControlPanel();
    monitorPriceData();
  });
} else {
  console.log('[PO Signal] Extension loaded');
  addControlPanel();
  monitorPriceData();
}

console.log('[PO Signal] Content script injected successfully');
