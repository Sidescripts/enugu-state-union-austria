    // Configuration
    const API_BASE_URL = '/api/v1'; // Updated to match frontend port
    const ITEMS_PER_PAGE = 10;

    // Helper to format date
    function formatDate(dateString) {
      console.log(`Formatting date: ${dateString}`);
      const date = new Date(dateString);
      const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      console.log(`Formatted date: ${formatted}`);
      return formatted;
    }

    // Helper to get transaction type class
    function getTransactionClass(type) {
      console.log(`Getting class for transaction type: ${type}`);
      if (type === 'deposit') return 'transaction-deposit';
      if (type === 'withdrawal') return 'transaction-withdrawal';
      if (type === 'investment') return 'transaction-investment';
      console.log(`No class found for type: ${type}`);
      return '';
    }

    // Helper to get amount class and prefix
    function getAmountClassAndPrefix(type, amount) {
      console.log(`Getting amount class for type: ${type}, amount: ${amount}`);
      if (type === 'deposit' || type === 'investment') {
        return { class: 'amount-positive', prefix: '+ ' };
      } else if (type === 'withdrawal') {
        return { class: 'amount-negative', prefix: '- ' };
      }
      console.log(`No amount class for type: ${type}`);
      return { class: '', prefix: '' };
    }

    // Helper to get status class
    function getStatusClass(status) {
      console.log(`Getting status class for: ${status}`);
      if (status === 'completed') return 'status-completed';
      if (status === 'pending') return 'status-pending';
      if (status === 'cancelled') return 'status-cancelled';
      console.log(`No status class for: ${status}`);
      return '';
    }

    // Show error message in UI
    function showError(message) {
      const errorDiv = document.getElementById('errorMessage');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      console.error(`UI Error: ${message}`);
    }

    // Hide error message
    function hideError() {
      const errorDiv = document.getElementById('errorMessage');
      errorDiv.style.display = 'none';
      console.log('Cleared UI error message');
    }

    // Fetch all transactions

