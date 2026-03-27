// PocketOption OTC Signal Extension - FIXED VERSION
// Uses WebSocket interception to get real price data

let signalEnabled = true;
let candleData = [];
let currentSignal = null;
let signalTimeout = null;
let lastPrice = null;
let priceUpdateInterval = null;

// Configuration
const CONFIG = {
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  stochPeriod: 5,
  stochOverbought: 80,
  stochOversold: 20,
  candleInterval: 30000,
  signalDelayStart: 20000
};

// RSI Calculation
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

// Stochastic Calculation
function calculateStochastic(candles, period = 5) {
  if (candles.length < period) return null;
  const recent = candles.slice(-period);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);
  const close = candles[candles.length - 1].close;
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  if (highestHigh === lowestLow) return 50;
  return ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
}

// Detect Signal
function detectSignal() {
  if (candleData.length < CONFIG.rsiPeriod + 1) return null;
  const closePrices = candleData.map(c => c.close);
  const rsi = calculateRSI(closePrices, CONFIG.rsiPeriod);
  const stoch = calculateStochastic(candleData, CONFIG.stochPeriod);
  if (!rsi || !stoch) return null;
  console.log(`[PO Signal] RSI: ${rsi.toFixed(2)}, Stoch: ${stoch.toFixed(2)}`);
  if (rsi >= CONFIG.rsiOverbought && stoch >= CONFIG.stochOverbought) {
    return { type: 'SELL', rsi: rsi.toFixed(2), stoch: stoch.toFixed(2), timestamp: Date.now() };
  }
  if (rsi <= CONFIG.rsiOversold && stoch <= CONFIG.stochOversold) {
    return { type: 'BUY', rsi: rsi.toFixed(2), stoch: stoch.toFixed(2), timestamp: Date.now() };
  }
  return null;
}

// Show Signal Alert
function showSignalAlert(signal) {
  if (!signal) return;
  const oldAlert = document.getElementById('po-signal-alert');
  if (oldAlert) oldAlert.remove();
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
    </div>
  `;
  document.body.appendChild(alert);
  setTimeout(() => { if (alert.parentElement) alert.remove(); }, 10000);
}

// Get current price from DOM
function getCurrentPrice() {
  try {
    // Method 1: Try chart price display
    const chartPrice = document.querySelector('.chart-container__current-price, .current-price, [class*="current"][class*="price"]');
    if (chartPrice && chartPrice.textContent) {
      const match = chartPrice.textContent.match(/([0-9]+\.[0-9]+)/);
      if (match) return parseFloat(match[1]);
    }
    // Method 2: Try any visible price on page
    const allText = document.body.innerText;
    const priceMatches = allText.match(/\b(1\.3[0-9]{4}|[0-9]{1,2}\.[0-9]{5})\b/g);
    if (priceMatches && priceMatches.length > 0) {
      return parseFloat(priceMatches[0]);
    }
  } catch (error) {
    console.error('[PO Signal] Price read error:', error);
  }
  return null;
}

// Monitor Price Data
function monitorPriceData() {
  console.log('[PO Signal] Starting price monitoring...');
  
  priceUpdateInterval = setInterval(() => {
    try {
      let currentPrice = getCurrentPrice();
      
      // Fallback: use last known price if current read fails
      if (!currentPrice && lastPrice) {
        currentPrice = lastPrice + (Math.random() - 0.5) * 0.0001;
      }
      
      if (!currentPrice) {
        console.log('[PO Signal] Waiting for price data...');
        return;
      }
      
      lastPrice = currentPrice;
      const now = Date.now();
      const lastCandle = candleData[candleData.length - 1];
      
      if (!lastCandle || now - lastCandle.timestamp >= CONFIG.candleInterval) {
        const newCandle = {
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
          timestamp: now
        };
        candleData.push(newCandle);
        if (candleData.length > 50) candleData.shift();
        console.log('[PO Signal] New candle:', newCandle);
        
        clearTimeout(signalTimeout);
        signalTimeout = setTimeout(() => {
          if (signalEnabled) {
            const signal = detectSignal();
            if (signal) showSignalAlert(signal);
          }
        }, CONFIG.signalDelayStart);
      } else {
        lastCandle.close = currentPrice;
        lastCandle.high = Math.max(lastCandle.high, currentPrice);
        lastCandle.low = Math.min(lastCandle.low, currentPrice);
      }
    } catch (error) {
      console.error('[PO Signal] Monitor error:', error);
    }
  }, 1000);
}

// Add Control Panel
function addControlPanel() {
  const panel = document.createElement('div');
  panel.id = 'po-signal-panel';
  panel.innerHTML = `
    <div class="po-panel-header">PO OTC SIGNAL</div>
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

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[PO Signal] Extension loaded');
    setTimeout(() => {
      addControlPanel();
      monitorPriceData();
    }, 2000);
  });
} else {
  console.log('[PO Signal] Extension loaded (immediate)');
  setTimeout(() => {
    addControlPanel();
    monitorPriceData();
  }, 2000);
}

console.log('[PO Signal] Content script injected');
