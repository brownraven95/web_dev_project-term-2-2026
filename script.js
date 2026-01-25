// ==================== STOCK DATA SIMULATION ====================
const stockDatabase = {
    'AAPL': { name: 'Apple Inc.', sector: 'Technology', basePrice: 185.25 },
    'TSLA': { name: 'Tesla Inc.', sector: 'Automotive', basePrice: 245.80 },
    'MSFT': { name: 'Microsoft Corp.', sector: 'Technology', basePrice: 398.67 },
    'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology', basePrice: 152.34 },
    'AMZN': { name: 'Amazon.com Inc.', sector: 'E-commerce', basePrice: 174.45 },
    'META': { name: 'Meta Platforms', sector: 'Technology', basePrice: 485.75 },
    'NVDA': { name: 'NVIDIA Corp.', sector: 'Technology', basePrice: 950.02 },
    'JPM': { name: 'JPMorgan Chase', sector: 'Finance', basePrice: 195.40 },
    'WMT': { name: 'Walmart Inc.', sector: 'Retail', basePrice: 175.30 },
    'JNJ': { name: 'Johnson & Johnson', sector: 'Healthcare', basePrice: 158.90 }
};

// ==================== APPLICATION STATE ====================
const appState = {
    trackedStocks: JSON.parse(localStorage.getItem('stockTracker_stocks')) || [],
    alerts: JSON.parse(localStorage.getItem('stockTracker_alerts')) || [],
    refreshInterval: parseInt(localStorage.getItem('stockTracker_interval')) || 5000,
    isAutoRefresh: true,
    updateInterval: null,
    notificationEnabled: true,
    logEntries: JSON.parse(localStorage.getItem('stockTracker_logs')) || [
        { type: 'info', message: 'Welcome to StockTracker!', time: new Date().toISOString() }
    ]
};

// ==================== DOM ELEMENTS ====================
const DOM = {
    // Input and Controls
    stockInput: document.getElementById('stockInput'),
    addBtn: document.getElementById('addBtn'),
    refreshSlider: document.getElementById('refreshSlider'),
    intervalValue: document.getElementById('intervalValue'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    notificationToggle: document.getElementById('notificationToggle'),
    testNotify: document.getElementById('testNotify'),
    
    // Display Areas
    stocksContainer: document.getElementById('stocksContainer'),
    stockCount: document.getElementById('stockCount'),
    lastUpdate: document.getElementById('lastUpdate'),
    
    // Alert System
    alertStockSelect: document.getElementById('alertStockSelect'),
    alertCondition: document.getElementById('alertCondition'),
    alertPrice: document.getElementById('alertPrice'),
    setAlertBtn: document.getElementById('setAlertBtn'),
    alertsList: document.getElementById('alertsList'),
    
    // Log
    logEntries: document.getElementById('logEntries'),
    clearLog: document.getElementById('clearLog')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    console.log('Initializing Stock Tracker App...');
    
    // Setup all event listeners FIRST
    setupEventListeners();
    
    // Load saved state
    loadSavedState();
    
    // Start auto refresh
    startAutoRefresh();
    
    // Initial render
    renderAllStocks();
    renderAlerts();
    renderLogEntries();
    updateStockSelect();
    
    // Initial data update
    setTimeout(() => {
        updateAllStocks();
    }, 500);
    
    addLog('info', 'Application initialized');
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Add Stock Button
    DOM.addBtn.addEventListener('click', addStock);
    DOM.stockInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addStock();
        }
    });
    
    // Refresh Interval Slider
    DOM.refreshSlider.addEventListener('input', function() {
        const seconds = this.value;
        DOM.intervalValue.textContent = seconds;
        appState.refreshInterval = seconds * 1000;
        localStorage.setItem('stockTracker_interval', appState.refreshInterval);
        restartAutoRefresh();
        addLog('settings', `Refresh interval changed to ${seconds} seconds`);
    });
    
    // Pause/Resume Button
    DOM.pauseBtn.addEventListener('click', toggleAutoRefresh);
    
    // Reset Button
    DOM.resetBtn.addEventListener('click', resetToDefaults);
    
    // Notification Toggle
    DOM.notificationToggle.addEventListener('change', function() {
        appState.notificationEnabled = this.checked;
        addLog('settings', `Notifications ${this.checked ? 'enabled' : 'disabled'}`);
        showMessage(`Notifications ${this.checked ? 'enabled' : 'disabled'}`, 'info');
    });
    
    // Test Notification Button
    DOM.testNotify.addEventListener('click', testNotification);
    
    // Set Alert Button
    DOM.setAlertBtn.addEventListener('click', setPriceAlert);
    
    // Clear Log Button
    DOM.clearLog.addEventListener('click', clearLogs);
    
    console.log('Event listeners setup complete');
}

