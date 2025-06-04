const fs = require('fs');
const { RSI, EMA } = require('technicalindicators');

function rsiEma21Strategy(candleData) {
  const closePrices = candleData.map(c => parseFloat(c[4]));

  const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
  const ema21 = EMA.calculate({ values: closePrices, period: 21 });

  const rsiOffset = closePrices.length - rsiValues.length;
  const emaOffset = closePrices.length - ema21.length;

  let trades = [];
  let position = null;

  for (let i = 1; i < rsiValues.length; i++) {
    const candleIdx = i + rsiOffset;

    if (candleIdx >= candleData.length || candleIdx - emaOffset < 0) continue;

    const rsiPrev = rsiValues[i - 1];
    const rsiCurr = rsiValues[i];
    const price = closePrices[candleIdx];
    const emaCurr = ema21[candleIdx - emaOffset];
    const timestamp = candleData[candleIdx][0];

   
  
if (!position && rsiPrev < 40 && rsiCurr > 40 && price > emaCurr) {
  console.log(`BUY at index ${candleIdx}, price: ${price.toFixed(2)}, time: ${new Date(timestamp).toISOString()}`);
  position = {
    entryTime: timestamp,
    entryPrice: price
  };
}


    if (position && ((rsiPrev > 70 && rsiCurr < 70) || price < emaCurr)) {
      console.log(`SELL at index ${candleIdx}, price: ${price.toFixed(2)}, time: ${new Date(timestamp).toISOString()}`);
      trades.push({
        EntryTime: new Date(position.entryTime).toISOString(),
        EntryPrice: position.entryPrice,
        ExitTime: new Date(timestamp).toISOString(),
        ExitPrice: price,
        Strategy: 'RSI_ABOVE30_EMA21',
        PnL: (price - position.entryPrice).toFixed(2),
        Status: price > position.entryPrice ? 'WIN' : 'LOSS'
      });
      position = null;
    }
  }

  
  if (position) {
    const lastCandle = candleData[candleData.length - 1];
    const lastPrice = parseFloat(lastCandle[4]);
    trades.push({
      EntryTime: new Date(position.entryTime).toISOString(),
      EntryPrice: position.entryPrice,
      ExitTime: new Date(lastCandle[0]).toISOString(),
      ExitPrice: lastPrice,
      Strategy: 'RSI_ABOVE30_EMA21',
      PnL: (lastPrice - position.entryPrice).toFixed(2),
      Status: lastPrice > position.entryPrice ? 'WIN' : 'LOSS'
    });
  }

  return trades;
}

// Load candle data from your JSON file
const rawData = JSON.parse(fs.readFileSync('btc_1m_5000.json', 'utf8'));
const trades = rsiEma21Strategy(rawData);


if (trades.length === 0) {
  console.log('No trades executed.');
} else {
  console.table(trades);
}

