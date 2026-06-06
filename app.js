/* ============================================
   EXPENSE TRACKER - APPLICATION LOGIC
   مع دعم Google Sheets كقاعدة بيانات
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================

    // ==========================================
    // DATA LAYER
    // ==========================================
    const STORAGE_KEYS = {
        TRANSACTIONS: 'wallet_transactions',
        INCOME_SPLITS: 'wallet_income_splits',
        CURRENCY: 'wallet_currency',
        SHEET_URL: 'wallet_sheet_url',
    };
    const APP_PIN = '2580';
    const FIXED_SPLIT_RATIOS = {
        savings: 0.30,
        expenses: 0.50,
        emergency: 0.20,
    };

    const CATEGORIES = {
        food: { label: 'غذائية', emoji: '🍽️', color: '#f97316' },
        smoking: { label: 'دخان', emoji: '🚬', color: '#a78bfa' },
        entertainment: { label: 'ترفيه', emoji: '🎮', color: '#60a5fa' },
        personal: { label: 'عناية شخصية', emoji: '💆', color: '#f472b6' },
        family: { label: 'التزامات اسرية', emoji: '👨‍👩‍👧‍👦', color: '#34d399' },
    };

    const MONTHS_AR = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    let currency = loadCurrency();
    let appsScriptUrl = loadSheetUrl();
    let transactions = loadTransactions();
    let incomeSplits = loadIncomeSplits();
    let analyticsMode = 'all';
    let analyticsMonth = new Date().getMonth();
    let analyticsYear = new Date().getFullYear();
    let deleteTargetId = null;
    let isSyncing = false;
    let toastTimer = null;

    // Chart instances
    let categoryChart = null;
    let paymentChart = null;
    let incomeDistChart = null;
    let dailyChart = null;

    // ==========================================
    // GOOGLE SHEETS SYNC
    // ==========================================
    function isOnlineMode() {
        return appsScriptUrl && appsScriptUrl.length > 10;
    }

    async function syncFromCloud() {
        if (!isOnlineMode() || isSyncing) return { success: false, count: 0 };
        isSyncing = true;
        showSyncIndicator(true);

        try {
            const data = await getCloudData();

            if (!data || !data.success || !Array.isArray(data.transactions)) {
                throw new Error('Invalid Google Sheets response');
            }

            transactions = normalizeTransactions(data.transactions);
            incomeSplits = normalizeSplits(data.splits);

            // حفظ نسخة محلية أيضاً
            saveTransactionsLocal();
            saveIncomeSplitsLocal();

            updateHome();
            if (document.querySelector('#page-analytics.active')) {
                updateAnalytics();
            }

            updateConnectionStatus();
            return { success: true, count: transactions.length };
        } catch (error) {
            console.warn('فشل المزامنة مع السحابة، استخدام البيانات المحلية:', error);
            showToast('تعذر تحميل البيانات من Google Sheets');
            return { success: false, count: 0 };
        } finally {
            isSyncing = false;
            showSyncIndicator(false);
        }
    }

    async function pushToCloud(action, data) {
        if (!isOnlineMode()) return;

        try {
            incomeSplits = calculateCurrentWalletSplits();
            saveIncomeSplitsLocal();
            const body = new URLSearchParams({
                action: 'saveAll',
                transactions: JSON.stringify(transactions),
                splits: JSON.stringify(incomeSplits),
            });

            await fetch(appsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                body,
            });
            updateConnectionStatus();
            return { success: true };
        } catch (error) {
            console.warn('فشل الإرسال إلى السحابة:', error);
            showToast('⚠️ تم الحفظ محلياً فقط');
        }
    }

    function getCloudData() {
        return getCloudDataJsonp()
            .catch(() => getCloudDataFrame());
    }

    function getCloudDataJsonp() {
        return new Promise((resolve, reject) => {
            const callbackName = `walletCloudCallback_${Date.now()}`;
            const script = document.createElement('script');
            const separator = appsScriptUrl.includes('?') ? '&' : '?';
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Google Sheets JSONP timeout'));
            }, 7000);

            function cleanup() {
                clearTimeout(timeout);
                delete window[callbackName];
                script.remove();
            }

            window[callbackName] = (data) => {
                cleanup();
                resolve(data);
            };

            script.onerror = () => {
                cleanup();
                reject(new Error('Google Sheets JSONP failed'));
            };

            script.src = `${appsScriptUrl}${separator}action=getAll&callback=${callbackName}`;
            document.body.appendChild(script);
        });
    }

    function getCloudDataFrame() {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            const separator = appsScriptUrl.includes('?') ? '&' : '?';
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Google Sheets frame timeout'));
            }, 10000);

            function cleanup() {
                clearTimeout(timeout);
                window.removeEventListener('message', handleMessage);
                iframe.remove();
            }

            function handleMessage(event) {
                const data = event.data;
                if (!data || data.source !== 'expense-tracker-google-sheets') return;
                cleanup();
                resolve(data.payload);
            }

            window.addEventListener('message', handleMessage);
            iframe.hidden = true;
            iframe.src = `${appsScriptUrl}${separator}action=getAll&mode=frame&t=${Date.now()}`;
            document.body.appendChild(iframe);
        });
    }

    function normalizeTransactions(items) {
        return items.map(item => ({
            ...item,
            amount: Number(item.amount || 0),
            description: item.description || item.note || '',
            date: item.date || new Date().toISOString().split('T')[0],
            createdAt: Number(item.createdAt || Date.now()),
        }));
    }

    function normalizeSplits(value) {
        return {
            savings: Number(value && value.savings || 0),
            expenses: Number(value && value.expenses || 0),
            emergency: Number(value && value.emergency || 0),
        };
    }

    function showSyncIndicator(show) {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.classList.toggle('visible', show);
        }
    }

    // ==========================================
    // LOCAL STORAGE (نسخة احتياطية)
    // ==========================================
    function loadTransactions() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveTransactionsLocal() {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }

    function saveTransactions() {
        saveTransactionsLocal();
    }

    function loadIncomeSplits() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.INCOME_SPLITS);
            return data ? JSON.parse(data) : { savings: 0, expenses: 0, emergency: 0 };
        } catch {
            return { savings: 0, expenses: 0, emergency: 0 };
        }
    }

    function saveIncomeSplitsLocal() {
        localStorage.setItem(STORAGE_KEYS.INCOME_SPLITS, JSON.stringify(incomeSplits));
    }

    function saveIncomeSplits() {
        saveIncomeSplitsLocal();
    }

    function loadCurrency() {
        return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'د.ل';
    }

    function saveCurrency() {
        localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
    }

    function loadSheetUrl() {
        return localStorage.getItem(STORAGE_KEYS.SHEET_URL) || '';
    }

    function saveSheetUrl() {
        localStorage.setItem(STORAGE_KEYS.SHEET_URL, appsScriptUrl);
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function formatMoney(amount) {
        const num = parseFloat(amount) || 0;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatMoneyWithCurrency(amount) {
        return formatMoney(amount) + ' ' + currency;
    }

    // ==========================================
    // DOM REFERENCES
    // ==========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        splash: $('#splash-screen'),
        lockScreen: $('#lock-screen'),
        lockCard: $('.lock-card'),
        lockForm: $('#lock-form'),
        lockPin: $('#lock-pin'),
        lockError: $('#lock-error'),
        app: $('#app'),
        pageTitle: $('#page-title'),
        headerDate: $('#header-date'),

        // Home
        totalBalance: $('#total-balance'),
        totalIncome: $('#total-income'),
        totalExpenses: $('#total-expenses'),
        savingsAmount: $('#savings-amount'),
        expensesSplitAmount: $('#expenses-split-amount'),
        emergencyAmount: $('#emergency-amount'),
        cashTotal: $('#cash-total'),
        cardTotal: $('#card-total'),
        recentTransactions: $('#recent-transactions'),
        emptyHome: $('#empty-home'),
        seeAllBtn: $('#see-all-transactions'),

        // Expense Form
        expenseAmount: $('#expense-amount'),
        expenseDesc: $('#expense-desc'),
        expenseDate: $('#expense-date'),
        categoryLabels: $('#category-labels'),
        paymentToggle: $('#payment-toggle'),
        addExpenseBtn: $('#add-expense-btn'),

        // Income Form
        incomeAmount: $('#income-amount'),
        incomeDesc: $('#income-desc'),
        incomeDate: $('#income-date'),
        addIncomeBtn: $('#add-income-btn'),

        // Analytics
        analyticsAllBtn: $('#analytics-all-btn'),
        analyticsMonthBtn: $('#analytics-month-btn'),
        analyticsMonth: $('#analytics-month'),
        prevMonth: $('#prev-month'),
        nextMonth: $('#next-month'),
        spendingChartTitle: $('#spending-chart-title'),
        aTotalIncome: $('#a-total-income'),
        aTotalExpenses: $('#a-total-expenses'),
        aBalance: $('#a-balance'),
        aCashTotal: $('#a-cash-total'),
        aCardTotal: $('#a-card-total'),
        aSavings: $('#a-savings'),
        aExpensesSplit: $('#a-expenses-split'),
        aEmergency: $('#a-emergency'),
        categoryLegend: $('#category-legend'),

        // Navigation
        bottomNav: $('#bottom-nav'),
        navBtns: $$('.nav-btn'),
        pages: $$('.page'),

        // Toast
        toast: $('#toast'),
        toastMessage: $('#toast-message'),

        // Settings
        settingsBtn: $('#settings-btn'),
        settingsModal: $('#settings-modal'),
        closeSettings: $('#close-settings'),
        currencySelect: $('#currency-select'),
        sheetUrlInput: $('#sheet-url-input'),
        saveSheetUrlBtn: $('#save-sheet-url-btn'),
        cloudSyncBtn: $('#cloud-sync-btn'),
        connectionStatus: $('#connection-status'),
        clearDataBtn: $('#clear-data-btn'),

        // Delete modal
        deleteModal: $('#delete-modal'),
        cancelDelete: $('#cancel-delete'),
        confirmDelete: $('#confirm-delete'),
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function init() {
        // Set today's date
        const today = new Date();
        const dayName = DAYS_AR[today.getDay()];
        const monthName = MONTHS_AR[today.getMonth()];
        dom.headerDate.textContent = `${dayName}، ${today.getDate()} ${monthName} ${today.getFullYear()}`;

        // Default dates
        const todayStr = today.toISOString().split('T')[0];
        dom.expenseDate.value = todayStr;
        dom.incomeDate.value = todayStr;

        // Set currency select
        dom.currencySelect.value = currency;
        if (dom.sheetUrlInput) {
            dom.sheetUrlInput.value = appsScriptUrl;
        }

        // Update connection status
        updateConnectionStatus();
        hideToast();

        // Bind events
        bindEvents();
        bindLockEvents();

        // Update all views
        updateHome();

        // Show lock screen after splash
        setTimeout(() => {
            dom.splash.classList.add('hidden');
            showLockScreen();
        }, 1500);
    }

    function bindLockEvents() {
        if (!dom.lockForm || !dom.lockPin) return;

        dom.lockPin.addEventListener('input', () => {
            dom.lockPin.value = dom.lockPin.value.replace(/\D/g, '').slice(0, 4);
            dom.lockError.textContent = '';
        });

        dom.lockForm.addEventListener('submit', (event) => {
            event.preventDefault();

            if (dom.lockPin.value === APP_PIN) {
                unlockApp();
                return;
            }

            dom.lockPin.value = '';
            dom.lockError.textContent = 'كلمة السر غير صحيحة';
            shakeElement(dom.lockCard || dom.lockPin);
            dom.lockPin.focus();
        });
    }

    function showLockScreen() {
        if (!dom.lockScreen || !dom.lockPin) {
            unlockApp();
            return;
        }

        dom.lockScreen.classList.remove('hidden');
        dom.lockScreen.hidden = false;
        dom.lockPin.value = '';
        dom.lockError.textContent = '';
        setTimeout(() => dom.lockPin.focus(), 120);
    }

    function unlockApp() {
        if (dom.lockScreen) {
            dom.lockScreen.classList.add('hidden');
            dom.lockScreen.hidden = true;
        }

        dom.app.classList.remove('hidden');

        // مزامنة من السحابة عند بدء التشغيل بعد فتح القفل
        if (isOnlineMode()) {
            syncFromCloud();
        }
    }

    function updateConnectionStatus() {
        const statusEl = dom.connectionStatus || document.getElementById('connection-status');
        if (statusEl) {
            if (isOnlineMode()) {
                statusEl.textContent = 'متصل بـ Google Sheets';
                statusEl.className = 'connection-status online';
            } else {
                statusEl.textContent = 'وضع محلي. أضف رابط Web App لتفعيل الحفظ السحابي.';
                statusEl.className = 'connection-status offline';
            }
        }
    }

    // ==========================================
    // EVENT BINDINGS
    // ==========================================
    function bindEvents() {
        // Navigation
        dom.navBtns.forEach(btn => {
            btn.addEventListener('click', () => navigateTo(btn.dataset.page));
        });

        // Category labels
        dom.categoryLabels.addEventListener('click', (e) => {
            const btn = e.target.closest('.label-btn');
            if (!btn) return;
            dom.categoryLabels.querySelectorAll('.label-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });

        // Payment toggle
        dom.paymentToggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.payment-btn');
            if (!btn) return;
            dom.paymentToggle.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });

        // Add expense
        dom.addExpenseBtn.addEventListener('click', addExpense);

        // Add income
        dom.addIncomeBtn.addEventListener('click', addIncome);

        // Analytics month navigation
        dom.analyticsAllBtn.addEventListener('click', () => {
            analyticsMode = 'all';
            updateAnalytics();
        });

        dom.analyticsMonthBtn.addEventListener('click', () => {
            analyticsMode = 'month';
            updateAnalytics();
        });

        dom.prevMonth.addEventListener('click', () => {
            analyticsMode = 'month';
            analyticsMonth++;
            if (analyticsMonth > 11) {
                analyticsMonth = 0;
                analyticsYear++;
            }
            updateAnalytics();
        });

        dom.nextMonth.addEventListener('click', () => {
            analyticsMode = 'month';
            analyticsMonth--;
            if (analyticsMonth < 0) {
                analyticsMonth = 11;
                analyticsYear--;
            }
            updateAnalytics();
        });

        // Settings
        dom.settingsBtn.addEventListener('click', () => dom.settingsModal.classList.add('active'));
        dom.closeSettings.addEventListener('click', () => dom.settingsModal.classList.remove('active'));
        dom.settingsModal.addEventListener('click', (e) => {
            if (e.target === dom.settingsModal) dom.settingsModal.classList.remove('active');
        });

        dom.currencySelect.addEventListener('change', () => {
            currency = dom.currencySelect.value;
            saveCurrency();
            updateHome();
            updateAnalytics();
        });

        if (dom.saveSheetUrlBtn) {
            dom.saveSheetUrlBtn.addEventListener('click', async () => {
                appsScriptUrl = dom.sheetUrlInput.value.trim();
                saveSheetUrl();
                updateConnectionStatus();
                if (!appsScriptUrl) {
                    showToast('تم حذف رابط Google Sheets');
                    return;
                }

                showToast('تم حفظ الرابط، جارِ تحميل البيانات...');
                const result = await syncFromCloud();
                if (result.success) {
                    showToast(`تم تحميل ${result.count} عملية من Google Sheets`);
                }
            });
        }

        if (dom.cloudSyncBtn) {
            dom.cloudSyncBtn.addEventListener('click', async () => {
                if (!isOnlineMode()) {
                    showToast('أضف رابط Google Sheets أولاً');
                    return;
                }

                showToast('جارِ تحميل البيانات من Google Sheets...');
                const result = await syncFromCloud();
                if (result.success) {
                    showToast(`تم تحميل ${result.count} عملية من Google Sheets`);
                }
            });
        }

        dom.clearDataBtn.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                transactions = [];
                incomeSplits = { savings: 0, expenses: 0, emergency: 0 };
                saveTransactions();
                saveIncomeSplits();

                // مسح من السحابة أيضاً
                await pushToCloud('clearAll', {});

                updateHome();
                updateAnalytics();
                dom.settingsModal.classList.remove('active');
                showToast('تم مسح جميع البيانات');
            }
        });

        // Delete modal
        dom.cancelDelete.addEventListener('click', () => {
            deleteTargetId = null;
            dom.deleteModal.classList.remove('active');
        });

        dom.deleteModal.addEventListener('click', (e) => {
            if (e.target === dom.deleteModal) {
                deleteTargetId = null;
                dom.deleteModal.classList.remove('active');
            }
        });

        dom.confirmDelete.addEventListener('click', () => {
            if (deleteTargetId) {
                deleteTransaction(deleteTargetId);
                deleteTargetId = null;
                dom.deleteModal.classList.remove('active');
            }
        });

        // See all transactions
        dom.seeAllBtn.addEventListener('click', () => {
            navigateTo('analytics');
        });

        // Sync button
        const syncBtn = document.getElementById('sync-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                if (isOnlineMode()) {
                    syncFromCloud();
                    showToast('جارِ المزامنة...');
                } else {
                    showToast('⚠️ لم يتم إعداد الاتصال السحابي');
                }
            });
        }
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    const PAGE_TITLES = {
        home: 'محفظتي',
        expense: 'إضافة مصروف',
        income: 'إضافة دخل',
        analytics: 'التحليلات',
    };

    function navigateTo(pageName) {
        dom.navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageName);
        });

        dom.pages.forEach(page => {
            page.classList.toggle('active', page.id === `page-${pageName}`);
        });

        dom.pageTitle.textContent = PAGE_TITLES[pageName] || 'محفظتي';

        if (pageName === 'analytics') {
            updateAnalytics();
        }
    }

    // ==========================================
    // ADD EXPENSE
    // ==========================================
    async function addExpense() {
        const amount = parseFloat(dom.expenseAmount.value);
        if (!amount || amount <= 0) {
            shakeElement(dom.expenseAmount);
            return;
        }

        const activeCategory = dom.categoryLabels.querySelector('.label-btn.active');
        const activePayment = dom.paymentToggle.querySelector('.payment-btn.active');

        const transaction = {
            id: generateId(),
            type: 'expense',
            amount: amount,
            description: dom.expenseDesc.value.trim(),
            category: activeCategory ? activeCategory.dataset.category : 'food',
            paymentMethod: activePayment ? activePayment.dataset.method : 'cash',
            date: dom.expenseDate.value || new Date().toISOString().split('T')[0],
            createdAt: Date.now(),
        };

        transactions.unshift(transaction);
        saveTransactions();
        updateHome();

        // حفظ في السحابة
        pushToCloud('addTransaction', { transaction });

        // Reset form
        dom.expenseAmount.value = '';
        dom.expenseDesc.value = '';

        showToast('تم إضافة المصروف بنجاح ✅');
        setTimeout(() => navigateTo('home'), 500);
    }

    // ==========================================
    // ADD INCOME
    // ==========================================
    async function addIncome() {
        const amount = parseFloat(dom.incomeAmount.value);
        if (!amount || amount <= 0) {
            shakeElement(dom.incomeAmount);
            return;
        }

        const transaction = {
            id: generateId(),
            type: 'income',
            amount: amount,
            description: dom.incomeDesc.value.trim(),
            date: dom.incomeDate.value || new Date().toISOString().split('T')[0],
            createdAt: Date.now(),
        };

        transactions.unshift(transaction);
        saveTransactions();
        updateHome();

        // حفظ في السحابة
        pushToCloud('addTransaction', { transaction, splits: incomeSplits });

        // Reset form
        dom.incomeAmount.value = '';
        dom.incomeDesc.value = '';

        showToast('تم إضافة الدخل بنجاح ✅');
        setTimeout(() => navigateTo('home'), 500);
    }

    // ==========================================
    // DELETE TRANSACTION
    // ==========================================
    async function deleteTransaction(id) {
        const txIndex = transactions.findIndex(t => t.id === id);
        if (txIndex === -1) return;

        transactions.splice(txIndex, 1);
        saveTransactions();
        updateHome();

        // حذف من السحابة
        pushToCloud('deleteTransaction', { id, splits: incomeSplits });

        showToast('تم حذف المعاملة');
    }

    // ==========================================
    // FIXED WALLET SPLITS
    // ==========================================
    function getTotals() {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
    }

    function calculateSplitsFromBalance(balance) {
        const available = Math.max(0, balance);

        return {
            savings: available * FIXED_SPLIT_RATIOS.savings,
            expenses: available * FIXED_SPLIT_RATIOS.expenses,
            emergency: available * FIXED_SPLIT_RATIOS.emergency,
        };
    }

    function calculateCurrentWalletSplits() {
        return calculateSplitsFromBalance(getTotals().balance);
    }

    // ==========================================
    // UPDATE HOME
    // ==========================================
    function updateHome() {
        const { totalIncome, totalExpenses, balance } = getTotals();

        const cashExpenses = transactions
            .filter(t => t.type === 'expense' && t.paymentMethod === 'cash')
            .reduce((sum, t) => sum + t.amount, 0);

        const cardExpenses = transactions
            .filter(t => t.type === 'expense' && t.paymentMethod === 'card')
            .reduce((sum, t) => sum + t.amount, 0);

        incomeSplits = calculateSplitsFromBalance(balance);
        saveIncomeSplitsLocal();

        dom.totalBalance.textContent = formatMoneyWithCurrency(balance);
        dom.totalIncome.textContent = formatMoneyWithCurrency(totalIncome);
        dom.totalExpenses.textContent = formatMoneyWithCurrency(totalExpenses);

        dom.savingsAmount.textContent = formatMoneyWithCurrency(incomeSplits.savings);
        dom.expensesSplitAmount.textContent = formatMoneyWithCurrency(incomeSplits.expenses);
        dom.emergencyAmount.textContent = formatMoneyWithCurrency(incomeSplits.emergency);

        dom.cashTotal.textContent = formatMoneyWithCurrency(cashExpenses);
        dom.cardTotal.textContent = formatMoneyWithCurrency(cardExpenses);

        renderRecentTransactions();
    }

    // ==========================================
    // RENDER TRANSACTIONS
    // ==========================================
    function renderRecentTransactions() {
        const recent = transactions.slice(0, 10);

        if (recent.length === 0) {
            dom.recentTransactions.innerHTML = '';
            dom.recentTransactions.appendChild(createEmptyState());
            return;
        }

        dom.recentTransactions.innerHTML = '';
        recent.forEach((tx, index) => {
            const el = createTransactionElement(tx);
            el.style.animationDelay = `${index * 0.05}s`;
            dom.recentTransactions.appendChild(el);
        });
    }

    function createEmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p>لا توجد معاملات بعد</p>
            <span>ابدأ بإضافة دخل أو مصروف</span>
        `;
        return div;
    }

    function createTransactionElement(tx) {
        const div = document.createElement('div');
        div.className = 'transaction-item';

        if (tx.type === 'expense') {
            const cat = CATEGORIES[tx.category] || CATEGORIES.food;
            const paymentLabel = tx.paymentMethod === 'cash' ? 'كاش' : 'بطاقة';
            const paymentClass = tx.paymentMethod === 'cash' ? 'badge-cash' : 'badge-card';
            const dateFormatted = formatDate(tx.date);

            div.innerHTML = `
                <div class="transaction-icon expense-type">${cat.emoji}</div>
                <div class="transaction-info">
                    <div class="transaction-category">
                        ${cat.label}
                        <span class="payment-badge ${paymentClass}">${paymentLabel}</span>
                    </div>
                    <div class="transaction-desc">${tx.description || 'بدون وصف'}</div>
                    <span class="transaction-date-text">${dateFormatted}</span>
                </div>
                <div>
                    <span class="transaction-amount expense">-${formatMoney(tx.amount)}</span>
                </div>
                <button class="transaction-delete" data-id="${tx.id}" aria-label="حذف">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            `;
        } else {
            const dateFormatted = formatDate(tx.date);
            div.innerHTML = `
                <div class="transaction-icon income-type">💰</div>
                <div class="transaction-info">
                    <div class="transaction-category">دخل</div>
                    <div class="transaction-desc">${tx.description || 'بدون وصف'}</div>
                    <span class="transaction-date-text">${dateFormatted}</span>
                </div>
                <div>
                    <span class="transaction-amount income">+${formatMoney(tx.amount)}</span>
                </div>
                <button class="transaction-delete" data-id="${tx.id}" aria-label="حذف">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            `;
        }

        const deleteBtn = div.querySelector('.transaction-delete');
        deleteBtn.addEventListener('click', () => {
            deleteTargetId = tx.id;
            dom.deleteModal.classList.add('active');
        });

        return div;
    }

    function formatDate(dateStr) {
        const date = parseTransactionDate(dateStr) || new Date();
        const day = date.getDate();
        const month = MONTHS_AR[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    function parseTransactionDate(value) {
        if (!value) return null;

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return value;
        }

        const text = String(value).trim();
        if (!text) return null;

        const dateOnly = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (dateOnly) {
            return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
        }

        const isoDate = new Date(text);
        if (!Number.isNaN(isoDate.getTime())) {
            return isoDate;
        }

        const slashDate = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (slashDate) {
            return new Date(Number(slashDate[3]), Number(slashDate[2]) - 1, Number(slashDate[1]));
        }

        return null;
    }

    function isTransactionInSelectedMonth(transaction) {
        const date = parseTransactionDate(transaction.date);
        if (!date) return false;
        return date.getMonth() === analyticsMonth && date.getFullYear() === analyticsYear;
    }

    function getAnalyticsTransactions() {
        if (analyticsMode === 'all') return transactions;
        return transactions.filter(isTransactionInSelectedMonth);
    }

    // ==========================================
    // ANALYTICS
    // ==========================================
    function updateAnalytics() {
        const isAllMode = analyticsMode === 'all';
        dom.analyticsAllBtn.classList.toggle('active', isAllMode);
        dom.analyticsMonthBtn.classList.toggle('active', !isAllMode);
        dom.analyticsMonth.textContent = isAllMode ? 'كل الفترات' : `${MONTHS_AR[analyticsMonth]} ${analyticsYear}`;
        dom.spendingChartTitle.textContent = isAllMode ? 'الإنفاق حسب الشهر' : 'الإنفاق اليومي';

        const scopedTransactions = getAnalyticsTransactions();

        const monthIncome = scopedTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthExpenses = scopedTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthCash = scopedTransactions
            .filter(t => t.type === 'expense' && t.paymentMethod === 'cash')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthCard = scopedTransactions
            .filter(t => t.type === 'expense' && t.paymentMethod === 'card')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthBalance = monthIncome - monthExpenses;
        const monthSplits = calculateSplitsFromBalance(monthBalance);
        const monthSavings = monthSplits.savings;
        const monthExpensesSplit = monthSplits.expenses;
        const monthEmergency = monthSplits.emergency;

        dom.aTotalIncome.textContent = formatMoneyWithCurrency(monthIncome);
        dom.aTotalExpenses.textContent = formatMoneyWithCurrency(monthExpenses);
        dom.aBalance.textContent = formatMoneyWithCurrency(monthBalance);
        dom.aCashTotal.textContent = formatMoneyWithCurrency(monthCash);
        dom.aCardTotal.textContent = formatMoneyWithCurrency(monthCard);
        dom.aSavings.textContent = formatMoneyWithCurrency(monthSavings);
        dom.aExpensesSplit.textContent = formatMoneyWithCurrency(monthExpensesSplit);
        dom.aEmergency.textContent = formatMoneyWithCurrency(monthEmergency);

        updateCategoryChart(scopedTransactions);
        updatePaymentChart(monthCash, monthCard);
        updateIncomeDistChart(monthSavings, monthExpensesSplit, monthEmergency);
        updateSpendingTrendChart(scopedTransactions);
    }

    function updateCategoryChart(monthTransactions) {
        const expenses = monthTransactions.filter(t => t.type === 'expense');
        const categoryTotals = {};

        Object.keys(CATEGORIES).forEach(key => {
            categoryTotals[key] = expenses
                .filter(t => t.category === key)
                .reduce((sum, t) => sum + t.amount, 0);
        });

        const labels = [];
        const data = [];
        const colors = [];
        const legendHTML = [];

        Object.keys(CATEGORIES).forEach(key => {
            if (categoryTotals[key] > 0) {
                const cat = CATEGORIES[key];
                labels.push(cat.label);
                data.push(categoryTotals[key]);
                colors.push(cat.color);
                legendHTML.push(`
                    <div class="legend-item">
                        <span class="legend-dot" style="background:${cat.color}"></span>
                        <span>${cat.emoji} ${cat.label}</span>
                        <span class="legend-value">${formatMoney(categoryTotals[key])}</span>
                    </div>
                `);
            }
        });

        dom.categoryLegend.innerHTML = legendHTML.join('');

        const ctx = document.getElementById('category-chart').getContext('2d');
        if (categoryChart) categoryChart.destroy();

        if (data.length === 0) {
            data.push(1);
            labels.push('لا توجد بيانات');
            colors.push('#2a2a3e');
        }

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.95)', titleColor: '#f0f0f5', bodyColor: '#9090a8',
                        borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: 1, cornerRadius: 12, padding: 12,
                        titleFont: { family: 'Cairo', weight: '700' }, bodyFont: { family: 'Cairo' },
                        rtl: true, textDirection: 'rtl',
                    }
                }
            }
        });
    }

    function updatePaymentChart(cash, card) {
        const ctx = document.getElementById('payment-chart').getContext('2d');
        if (paymentChart) paymentChart.destroy();

        const data = (cash === 0 && card === 0) ? [1] : [cash, card];
        const labels = (cash === 0 && card === 0) ? ['لا توجد بيانات'] : ['كاش', 'بطاقة'];
        const colors = (cash === 0 && card === 0) ? ['#2a2a3e'] : ['#34d399', '#60a5fa'];

        paymentChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.95)', titleColor: '#f0f0f5', bodyColor: '#9090a8',
                        borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: 1, cornerRadius: 12, padding: 12,
                        titleFont: { family: 'Cairo', weight: '700' }, bodyFont: { family: 'Cairo' },
                        rtl: true, textDirection: 'rtl',
                    }
                }
            }
        });
    }

    function updateIncomeDistChart(savings, expenses, emergency) {
        const ctx = document.getElementById('income-chart').getContext('2d');
        if (incomeDistChart) incomeDistChart.destroy();

        const total = savings + expenses + emergency;
        const data = total === 0 ? [1] : [savings, expenses, emergency];
        const labels = total === 0 ? ['لا توجد بيانات'] : ['توفير', 'مصروفات', 'طوارئ'];
        const colors = total === 0 ? ['#2a2a3e'] : ['#60a5fa', '#34d399', '#fbbf24'];

        incomeDistChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.95)', titleColor: '#f0f0f5', bodyColor: '#9090a8',
                        borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: 1, cornerRadius: 12, padding: 12,
                        titleFont: { family: 'Cairo', weight: '700' }, bodyFont: { family: 'Cairo' },
                        rtl: true, textDirection: 'rtl',
                    }
                }
            }
        });
    }

    function updateSpendingTrendChart(scopedTransactions) {
        const ctx = document.getElementById('daily-chart').getContext('2d');
        if (dailyChart) dailyChart.destroy();

        if (analyticsMode === 'all') {
            updateMonthlySpendingChart(ctx, scopedTransactions);
            return;
        }

        updateDailyChart(ctx, scopedTransactions);
    }

    function updateMonthlySpendingChart(ctx, scopedTransactions) {
        const monthlyTotals = new Map();

        scopedTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const date = parseTransactionDate(t.date);
                if (!date) return;
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyTotals.set(key, (monthlyTotals.get(key) || 0) + t.amount);
            });

        const sorted = [...monthlyTotals.entries()].sort(([a], [b]) => a.localeCompare(b));
        const labels = sorted.length ? sorted.map(([key]) => {
            const [year, month] = key.split('-').map(Number);
            return `${MONTHS_AR[month - 1]} ${year}`;
        }) : ['لا توجد بيانات'];
        const values = sorted.length ? sorted.map(([, value]) => value) : [0];

        dailyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'المصروفات', data: values,
                    backgroundColor: 'rgba(139, 92, 246, 0.5)',
                    hoverBackgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderRadius: 4, borderSkipped: false,
                }]
            },
            options: getBarChartOptions()
        });
    }

    function updateDailyChart(ctx, monthTransactions) {
        const daysInMonth = new Date(analyticsYear, analyticsMonth + 1, 0).getDate();
        const dailyData = new Array(daysInMonth).fill(0);

        monthTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const date = parseTransactionDate(t.date);
                if (!date) return;
                const day = date.getDate();
                if (day >= 1 && day <= daysInMonth) {
                    dailyData[day - 1] += t.amount;
                }
            });

        const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

        dailyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'المصروفات', data: dailyData,
                    backgroundColor: 'rgba(139, 92, 246, 0.5)',
                    hoverBackgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderRadius: 4, borderSkipped: false,
                }]
            },
            options: getBarChartOptions()
        });
    }

    function getBarChartOptions() {
        return {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#5a5a72', font: { family: 'Cairo', size: 9 }, maxTicksLimit: 15 },
                        border: { display: false },
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        ticks: { color: '#5a5a72', font: { family: 'Cairo', size: 10 } },
                        border: { display: false }, beginAtZero: true,
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.95)', titleColor: '#f0f0f5', bodyColor: '#9090a8',
                        borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: 1, cornerRadius: 12, padding: 12,
                        titleFont: { family: 'Cairo', weight: '700' }, bodyFont: { family: 'Cairo' },
                        rtl: true, textDirection: 'rtl',
                        callbacks: {
                            title: (items) => `يوم ${items[0].label}`,
                            label: (item) => `المصروفات: ${formatMoney(item.raw)}`,
                        }
                    }
                }
            };
    }

    // ==========================================
    // UTILITIES
    // ==========================================
    function showToast(message, duration = 1800) {
        if (!dom.toast || !dom.toastMessage) return;

        if (toastTimer) {
            clearTimeout(toastTimer);
            toastTimer = null;
        }

        dom.toastMessage.textContent = message;
        dom.toast.hidden = false;
        dom.toast.classList.remove('show', 'hiding');
        dom.toast.setAttribute('aria-hidden', 'false');
        dom.toast.offsetHeight;
        dom.toast.classList.add('show');

        toastTimer = setTimeout(() => {
            hideToast();
        }, duration);
    }

    function hideToast() {
        if (!dom.toast) return;

        dom.toast.classList.remove('show');
        dom.toast.classList.add('hiding');
        dom.toast.setAttribute('aria-hidden', 'true');

        if (toastTimer) {
            clearTimeout(toastTimer);
            toastTimer = null;
        }

        setTimeout(() => {
            if (dom.toast) {
                dom.toast.classList.remove('hiding');
                dom.toast.hidden = true;
            }
        }, 350);
    }

    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
    }

    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // ==========================================
    // BOOT
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