// ==================== STOCK MANAGEMENT ====================
function addStock() {
    const symbol = DOM.stockInput.value.trim().toUpperCase();
    console.log('Adding stock:', symbol);
    
    if (!symbol) {
        showMessage('Please enter a stock symbol', 'error');
        return;
    }
    
    if (appState.trackedStocks.includes(symbol)) {
        showMessage(`${symbol} is already being tracked`, 'warning');
        DOM.stockInput.value = '';
        return;
    }
    
    // Check if stock exists in database
    if (!stockDatabase[symbol]) {
        const addAnyway = confirm(`"${symbol}" is not in our database. Add it with simulated data?`);
        if (!addAnyway) return;
        
        // Create simulated data for unknown stock
        stockDatabase[symbol] = {
            name: `${symbol} Corporation`,
            sector: 'Unknown',
            basePrice: 50 + Math.random() * 200
        };
    }
    
    // Add to tracked stocks
    appState.trackedStocks.push(symbol);
    saveState();
    
    // Update UI
    renderStockCard(symbol);
    updateStockCount();
    updateStockSelect();
    
    // Clear input
    DOM.stockInput.value = '';
    
    // Show success message
    showMessage(`${symbol} added successfully`, 'success');
    addLog('add', `Added ${symbol} to tracking`);
    
    // Fetch initial data
    updateSingleStock(symbol);
}

function removeStock(symbol) {
    console.log('Removing stock:', symbol);
    
    // Remove from tracked stocks
    appState.trackedStocks = appState.trackedStocks.filter(s => s !== symbol);
    saveState();
    
    // Remove related alerts
    appState.alerts = appState.alerts.filter(alert => alert.symbol !== symbol);
    saveState();
    
    // Remove from DOM with animation
    const card = document.getElementById(`stock-${symbol}`);
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (card.parentNode) {
                card.parentNode.removeChild(card);
            }
        }, 300);
    }
    
    // Update UI
    updateStockCount();
    updateStockSelect();
    renderAlerts();
    
    // Show message
    showMessage(`${symbol} removed from tracking`, 'info');
    addLog('remove', `Removed ${symbol} from tracking`);
    
    // Show empty state if no stocks
    if (appState.trackedStocks.length === 0) {
        showEmptyState();
    }
}

