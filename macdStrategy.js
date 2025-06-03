const fs = require('fs');
const { EMA, MACD } = require('technicalindicators');

function macdStrategy(candleData) {
  const closePrices = candleData.map(c => parseFloat(c[4])); // Close price is index 4

  
  const macdInput = {
    values: closePrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  };

  const macdResult = MACD.calculate(macdInput);
  const macdLine = macdResult.map(m => m.MACD);

  
  const emaFast = EMA.calculate({ period: 5, values: macdLine });
  const emaSlow = EMA.calculate({ period: 10, values: macdLine });

  
  const signalStart = macdLine.length - emaFast.length;

  let trades = [];
  let position = null;

  for (let i = 1; i < emaFast.length; i++) {
    const prevFast = emaFast[i - 1];
    const prevSlow = emaSlow[i - 1];
    const currFast = emaFast[i];
    const currSlow = emaSlow[i];

    const candleIdx = i + signalStart;
    const candle = candleData[candleIdx];
    const timestamp = candle[0];
    const price = parseFloat(candle[4]);

    // this is the entry: Fast EMA crosses above Slow EMA
    if (!position && prevFast < prevSlow && currFast > currSlow) {
      position = { entryTime: timestamp, entryPrice: price };
    }

    // thisis the Exit: Fast EMA crosses below Slow EMA
    if (position && prevFast > prevSlow && currFast < currSlow) {
      const trade = {
        EntryTime: new Date(position.entryTime).toISOString(),
        EntryPrice: position.entryPrice,
        ExitTime: new Date(timestamp).toISOString(),
        ExitPrice: price,
        Strategy: 'MACD_EMA_Crossover',
        PnL: (price - position.entryPrice).toFixed(2),
        Status: price > position.entryPrice ? 'WIN' : 'LOSS'
      };
      trades.push(trade);
      position = null;
    }
  }

  return trades;
}

// here i have Load candle data from file and run strategy
const rawData = JSON.parse(fs.readFileSync('btc_1m_5000.json', 'utf8'));
const trades = macdStrategy(rawData);
console.table(trades);