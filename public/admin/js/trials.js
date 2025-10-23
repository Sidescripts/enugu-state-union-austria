
// // === CoinGecko API ===
// const API_BASE_URL = 'https://api.coingecko.com/api/v3';
// const CRYPTO_IDS = {
//   btc: 'bitcoin',
//   eth: 'ethereum',
//   usdt: 'tether'
// };
// const CURRENCY = 'usd';

// // Store live prices
// let exchangeRates = {};

// // Fetch live prices
// async function fetchExchangeRates() {
//   try {
//     const response = await fetch(
//       `${API_BASE_URL}/simple/price?ids=${Object.values(CRYPTO_IDS).join(',')}&vs_currencies=${CURRENCY}`
//     );

//     if (!response.ok) throw new Error('Failed to fetch exchange rates');

//     const data = await response.json();

//     exchangeRates = {
//       btc: data[CRYPTO_IDS.btc].usd,
//       eth: data[CRYPTO_IDS.eth].usd,
//       usdt: data[CRYPTO_IDS.usdt].usd
//     };

//     updateBalances();
//   } catch (error) {
//     console.error('Error fetching exchange rates:', error);
//   }
// }

// // Update balances dynamically
// function updateBalances() {
//   // === BTC ===
//   const btcUsdText = document.querySelector('.btcEqu')?.textContent || '$0';
//   const btcUsd = parseFloat(btcUsdText.replace(/[^0-9.]/g, '')) || 0;
//   document.querySelector('.btcBal').textContent =
//     (btcUsd / exchangeRates.btc).toFixed(6) + ' BTC';

//   // === ETH ===
//   const ethUsdText = document.querySelector('.ethEqu')?.textContent || '$0';
//   const ethUsd = parseFloat(ethUsdText.replace(/[^0-9.]/g, '')) || 0;
//   document.querySelector('.ethBal').textContent =
//     (ethUsd / exchangeRates.eth).toFixed(6) + ' ETH';

//   // === USDT ===
//   const usdtUsdText = document.querySelector('.usdtEqu')?.textContent || '$0';
//   const usdtUsd = parseFloat(usdtUsdText.replace(/[^0-9.]/g, '')) || 0;
//   document.querySelector('.usdtBal').textContent =
//     (usdtUsd / exchangeRates.usdt).toFixed(2) + ' USDT';
// }

// // Init
// document.addEventListener('DOMContentLoaded', () => {
//   fetchExchangeRates();
//   setInterval(fetchExchangeRates, 60000); // refresh every 1 min
// });

// === CoinGecko API ===
(function () {
  const API_BASE_URL = 'https://api.coingecko.com/api/v3';
  const CRYPTO_IDS = {
    btc: 'bitcoin',
    eth: 'ethereum',
    usdt: 'tether',
    bnb: 'binancecoin',
    ltc: 'litecoin',
    bch: 'bitcoin-cash',
    dash: 'dash',
    doge: 'dogecoin'
  };
  const CURRENCY = 'usd';

  // Store live prices in a local scope to avoid conflicts
  let exchangeRates = {};

  // Fetch live prices
  async function fetchExchangeRates() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/simple/price?ids=${Object.values(CRYPTO_IDS).join(',')}&vs_currencies=${CURRENCY}`
      );

      if (!response.ok) throw new Error('Failed to fetch exchange rates');

      const data = await response.json();

      exchangeRates = {
        btc: data[CRYPTO_IDS.btc]?.usd || 0,
        eth: data[CRYPTO_IDS.eth]?.usd || 0,
        usdt: data[CRYPTO_IDS.usdt]?.usd || 0,
        bnb: data[CRYPTO_IDS.bnb]?.usd || 0,
        ltc: data[CRYPTO_IDS.ltc]?.usd || 0,
        bch: data[CRYPTO_IDS.bch]?.usd || 0,
        dash: data[CRYPTO_IDS.dash]?.usd || 0,
        doge: data[CRYPTO_IDS.doge]?.usd || 0
      };

      updateBalances();
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  }

  // Update balances dynamically
  function updateBalances() {
    // Helper function to safely parse USD text
    const parseUsd = (text) => {
      return parseFloat(text?.replace(/[^0-9.]/g, '')) || 0;
    };

    // BTC
    const btcUsdText = document.querySelector('.btcEqu')?.textContent || '$0';
    const btcUsd = parseUsd(btcUsdText);
    document.querySelector('.btcBal').textContent = exchangeRates.btc ? (btcUsd / exchangeRates.btc).toFixed(6) + ' BTC' : '0.000000 BTC';

    // ETH
    const ethUsdText = document.querySelector('.ethEqu')?.textContent || '$0';
    const ethUsd = parseUsd(ethUsdText);
    document.querySelector('.ethBal').textContent = exchangeRates.eth ? (ethUsd / exchangeRates.eth).toFixed(6) + ' ETH' : '0.000000 ETH';

    // USDT
    const usdtUsdText = document.querySelector('.usdtEqu')?.textContent || '$0';
    const usdtUsd = parseUsd(usdtUsdText);
    document.querySelector('.usdtBal').textContent = exchangeRates.usdt ? (usdtUsd / exchangeRates.usdt).toFixed(2) + ' USDT' : '0.00 USDT';

    // BNB
    const bnbUsdText = document.querySelector('#bnbBalance')?.textContent || '$0';
    const bnbUsd = parseUsd(bnbUsdText);
    document.querySelector('#bnbBalanceQty').textContent = exchangeRates.bnb ? (bnbUsd / exchangeRates.bnb).toFixed(6) + ' BNB' : '0.000000 BNB';

    // LTC
    const ltcUsdText = document.querySelector('#ltcBalance')?.textContent || '$0';
    const ltcUsd = parseUsd(ltcUsdText);
    document.querySelector('#ltcBalanceQty').textContent = exchangeRates.ltc ? (ltcUsd / exchangeRates.ltc).toFixed(6) + ' LTC' : '0.000000 LTC';

    // BCH
    const bchUsdText = document.querySelector('#bchBalance')?.textContent || '$0';
    const bchUsd = parseUsd(bchUsdText);
    document.querySelector('#bchBalanceQty').textContent = exchangeRates.bch ? (bchUsd / exchangeRates.bch).toFixed(6) + ' BCH' : '0.000000 BCH';

    // DASH
    const dashUsdText = document.querySelector('#dashBalance')?.textContent || '$0';
    const dashUsd = parseUsd(dashUsdText);
    document.querySelector('#dashBalanceQty').textContent = exchangeRates.dash ? (dashUsd / exchangeRates.dash).toFixed(6) + ' DASH' : '0.000000 DASH';

    // DOGE
    const dogeUsdText = document.querySelector('#dogeBalance')?.textContent || '$0';
    const dogeUsd = parseUsd(dogeUsdText);
    document.querySelector('#dogeBalanceQty').textContent = exchangeRates.doge ? (dogeUsd / exchangeRates.doge).toFixed(2) + ' DOGE' : '0.00 DOGE';
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    fetchExchangeRates();
    setInterval(fetchExchangeRates, 60000); // Refresh every 1 minute
  });

  // Expose updateBalances globally for other scripts to call
  window.updateBalances = updateBalances;
})();