// ==================== STOCK DATA UPDATES ====================
function updateSingleStock(symbol) {
    const stockInfo = stockDatabase[symbol];
    if (!stockInfo) return null;
    
    // Generate random price movement
    const volatility = 0.015;
    const randomChange = (Math.random() * 2 - 1) * volatility;
    const newPrice = stockInfo.basePrice * (1 + randomChange);
    
    // Update base price for trend
    stockInfo.basePrice = newPrice;
    
    // Maintain price history
    if (!stockInfo.history) stockInfo.history = [];
    stockInfo.history.push(newPrice);
    if (stockInfo.history.length > 15) stockInfo.history.shift();
    
    // Calculate change
    const previousPrice = stockInfo.history.length > 1 
        ? stockInfo.history[stockInfo.history.length - 2]
        : newPrice * 0.98;
    
    const change = newPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    const stockData = {
        symbol,
        name: stockInfo.name,
        price: parseFloat(newPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        history: [...stockInfo.history]
    };
    
    // Update the card
    updateStockCard(stockData);
    
    // Check alerts
    checkAlerts(stockData);
    
    return stockData;
}

function updateAllStocks() {
    if (appState.trackedStocks.length === 0) return;
    
    appState.trackedStocks.forEach(symbol => {
        updateSingleStock(symbol);
    });
    
    // Update timestamp
    const now = new Date();
    DOM.lastUpdate.textContent = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

// ==================== RENDERING FUNCTIONS ====================
function renderStockCard(symbol) {
    // Remove empty state if present
    const emptyState = DOM.stocksContainer.querySelector('.empty-state');
    if (emptyState && emptyState.parentNode) {
        emptyState.parentNode.removeChild(emptyState);
    }
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'stock-card';
    card.id = `stock-${symbol}`;
    
    const stockInfo = stockDatabase[symbol] || { name: `${symbol} Corp.`, sector: 'Unknown' };
    
    card.innerHTML = `
        <button class="delete-btn" data-symbol="${symbol}" title="Remove stock">
            <i class="fas fa-times"></i>
        </button>
        <div class="stock-header">
            <div>
                <div class="stock-symbol">${symbol}</div>
                <div class="stock-name">${stockInfo.name}</div>
            </div>
            <div class="stock-meta">
                <span class="sector-badge">${stockInfo.sector}</span>
            </div>
        </div>
        <div class="stock-price">$${(stockInfo.basePrice || 0).toFixed(2)}</div>
        <div class="stock-change">
            <span class="price-change neutral">+0.00 (0.00%)</span>
        </div>
        <div class="stock-chart">
            <canvas id="chart-${symbol}" width="300" height="80"></canvas>
        </div>
        <div class="stock-footer">
            <small>Updated: Just now</small>
        </div>
    `;
    
    DOM.stocksContainer.appendChild(card);
    
    // Add delete event listener
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        const symbolToRemove = this.getAttribute('data-symbol');
        removeStock(symbolToRemove);
    });
}

