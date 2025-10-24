       // API configuration
        const API_BASE_URL = 'https://api.coingecko.com/api/v3';
        const CRYPTO_IDS = ['bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano', 'solana', 'polkadot'];
        const CURRENCY = 'usd';
      
        // DOM elements
        const amountInput = document.getElementById('amount');
        const cryptoSelect = document.getElementById('crypto');
        const resultElement = document.getElementById('result');
        const exchangeRateElement = document.getElementById('exchange-rate');
        const lastUpdatedElement = document.getElementById('last-updated');
        const marketDataElement = document.getElementById('market-data');
        const historyBodyElement = document.getElementById('history-body');

        // State
        let exchangeRates = {};
        let conversionHistory = [];
        
        // Initialize the application
        async function init() {
            await fetchExchangeRates();
            await fetchMarketData();
            updateConversion();
            
            // Set up event listeners
            amountInput.addEventListener('input', updateConversion);
            cryptoSelect.addEventListener('change', updateConversion);
            
            // Set up periodic updates
            setInterval(fetchExchangeRates, 60000); // Update every minute
            setInterval(fetchMarketData, 120000); // Update market data every 2 minutes
        }
        
        // Fetch exchange rates from CoinGecko API
        async function fetchExchangeRates() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/simple/price?ids=${CRYPTO_IDS.join(',')}&vs_currencies=${CURRENCY}&include_last_updated_at=true`
                );
                
                if (!response.ok) {
                    throw new Error('Failed to fetch exchange rates');
                }
                
                const data = await response.json();
                
                // Process the data
                for (const [cryptoId, cryptoData] of Object.entries(data)) {
                    exchangeRates[cryptoId] = {
                        price: cryptoData[CURRENCY],
                        lastUpdated: cryptoData.last_updated_at
                    };
                }
                
                // Update the UI
                updateConversion();
                updateLastUpdatedTime();
                
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
                resultElement.innerHTML = '<span style="color: #f87171;">Error fetching data. Please try again later.</span>';
            }
        }
        
        // Fetch market data for top cryptocurrencies
        async function fetchMarketData() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/coins/markets?vs_currency=${CURRENCY}&ids=${CRYPTO_IDS.join(',')}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
                );
                
                if (!response.ok) {
                    throw new Error('Failed to fetch market data');
                }
                
                const data = await response.json();
                renderMarketData(data);
                
            } catch (error) {
                console.error('Error fetching market data:', error);
                marketDataElement.innerHTML = '<p style="color: #f87171; text-align: center;">Error loading market data</p>';
            }
        }
        
        // Render market data to the UI
        function renderMarketData(data) {
            marketDataElement.innerHTML = data.map(crypto => {
                const changeClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
                const changeIcon = crypto.price_change_percentage_24h >= 0 ? '▲' : '▼';
                
                return `
                    <div class="crypto-card">
                        <div class="crypto-icon" style="background: rgba(247, 147, 26, 0.2); color: #f7931a;">
                            <img src="${crypto.image}" alt="${crypto.name}" width="30" height="30">
                        </div>
                        <div class="crypto-info">
                            <div class="crypto-name">${crypto.name}</div>
                            <div class="crypto-price">$${formatNumber(crypto.current_price)}</div>
                        </div>
                        <div class="crypto-change ${changeClass}">
                            ${changeIcon} ${Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Update conversion result
        function updateConversion() {
            const amount = parseFloat(amountInput.value);
            const cryptoId = cryptoSelect.value;
            
            if (isNaN(amount) || amount <= 0) {
                resultElement.textContent = 'Please enter a valid amount';
                return;
            }
            
            if (!exchangeRates[cryptoId]) {
                resultElement.innerHTML = '<span class="loader"></span> Loading...';
                return;
            }
            
            const rate = exchangeRates[cryptoId].price;
            const result = amount / rate;
            
            // Format the result based on the cryptocurrency
            let formattedResult;
            if (cryptoId === 'bitcoin') {
                formattedResult = result.toFixed(6) + ' BTC';
            } else if (cryptoId === 'ethereum') {
                formattedResult = result.toFixed(4) + ' ETH';
            } else if (cryptoId === 'ripple' || cryptoId === 'cardano') {
                formattedResult = result.toFixed(2) + ' ' + cryptoId.toUpperCase();
            } else {
                formattedResult = result.toFixed(3) + ' ' + cryptoId.toUpperCase();
            }
            
            resultElement.textContent = formattedResult;
            
            // Update the exchange rate display
            exchangeRateElement.textContent = 
                `Exchange Rate: 1 ${cryptoSelect.options[cryptoSelect.selectedIndex].text} = $${formatNumber(rate)}`;
                
            // Add to history
            addToHistory(amount, cryptoId, formattedResult);
        }
        
        // Update last updated time
        function updateLastUpdatedTime() {
            const cryptoId = cryptoSelect.value;
            if (exchangeRates[cryptoId]) {
                const timestamp = exchangeRates[cryptoId].lastUpdated;
                const date = new Date(timestamp * 1000);
                lastUpdatedElement.textContent = `Last updated: ${date.toLocaleTimeString()}`;
            }
        }
   
        // Add conversion to history
        function addToHistory(amount, cryptoId, result) {
            // Get the cryptocurrency name
            const cryptoName = cryptoSelect.options[cryptoSelect.selectedIndex].text;
            
            // Add to history array
            conversionHistory.unshift({
                from: 'USDT',
                to: cryptoName,
                amount: amount,
                result: result,
                time: new Date().toLocaleTimeString()
            });
            
            // Keep only the last 5 conversions
            if (conversionHistory.length > 5) {
                conversionHistory.pop();
            }
            
            // Update history table
            renderConversionHistory();
        }
        
        // Render conversion history
        function renderConversionHistory() {
            historyBodyElement.innerHTML = conversionHistory.map(conversion => `
                <tr>
                    <td>${conversion.amount} ${conversion.from}</td>
                    <td>${conversion.to}</td>
                    <td>${conversion.result}</td>
                    <td>$${formatNumber(conversion.amount)}</td>
                    <td>${conversion.time}</td>
                </tr>
            `).join('');
        }
        
        // Helper function to format numbers with commas
        function formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        
        // Initialize the application
        init();
