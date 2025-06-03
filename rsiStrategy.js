const fs = require('fs');
const { RSI, EMA } = require('technicalindicators');

function rsiEmaStrategy(candleData) {
  const closePrices = candleData.map(c => parseFloat(c[4]));

  const rsiValues = RSI.calculate({ values: closePrices, period: 14 });


  const emaFast = EMA.calculate({ values: rsiValues, period: 5 });
  const emaSlow = EMA.calculate({ values: rsiValues, period: 10 });


  const signalStart = rsiValues.length - emaFast.length;

  let trades = [];
  let position = null;

  for (let i = 1; i < emaFast.length; i++) {
    const prevFast = emaFast[i - 1];
    const prevSlow = emaSlow[i - 1];
    const currFast = emaFast[i];
    const currSlow = emaSlow[i];

    // The index in the candle data, adjusted for RSI & EMA offset
    const candleIdx = i + signalStart + 14 - 1; 

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
const trades = rsiEmaStrategy(rawData);
console.table(trades);