function updateStockCard(data) {
    const card = document.getElementById(`stock-${data.symbol}`);
    if (!card) return;
    
    // Update price
    const priceEl = card.querySelector('.stock-price');
    if (priceEl) {
        priceEl.textContent = `$${data.price.toFixed(2)}`;
    }
    
    // Update change
    const changeEl = card.querySelector('.price-change');
    if (changeEl) {
        const isPositive = data.change >= 0;
        changeEl.textContent = `${isPositive ? '+' : ''}${data.change.toFixed(2)} (${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
        changeEl.className = `price-change ${isPositive ? 'positive' : 'negative'}`;
        
        // Update card border
        card.classList.remove('increase', 'decrease');
        card.classList.add(isPositive ? 'increase' : 'decrease');
    }
    
    // Update timestamp
    const footer = card.querySelector('.stock-footer small');
    if (footer) {
        const now = new Date();
        footer.textContent = `Updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Update chart
    updateStockChart(data.symbol, data.history);
}

function renderAllStocks() {
    DOM.stocksContainer.innerHTML = '';
    
    if (appState.trackedStocks.length === 0) {
        showEmptyState();
    } else {
        appState.trackedStocks.forEach(symbol => {
            renderStockCard(symbol);
        });
    }
}

function showEmptyState() {
    DOM.stocksContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No stocks being tracked</h3>
            <p>Add stocks to start monitoring prices</p>
            <div class="suggestions">
                <button class="suggestion-btn" data-symbol="AAPL">AAPL</button>
                <button class="suggestion-btn" data-symbol="TSLA">TSLA</button>
                <button class="suggestion-btn" data-symbol="MSFT">MSFT</button>
                <button class="suggestion-btn" data-symbol="GOOGL">GOOGL</button>
            </div>
        </div>
    `;
    
    // Rebind suggestion button events
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const symbol = this.getAttribute('data-symbol');
            DOM.stockInput.value = symbol;
            addStock();
        });
    });
}

// ==================== ALERT SYSTEM ====================
function updateStockSelect() {
    const select = DOM.alertStockSelect;
    select.innerHTML = '<option value="">Select a stock</option>';
    
    appState.trackedStocks.forEach(symbol => {
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = `${symbol} - ${stockDatabase[symbol]?.name || 'Unknown'}`;
        select.appendChild(option);
    });
    
    // Enable/disable controls
    const hasStocks = appState.trackedStocks.length > 0;
    DOM.alertStockSelect.disabled = !hasStocks;
    DOM.alertPrice.disabled = !hasStocks;
    DOM.setAlertBtn.disabled = !hasStocks;
}

function setPriceAlert() {
    const symbol = DOM.alertStockSelect.value;
    const price = parseFloat(DOM.alertPrice.value);
    const condition = DOM.alertCondition.value;
    
    if (!symbol || !price || price <= 0) {
        showMessage('Please select a stock and enter a valid price', 'error');
        return;
    }
    
    // Check for duplicate alert
    const duplicateAlert = appState.alerts.find(
        alert => alert.symbol === symbol && 
        alert.targetPrice === price && 
        alert.condition === condition &&
        !alert.triggered
    );
    
    if (duplicateAlert) {
        showMessage('This alert already exists', 'warning');
        return;
    }
    
    // Create alert
    const alert = {
        id: Date.now(),
        symbol,
        targetPrice: price,
        condition,
        triggered: false,
        createdAt: new Date().toISOString()
    };
    
    appState.alerts.push(alert);
    saveState();
    renderAlerts();
    
    // Clear form
    DOM.alertPrice.value = '';
    
    // Show success
    showMessage(`Alert set for ${symbol} when price ${condition} $${price.toFixed(2)}`, 'success');
    addLog('alert', `Set price alert for ${symbol} (${condition} $${price.toFixed(2)})`);
}

function renderAlerts() {
    const container = DOM.alertsList;
    
    // Clear existing alerts (keep the heading)
    const existingAlerts = container.querySelectorAll('.alert-item, .empty-alerts');
    existingAlerts.forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
    
    if (appState.alerts.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-alerts';
        emptyDiv.innerHTML = '<p>No alerts set</p>';
        container.appendChild(emptyDiv);
        return;
    }
    
    // Render each alert
    appState.alerts.forEach(alert => {
        const alertEl = document.createElement('div');
        alertEl.className = `alert-item ${alert.triggered ? 'triggered' : ''}`;
        alertEl.id = `alert-${alert.id}`;
        
        alertEl.innerHTML = `
            <div class="alert-details">
                <strong>${alert.symbol}</strong>
                <span class="alert-condition">${alert.condition === 'above' ? 'Above' : 'Below'} $${alert.targetPrice.toFixed(2)}</span>
                <div class="alert-time">Set: ${new Date(alert.createdAt).toLocaleDateString()}</div>
            </div>
            <button class="btn btn-small delete-alert" data-id="${alert.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        container.appendChild(alertEl);
        
        // Add delete event
        const deleteBtn = alertEl.querySelector('.delete-alert');
        deleteBtn.addEventListener('click', function() {
            const alertId = parseInt(this.getAttribute('data-id'));
            deleteAlert(alertId);
        });
    });
}

function checkAlerts(stockData) {
    appState.alerts.forEach(alert => {
        if (alert.symbol === stockData.symbol && !alert.triggered) {
            const shouldTrigger = 
                (alert.condition === 'above' && stockData.price >= alert.targetPrice) ||
                (alert.condition === 'below' && stockData.price <= alert.targetPrice);
            
            if (shouldTrigger) {
                triggerAlert(alert, stockData.price);
            }
        }
    });
}

function triggerAlert(alert, currentPrice) {
    alert.triggered = true;
    alert.triggeredAt = new Date().toISOString();
    alert.triggeredPrice = currentPrice;
    
    saveState();
    renderAlerts();
    
    // Show notification
    if (appState.notificationEnabled) {
        showNotification(alert, currentPrice);
    }
    
    // Add to log
    addLog('alert-triggered', 
        `ALERT: ${alert.symbol} hit $${currentPrice.toFixed(2)} (${alert.condition} $${alert.targetPrice.toFixed(2)})`
    );
    
    // Show message
    showMessage(`Alert triggered for ${alert.symbol} at $${currentPrice.toFixed(2)}!`, 'warning');
}

