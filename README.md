# PocketOption OTC Signal Extension

Chrome Extension for Pocket Option OTC trading using **RSI + Stochastic** indicators for 1-minute signals.

## Features
- RSI (14) + Stochastic (5,3,3) dual confirmation strategy
- Monitors 30-second candles for 1-minute trades
- Shows BUY/SELL signals in the last 5-10 seconds of each candle
- Real-time control panel with RSI and Stochastic values
- Browser notifications for trading signals
- Enable/disable signal alerts
- Clean overlay UI on Pocket Option platform

## Installation Guide

### Step 1: Download the Extension
1. Click the green "Code" button above
2. Select "Download ZIP"
3. Extract the ZIP file to a folder on your computer

### Step 2: Install in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the extracted folder containing manifest.json
5. The extension will now be installed

### Step 3: Enable and Use
1. Go to https://pocketoption.com
2. The extension will automatically inject
3. You'll see a control panel on the left side
4. Set your chart to **30-second candles** (S30)
5. Set trade expiry to **1 minute** (M1)
6. Watch for BUY/SELL signal alerts

## How It Works

**Signal Logic:**
- **BUY Signal:** RSI < 30 AND Stochastic < 20 (both oversold)
- **SELL Signal:** RSI > 70 AND Stochastic > 80 (both overbought)

**Timing:**
- Extension monitors price data every second
- Forms 30-second candles from price ticks
- Checks for signals at the 20-25 second mark (last 5-10s of candle)
- Displays alert overlay with signal type, RSI, and Stochastic values

## Control Panel

The left-side control panel shows:
- Extension status (Active/Inactive)
- Number of candles collected
- Current RSI value
- Current Stochastic value
- Enable/Disable button

##Files Included
- `manifest.json` - Extension configuration
- `content.js` - Main signal detection logic
- `styles.css` - UI styling
- `popup.html` - Extension popup
- `popup.js` - Popup functionality
- `background.js` - Background service worker
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons

## Important Notes

⚠️ **Risk Warning:**
- This extension is for educational purposes
- OTC markets on Pocket Option may be manipulated
- No strategy guarantees profits
- Always use proper risk management (1-3% per trade)
- Test on demo account first

## Troubleshooting

**Extension not showing?**
- Refresh the Pocket Option page
- Check Chrome extensions page to ensure it's enabled
- Open Developer Console (F12) and look for "[PO Signal]" messages

**No signals appearing?**
- Wait for at least 15 candles to form (7.5 minutes)
- Ensure both RSI and Stochastic reach extreme zones
- Check control panel to see current indicator values

**Candle count not increasing?**
- The extension monitors price changes
- If price is static, candles won't form properly
- Try switching to a more volatile asset

## Credits

Developed for OTC 1-minute trading on Pocket Option platform.

Strategy based on RSI + Stochastic confirmation methods researched from top trading sources.

## License

MIT License - Free to use and modify
