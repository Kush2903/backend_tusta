const axios = require('axios');
const fs = require('fs');

async function fetch5000CandlesBackward() {
  const url = 'https://api.binance.com/api/v3/klines';
  const batchSize = 1000;
  const totalBatches = 5;

  let candles = [];
  let endTime = Date.now();

  for (let i = 0; i < totalBatches; i++) {
    const params = {
      symbol: 'BTCUSDT',
      interval: '1m',
      limit: batchSize,
      endTime: endTime
    };

    try {
      const response = await axios.get(url, { params });
      const batch = response.data;

      if (batch.length === 0) {
        console.log('No more candles returned, stopping early');
        break;
      }

  
      candles = batch.concat(candles); 

    
      endTime = batch[0][0] - 1;

      console.log(`Batch ${i + 1} fetched, total candles so far: ${candles.length}`);
    } catch (error) {
      console.error('Error fetching candles:', error.message);
      break;
    }
  }

  fs.writeFileSync('btc_1m_5000.json', JSON.stringify(candles, null, 2));
  console.log(`Total candles fetched and saved: ${candles.length}`);
}

fetch5000CandlesBackward();