function deleteAlert(alertId) {
    appState.alerts = appState.alerts.filter(alert => alert.id !== alertId);
    saveState();
    renderAlerts();
    addLog('alert', `Deleted alert #${alertId}`);
}

// ==================== LOG SYSTEM ====================
function addLog(type, message) {
    const logEntry = {
        id: Date.now(),
        type,
        message,
        time: new Date().toISOString()
    };
    
    appState.logEntries.unshift(logEntry);
    if (appState.logEntries.length > 50) {
        appState.logEntries.pop();
    }
    
    saveState();
    renderLogEntry(logEntry);
}

function renderLogEntry(entry) {
    // Remove empty state if present
    const emptyText = DOM.logEntries.querySelector('.empty-text');
    if (emptyText && entry.type !== 'info') {
        emptyText.remove();
    }
    
    const logEl = document.createElement('div');
    logEl.className = `log-entry ${entry.type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    let iconColor = '#2563eb';
    
    switch(entry.type) {
        case 'alert': icon = 'bell'; iconColor = '#f59e0b'; break;
        case 'alert-triggered': icon = 'bullhorn'; iconColor = '#ef4444'; break;
        case 'add': icon = 'plus-circle'; iconColor = '#10b981'; break;
        case 'remove': icon = 'minus-circle'; iconColor = '#ef4444'; break;
        case 'settings': icon = 'cog'; iconColor = '#8b5cf6'; break;
    }
    
    logEl.innerHTML = `
        <i class="fas fa-${icon}" style="color: ${iconColor}"></i>
        <div>
            <p>${entry.message}</p>
            <small>${new Date(entry.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
        </div>
    `;
    
    DOM.logEntries.insertBefore(logEl, DOM.logEntries.firstChild);
}

function renderLogEntries() {
    DOM.logEntries.innerHTML = '';
    
    if (appState.logEntries.length === 0) {
        DOM.logEntries.innerHTML = '<p class="empty-text">No activity yet</p>';
    } else {
        appState.logEntries.forEach(entry => {
            renderLogEntry(entry);
        });
    }
}

function clearLogs() {
    if (appState.logEntries.length === 0) return;
    
    if (confirm('Clear all log entries?')) {
        appState.logEntries = [];
        saveState();
        renderLogEntries();
        addLog('info', 'Log cleared');
    }
}

// ==================== UTILITY FUNCTIONS ====================
function loadSavedState() {
    // Load interval setting
    DOM.refreshSlider.value = appState.refreshInterval / 1000;
    DOM.intervalValue.textContent = appState.refreshInterval / 1000;
    
    // Load notification toggle
    DOM.notificationToggle.checked = appState.notificationEnabled;
    
    updateStockCount();
}

function saveState() {
    localStorage.setItem('stockTracker_stocks', JSON.stringify(appState.trackedStocks));
    localStorage.setItem('stockTracker_alerts', JSON.stringify(appState.alerts));
    localStorage.setItem('stockTracker_interval', appState.refreshInterval);
    localStorage.setItem('stockTracker_logs', JSON.stringify(appState.logEntries));
}

function updateStockCount() {
    DOM.stockCount.textContent = appState.trackedStocks.length;
}

function startAutoRefresh() {
    if (appState.updateInterval) {
        clearInterval(appState.updateInterval);
    }
    
    appState.updateInterval = setInterval(() => {
        if (appState.isAutoRefresh) {
            updateAllStocks();
        }
    }, appState.refreshInterval);
    
    DOM.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    DOM.pauseBtn.classList.remove('btn-success');
    DOM.pauseBtn.classList.add('btn-secondary');
}

function toggleAutoRefresh() {
    appState.isAutoRefresh = !appState.isAutoRefresh;
    
    if (appState.isAutoRefresh) {
        DOM.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        DOM.pauseBtn.classList.remove('btn-success');
        DOM.pauseBtn.classList.add('btn-secondary');
        addLog('settings', 'Auto-refresh resumed');
        showMessage('Auto-refresh resumed', 'info');
    } else {
        DOM.pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        DOM.pauseBtn.classList.remove('btn-secondary');
        DOM.pauseBtn.classList.add('btn-success');
        addLog('settings', 'Auto-refresh paused');
        showMessage('Auto-refresh paused', 'warning');
    }
}

function restartAutoRefresh() {
    if (appState.updateInterval) {
        clearInterval(appState.updateInterval);
    }
    startAutoRefresh();
}

function resetToDefaults() {
    if (confirm('Reset all settings to defaults?')) {
        appState.refreshInterval = 5000;
        DOM.refreshSlider.value = 5;
        DOM.intervalValue.textContent = '5';
        DOM.notificationToggle.checked = true;
        appState.notificationEnabled = true;
        
        localStorage.setItem('stockTracker_interval', appState.refreshInterval);
        restartAutoRefresh();
        
        addLog('settings', 'Settings reset to defaults');
        showMessage('Settings reset to defaults', 'info');
    }
}

function testNotification() {
    if (!appState.notificationEnabled) {
        showMessage('Enable notifications first', 'warning');
        return;
    }
    
    if (!("Notification" in window)) {
        showMessage('Browser does not support notifications', 'error');
        return;
    }
    
    if (Notification.permission === "granted") {
        new Notification("StockTracker Test", {
            body: "This is a test notification from StockTracker",
            icon: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png"
        });
        addLog('notification', 'Test notification sent');
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("StockTracker Test", {
                    body: "This is a test notification from StockTracker",
                    icon: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png"
                });
                addLog('notification', 'Test notification sent');
            }
        });
    }
}

function showNotification(alert, currentPrice) {
    if (!("Notification" in window) || !appState.notificationEnabled) return;
    
    if (Notification.permission === "granted") {
        const notification = new Notification(`💰 Stock Alert: ${alert.symbol}`, {
            body: `${alert.symbol} is now $${currentPrice.toFixed(2)} (${alert.condition} your target of $${alert.targetPrice.toFixed(2)})`,
            icon: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png",
            tag: `alert-${alert.id}`
        });
        
        notification.onclick = function() {
            window.focus();
            this.close();
        };
    }
}

function showMessage(message, type = 'info') {
    // Remove existing message
    const existingMsg = document.querySelector('.temp-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create message element
    const msgEl = document.createElement('div');
    msgEl.className = `temp-message ${type}`;
    msgEl.textContent = message;
    
    // Style based on type
    const styles = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease'
    };
    
    if (type === 'error') {
        styles.backgroundColor = '#fee2e2';
        styles.color = '#991b1b';
        styles.borderLeft = '4px solid #ef4444';
    } else if (type === 'success') {
        styles.backgroundColor = '#d1fae5';
        styles.color = '#065f46';
        styles.borderLeft = '4px solid #10b981';
    } else if (type === 'warning') {
        styles.backgroundColor = '#fef3c7';
        styles.color = '#92400e';
        styles.borderLeft = '4px solid #f59e0b';
    } else {
        styles.backgroundColor = '#dbeafe';
        styles.color = '#1e40af';
        styles.borderLeft = '4px solid #3b82f6';
    }
    
    // Apply styles
    Object.assign(msgEl.style, styles);
    
    // Add to page
    document.body.appendChild(msgEl);
    
    // Add animation style
    if (!document.querySelector('#message-animations')) {
        const style = document.createElement('style');
        style.id = 'message-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        msgEl.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (msgEl.parentNode) {
                msgEl.parentNode.removeChild(msgEl);
            }
        }, 300);
    }, 3000);
}

// ==================== CHART FUNCTIONS ====================
function updateStockChart(symbol, history) {
    const canvas = document.getElementById(`chart-${symbol}`);
    if (!canvas || !history || history.length < 2) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    const isPositive = history[history.length - 1] >= history[0];
    const color = isPositive ? '#10b981' : '#ef4444';
    
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');
    
    // Create chart
    canvas.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map((_, i) => ''),
            datasets: [{
                data: history,
                borderColor: color,
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

// Initial render
console.log('Stock Tracker Script Loaded');