async function fetchTransactions() {
    console.log('Fetching transactions...');
    const token = localStorage.getItem('token');
    try {
      const [depositsRes, withdrawalsRes, investmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/deposit/deposit-history`, {
            method: 'Get', 
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            }
        }).catch(err => {
          console.error(`Deposit API failed: ${err.message}`);
          throw new Error('Deposit API failed');
        }),
        fetch(`${API_BASE_URL}/withdrawal/withdrawal-history`, {
            method: 'Get', 
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            }
        }).catch(err => {
          console.error(`Withdrawal API failed: ${err.message}`);
          throw new Error('Withdrawal API failed');
        }),
        fetch(`${API_BASE_URL}/invest/invest-history`, {
            method: 'Get', 
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            }
        }).catch(err => {
          console.error(`Investment API failed: ${err.message}`);
          throw new Error('Investment API failed');
        })
        
      ]);

       if (depositsRes.status == 401 && withdrawalsRes == 401 && investmentsRes == 401)  {
        setTimeout(() => {
          window.location.href ="../pages/login.html"
        }, 1500);
       }

      if (!depositsRes.ok) {
        console.error(`Deposit API returned status: ${depositsRes.status}`);
        throw new Error(`Deposit API failed with status ${depositsRes.status}`);
      }
      if (!withdrawalsRes.ok) {
        console.error(`Withdrawal API returned status: ${withdrawalsRes.status}`);
        throw new Error(`Withdrawal API failed with status ${withdrawalsRes.status}`);
      }
      if (!investmentsRes.ok) {
        console.error(`Investment API returned status: ${investmentsRes.status}`);
        throw new Error(`Investment API failed with status ${investmentsRes.status}`);
      }

      const [deposits, withdrawals, investments] = await Promise.all([
        depositsRes.json().catch(err => {
          console.error(`Failed to parse deposit response: ${err.message}`);
          throw err;
        }),
        withdrawalsRes.json().catch(err => {
          console.error(`Failed to parse withdrawal response: ${err.message}`);
          throw err;
        }),
        investmentsRes.json().catch(err => {
          console.error(`Failed to parse investment response: ${err.message}`);
          throw err;
        })
      ]);


      // console.log(`Fetched ${deposits.data.length} deposits, ${withdrawals.data.length} withdrawals, ${investments.data.length} investments`);
      
      console.log(deposits.deposits);
      console.log(withdrawals.withdrawals);
      console.log(investments.investments);


      const allTransactions = [
        ...deposits.deposits.map(d => ({ ...d, type: 'deposit' })),
        ...withdrawals.withdrawals.map(w => ({ ...w, type: 'withdrawal' })),
        ...investments.investments.map(i => ({ ...i, type: 'investment' }))
      ];

      allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log(`Combined and sorted ${allTransactions.length} transactions`);
      return allTransactions;
    } catch (error) {
      console.log(error);
      console.error(`Error fetching transactions: ${error.message}`);
      showError('Failed to load transactions. Please try again later.');
      return [];
    }
}

    // Render transactions
    function renderTransactions(transactions, page = 1) {
      console.log(`Rendering transactions for page ${page}, total: ${transactions.length}`);
      const list = document.getElementById('transactionList');
      list.innerHTML = '';

      if (transactions.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('paginationCard').style.display = 'none';
        console.log('No transactions to display, showing empty state');
        return;
      }

      hideError();
      document.getElementById('emptyState').style.display = 'none';
      document.getElementById('paginationCard').style.display = 'block';

      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginated = transactions.slice(start, end);

      paginated.forEach(tx => {
        const typeClass = getTransactionClass(tx.type);
        const { class: amountClass, prefix: amountPrefix } = getAmountClassAndPrefix(tx.type, tx.amount);
        const statusClass = getStatusClass(tx.status || 'pending');
        const date = formatDate(tx.createdAt || new Date());

        const card = `
          <div class="transaction-card p-3 mb-3 rounded shadow-sm ${typeClass}">
            <div class="d-flex justify-content-between transaction-details">
              <div>
                <h6 class="mb-1">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</h6>
                <p class="text-muted small mb-0">${tx.status || 'Processing'} • ${date}</p>
              </div>
              <div class="transaction-amount text-end">
                <div class="${amountClass}">${amountPrefix}$${Number(tx.amount).toFixed(3)}</div>
                <span class="status-badge ${statusClass}">${tx.status || 'Pending'}</span>
              </div>
            </div>
          </div>
        `;
        list.insertAdjacentHTML('beforeend', card);
      });

      console.log(`Rendered ${paginated.length} transactions on page ${page}`);
      renderPagination(transactions.length, page);
    }

    // Render pagination
    function renderPagination(totalItems, currentPage) {
      console.log(`Rendering pagination: ${totalItems} items, page ${currentPage}`);
      const pagination = document.getElementById('pagination');
      pagination.innerHTML = '';

      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

      pagination.insertAdjacentHTML('beforeend', `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="handlePageChange(${currentPage - 1})" ${currentPage === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>Previous</a>
        </li>
      `);

      for (let i = 1; i <= totalPages; i++) {
        pagination.insertAdjacentHTML('beforeend', `
          <li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="handlePageChange(${i})">${i}</a>
          </li>
        `);
      }

      pagination.insertAdjacentHTML('beforeend', `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="handlePageChange(${currentPage + 1})" ${currentPage === totalPages ? 'tabindex="-1" aria-disabled="true"' : ''}>Next</a>
        </li>
      `);

      console.log(`Pagination rendered: ${totalPages} pages`);
    }

    // Handle page change
    function handlePageChange(page) {
      // event.preventDefault();
      console.log(`Changing to page ${page}`);
      renderTransactions(filteredTransactions, page);
    }

    // Filter transactions
    function filterTransactions(transactions, type, fromDate, toDate) {
      console.log(`Filtering transactions: type=${type}, from=${fromDate}, to=${toDate}`);
      const filtered = transactions.filter(tx => {
        let matchesType = true;
        let matchesDate = true;

        if (type && tx.type !== type) {
          matchesType = false;
        }

        const txDate = new Date(tx.createdAt);
        if (fromDate && txDate < new Date(fromDate)) {
          matchesDate = false;
        }
        if (toDate && txDate > new Date(toDate)) {
          matchesDate = false;
        }

        return matchesType && matchesDate;
      });
      console.log(`Filtered ${filtered.length} transactions`);
      return filtered;
    }

    // Export to CSV
    function exportToCSV(transactions) {
      console.log(`Exporting ${transactions.length} transactions to CSV`);
      const csvHeaders = ['Type', 'Amount', 'Status', 'Date'];
      const csvRows = transactions.map(tx => [
        tx.type,
        tx.amount,
        tx.status || 'Pending',
        formatDate(tx.createdAt)
      ]);

      let csvContent = csvHeaders.join(',') + '\n';
      csvRows.forEach(row => {
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'transaction_history.csv';
      link.click();
      console.log('CSV export completed');
    }

    // Global variables
    let allTransactions = [];
    let filteredTransactions = [];

    // Page load
    document.addEventListener('DOMContentLoaded', async function () {
      console.log('Page loaded, initializing...');
      allTransactions = await fetchTransactions();
      filteredTransactions = allTransactions;
      renderTransactions(filteredTransactions, 1);

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      document.getElementById('dateTo').value = today.toISOString().split('T')[0];
      document.getElementById('dateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];
      updateDateRangeText();
      console.log('Default date range set');

      document.getElementById('applyFilters').addEventListener('click', function (e) {
        e.preventDefault();
        const type = document.querySelector('select[name="type"]').value;
        const fromDate = document.getElementById('dateFrom').value;
        const toDate = document.getElementById('dateTo').value;
        filteredTransactions = filterTransactions(allTransactions, type, fromDate, toDate);
        renderTransactions(filteredTransactions, 1);
      });

      document.getElementById('clearDates').addEventListener('click', function () {
        console.log('Clearing date filters');
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        updateDateRangeText();
      });

      document.getElementById('applyDates').addEventListener('click', function () {
        console.log('Applying date filters');
        updateDateRangeText();
        bootstrap.Dropdown.getInstance(document.getElementById('dateFilterDropdown')).hide();
      });

      document.getElementById('export-history').addEventListener('click', function (e) {
        e.preventDefault();
        exportToCSV(filteredTransactions);
      });

      console.log('Event listeners initialized');
    });

    function updateDateRangeText() {
      console.log('Updating date range text');
      const dateFrom = document.getElementById('dateFrom').value;
      const dateTo = document.getElementById('dateTo').value;
      const dateRangeText = document.getElementById('dateRangeText');
      if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom).toLocaleDateString();
        const toDate = new Date(dateTo).toLocaleDateString();
        dateRangeText.textContent = `${fromDate} - ${toDate}`;
      } else if (dateFrom) {
        dateRangeText.textContent = `From ${new Date(dateFrom).toLocaleDateString()}`;
      } else if (dateTo) {
        dateRangeText.textContent = `Until ${new Date(dateTo).toLocaleDateString()}`;
      } else {
        dateRangeText.textContent = 'All dates';
      }
      console.log(`Date range text updated: ${dateRangeText.textContent}`);
    }