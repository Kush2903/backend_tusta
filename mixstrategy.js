const fs = require('fs');
const { EMA, MACD, RSI } = require('technicalindicators');

function macdStrategy(candleData) {
  const closePrices = candleData.map(c => parseFloat(c[4])); // Close price

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

    if (!position && prevFast < prevSlow && currFast > currSlow) {
      position = { entryTime: timestamp, entryPrice: price };
    }

    if (position && prevFast > prevSlow && currFast < currSlow) {
      trades.push({
        EntryTime: new Date(position.entryTime).toISOString(),
        EntryPrice: position.entryPrice,
        ExitTime: new Date(timestamp).toISOString(),
        ExitPrice: price,
        Strategy: 'MACD_EMA',
        PnL: (price - position.entryPrice).toFixed(2),
        Status: price > position.entryPrice ? 'WIN' : 'LOSS'
      });
      position = null;
    }
  }
  return trades;
}

function rsiEmaStrategy(candleData) {
  const closePrices = candleData.map(c => parseFloat(c[4]));

  const rsiPeriod = 14;
  const rsiValues = RSI.calculate({ values: closePrices, period: rsiPeriod });

  const emaFast = EMA.calculate({ period: 5, values: rsiValues });
  const emaSlow = EMA.calculate({ period: 10, values: rsiValues });

  
  const signalStart = rsiValues.length - emaFast.length;

  let trades = [];
  let position = null;

  for (let i = 1; i < emaFast.length; i++) {
    const prevFast = emaFast[i - 1];
    const prevSlow = emaSlow[i - 1];
    const currFast = emaFast[i];
    const currSlow = emaSlow[i];

    
    const candleIdx = i + signalStart + rsiPeriod - 1;

    const candle = candleData[candleIdx];
    const timestamp = candle[0];
    const price = parseFloat(candle[4]);

    if (!position && prevFast < prevSlow && currFast > currSlow) {
      position = { entryTime: timestamp, entryPrice: price };
    }

    if (position && prevFast > prevSlow && currFast < currSlow) {
      trades.push({
        EntryTime: new Date(position.entryTime).toISOString(),
        EntryPrice: position.entryPrice,
        ExitTime: new Date(timestamp).toISOString(),
        ExitPrice: price,
        Strategy: 'RSI_EMA',
        PnL: (price - position.entryPrice).toFixed(2),
        Status: price > position.entryPrice ? 'WIN' : 'LOSS'
      });
      position = null;
    }
  }
  return trades;
}


const rawData = JSON.parse(fs.readFileSync('btc_1m_5000.json', 'utf8'));


const macdTrades = macdStrategy(rawData);
const rsiTrades = rsiEmaStrategy(rawData);


const combinedTrades = macdTrades.concat(rsiTrades)
  .sort((a, b) => new Date(a.EntryTime) - new Date(b.EntryTime));

console.table(combinedTrades);
