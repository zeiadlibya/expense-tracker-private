/* ============================================
   EXPENSE TRACKER - APPLICATION LOGIC
   مع دعم Google Sheets كقاعدة بيانات
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const SUPABASE_URL = "https://gtqxewzvhxhfnumdsgyj.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Go8b9K2xCi2aIybRvwrMSw_0etxTUsd";

    function hasSupabaseConfig() {
        return (
            SUPABASE_URL &&
            SUPABASE_PUBLISHABLE_KEY &&
            SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
            SUPABASE_PUBLISHABLE_KEY !== "YOUR_SUPABASE_PUBLISHABLE_KEY"
        );
    }

    const supabaseClient = (
        window.supabase && hasSupabaseConfig()
            ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
            : null
    );

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
    const DEFAULT_USER_SETTINGS = {
        currency: 'LYD',
        theme: 'light',
        expenses_percentage: 50,
        savings_percentage: 30,
        emergency_percentage: 20,
    };
    const DEFAULT_WALLET_BALANCES = {
        expenses_balance: 0,
        savings_balance: 0,
        emergency_balance: 0,
        total_income: 0,
        total_spent: 0,
    };
    const CURRENCY_LABELS = {
        LYD: 'د.ل',
        SAR: 'ر.س',
        AED: 'د.إ',
        USD: '$',
        EUR: '€',
    };
    const WALLET_LABELS = {
        expenses: 'المصروفات',
        savings: 'الادخار',
        emergency: 'الطوارئ',
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
    let transactions = [];
    let incomeSplits = { savings: 0, expenses: 0, emergency: 0 };
    let userSettings = { ...DEFAULT_USER_SETTINGS };
    let walletBalances = { ...DEFAULT_WALLET_BALANCES };
    let analyticsMode = 'all';
    let analyticsMonth = new Date().getMonth();
    let analyticsYear = new Date().getFullYear();
    let deleteTargetId = null;
    let isSyncing = false;
    let toastTimer = null;
    let authUser = null;
    let appFlowStarted = false;
    let authMode = 'login';
    let authStateListenerAttached = false;

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

    async function initializeFinancialData() {
        await loadUserSettings();
        await loadWalletBalances();
        await loadRecentRecords();
        updateHome();
        updateAnalytics();
    }

    async function loadUserSettings() {
        if (!supabaseClient) return userSettings;
        const userId = requireFinancialUser();

        const { data, error } = await supabaseClient
            .from('user_settings')
            .select('expenses_percentage, savings_percentage, emergency_percentage, currency, theme')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            const defaults = { user_id: userId, ...DEFAULT_USER_SETTINGS };
            const { data: inserted, error: insertError } = await supabaseClient
                .from('user_settings')
                .insert(defaults)
                .select('expenses_percentage, savings_percentage, emergency_percentage, currency, theme')
                .single();

            if (insertError) throw insertError;
            userSettings = normalizeUserSettings(inserted || defaults);
        } else {
            userSettings = normalizeUserSettings(data);
        }

        currency = getCurrencyDisplay(userSettings.currency);
        if (dom.currencySelect) {
            dom.currencySelect.value = currency;
        }
        updateDistributionSummary();
        updateCurrencyBadges();
        return userSettings;
    }

    async function saveUserSettings(nextSettings) {
        if (!supabaseClient) return null;
        const userId = requireFinancialUser();

        const payload = {
            user_id: userId,
            currency: nextSettings.currency || userSettings.currency || DEFAULT_USER_SETTINGS.currency,
            theme: nextSettings.theme || userSettings.theme || DEFAULT_USER_SETTINGS.theme,
            expenses_percentage: Number(nextSettings.expenses_percentage),
            savings_percentage: Number(nextSettings.savings_percentage),
            emergency_percentage: Number(nextSettings.emergency_percentage),
        };

        let { data, error } = await supabaseClient
            .from('user_settings')
            .update(payload)
            .eq('user_id', userId)
            .select('expenses_percentage, savings_percentage, emergency_percentage, currency, theme')
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            const insertResult = await supabaseClient
                .from('user_settings')
                .insert(payload)
                .select('expenses_percentage, savings_percentage, emergency_percentage, currency, theme')
                .single();

            if (insertResult.error) throw insertResult.error;
            data = insertResult.data;
        }

        userSettings = normalizeUserSettings(data || payload);
        currency = getCurrencyDisplay(userSettings.currency);
        if (dom.currencySelect) {
            dom.currencySelect.value = currency;
        }
        updateDistributionSummary();
        updateCurrencyBadges();
        return userSettings;
    }

    async function loadWalletBalances() {
        if (!supabaseClient) return walletBalances;
        const userId = requireFinancialUser();

        const { data, error } = await supabaseClient
            .from('wallet_balances')
            .select('expenses_balance, savings_balance, emergency_balance, total_income, total_spent')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            const defaults = { user_id: userId, ...DEFAULT_WALLET_BALANCES };
            const { data: inserted, error: insertError } = await supabaseClient
                .from('wallet_balances')
                .insert(defaults)
                .select('expenses_balance, savings_balance, emergency_balance, total_income, total_spent')
                .single();

            if (insertError) throw insertError;
            walletBalances = normalizeWalletBalances(inserted || defaults);
        } else {
            walletBalances = normalizeWalletBalances(data);
        }

        return walletBalances;
    }

    async function saveWalletBalances(nextBalances) {
        if (!supabaseClient) return null;
        const userId = requireFinancialUser();
        const payload = {
            user_id: userId,
            expenses_balance: Number(nextBalances.expenses_balance || 0),
            savings_balance: Number(nextBalances.savings_balance || 0),
            emergency_balance: Number(nextBalances.emergency_balance || 0),
            total_income: Number(nextBalances.total_income || 0),
            total_spent: Number(nextBalances.total_spent || 0),
        };

        let { data, error } = await supabaseClient
            .from('wallet_balances')
            .update(payload)
            .eq('user_id', userId)
            .select('expenses_balance, savings_balance, emergency_balance, total_income, total_spent')
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            const insertResult = await supabaseClient
                .from('wallet_balances')
                .insert(payload)
                .select('expenses_balance, savings_balance, emergency_balance, total_income, total_spent')
                .single();

            if (insertResult.error) throw insertResult.error;
            data = insertResult.data;
        }

        walletBalances = normalizeWalletBalances(data || payload);
        return walletBalances;
    }

    async function loadRecentRecords() {
        if (!supabaseClient) return transactions;
        const userId = requireFinancialUser();

        const [incomeResult, expenseResult] = await Promise.all([
            supabaseClient
                .from('incomes')
                .select('id, amount, note, income_date, expenses_amount, savings_amount, emergency_amount, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50),
            supabaseClient
                .from('transactions')
                .select('id, amount, category, source_wallet, payment_method, note, transaction_date, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50),
        ]);

        if (incomeResult.error) throw incomeResult.error;
        if (expenseResult.error) throw expenseResult.error;

        const incomes = (incomeResult.data || []).map(normalizeIncomeRecord);
        const expenses = (expenseResult.data || []).map(normalizeExpenseRecord);

        transactions = [...incomes, ...expenses]
            .sort((a, b) => getCreatedTime(b) - getCreatedTime(a));

        return transactions;
    }

    function normalizeUserSettings(settings = {}) {
        return {
            currency: settings.currency || DEFAULT_USER_SETTINGS.currency,
            theme: settings.theme || DEFAULT_USER_SETTINGS.theme,
            expenses_percentage: Number(settings.expenses_percentage ?? DEFAULT_USER_SETTINGS.expenses_percentage),
            savings_percentage: Number(settings.savings_percentage ?? DEFAULT_USER_SETTINGS.savings_percentage),
            emergency_percentage: Number(settings.emergency_percentage ?? DEFAULT_USER_SETTINGS.emergency_percentage),
        };
    }

    function normalizeWalletBalances(balances = {}) {
        return {
            expenses_balance: Number(balances.expenses_balance || 0),
            savings_balance: Number(balances.savings_balance || 0),
            emergency_balance: Number(balances.emergency_balance || 0),
            total_income: Number(balances.total_income || 0),
            total_spent: Number(balances.total_spent || 0),
        };
    }

    function normalizeIncomeRecord(row) {
        return {
            id: row.id,
            type: 'income',
            amount: Number(row.amount || 0),
            description: row.note || '',
            date: row.income_date,
            createdAt: row.created_at,
            expensesAmount: Number(row.expenses_amount || 0),
            savingsAmount: Number(row.savings_amount || 0),
            emergencyAmount: Number(row.emergency_amount || 0),
        };
    }

    function normalizeExpenseRecord(row) {
        return {
            id: row.id,
            type: 'expense',
            amount: Number(row.amount || 0),
            description: row.note || '',
            category: row.category || 'food',
            sourceWallet: row.source_wallet || 'expenses',
            paymentMethod: row.payment_method || 'cash',
            date: row.transaction_date,
            createdAt: row.created_at,
        };
    }

    function getCreatedTime(record) {
        const value = record.createdAt || record.created_at || record.date;
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? 0 : time;
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function getCurrentUserId() {
        return authUser && authUser.id ? authUser.id : null;
    }

    function requireFinancialUser() {
        const userId = getCurrentUserId();
        if (!userId) {
            showToast('يرجى تسجيل الدخول أولاً');
            throw new Error('Missing authenticated user');
        }
        return userId;
    }

    function getCurrencyDisplay(value = currency) {
        return CURRENCY_LABELS[value] || value || 'د.ل';
    }

    function formatMoney(amount) {
        const num = parseFloat(amount) || 0;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatMoneyWithCurrency(amount) {
        return formatMoney(amount) + ' ' + getCurrencyDisplay();
    }

    // ==========================================
    // DOM REFERENCES
    // ==========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        authScreen: $('#auth-screen'),
        authForm: $('#auth-form'),
        authTitle: $('#auth-title'),
        authSubtitle: $('#auth-subtitle'),
        authEmail: $('#auth-email'),
        authPassword: $('#auth-password'),
        authLoginBtn: $('#auth-login-btn'),
        authSignupBtn: $('#auth-signup-btn'),
        authMessage: $('#auth-message'),
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
        distributionSummary: $('#distribution-summary'),
        editDistributionBtn: $('#edit-distribution-btn'),
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
        sourceWalletToggle: $('#source-wallet-toggle'),
        addExpenseBtn: $('#add-expense-btn'),

        // Income Form
        incomeAmount: $('#income-amount'),
        incomeDesc: $('#income-desc'),
        incomeDate: $('#income-date'),
        incomeSplitNote: $('#income-split-note'),
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
        accountEmail: $('#account-email'),
        logoutBtn: $('#logout-btn'),

        // Distribution modal
        distributionModal: $('#distribution-modal'),
        closeDistribution: $('#close-distribution'),
        cancelDistribution: $('#cancel-distribution'),
        saveDistributionBtn: $('#save-distribution-btn'),
        distributionExpenses: $('#distribution-expenses'),
        distributionSavings: $('#distribution-savings'),
        distributionEmergency: $('#distribution-emergency'),
        distributionError: $('#distribution-error'),

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
        bindAuthEvents();

        // Update all views
        updateHome();

        initAuth();
    }

    function bindAuthEvents() {
        if (!dom.authForm || !dom.authSignupBtn || !dom.logoutBtn) return;

        dom.authForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (authMode === 'signup') {
                signUpWithEmail();
                return;
            }

            signInWithEmail();
        });

        dom.authSignupBtn.addEventListener('click', () => {
            updateAuthMode(authMode === 'login' ? 'signup' : 'login');
        });

        dom.logoutBtn.addEventListener('click', () => {
            signOutUser();
        });
    }

    async function initAuth() {
        if (!supabaseClient) {
            showAuthOnly('أضف رابط Supabase والمفتاح العام في ملف app.js أولاً.', 'error');
            updateAccountUI(null);
            return;
        }

        try {
            attachAuthStateListener();

            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;

            const session = data && data.session;
            if (session && session.user) {
                await handleAuthenticatedUser(session.user);
            } else {
                showAuthOnly();
                updateAccountUI(null);
            }
        } catch (error) {
            console.error('Supabase auth init failed:', error);
            showAuthOnly(`تعذر الاتصال بـ Supabase: ${getReadableSupabaseError(error)}`, 'error');
            updateAccountUI(null);
        }
    }

    function attachAuthStateListener() {
        if (authStateListenerAttached || !supabaseClient) return;
        authStateListenerAttached = true;

        supabaseClient.auth.onAuthStateChange(async (event, sessionState) => {
            if (sessionState && sessionState.user) {
                await handleAuthenticatedUser(sessionState.user);
                return;
            }

            authUser = null;
            appFlowStarted = false;
            transactions = [];
            walletBalances = { ...DEFAULT_WALLET_BALANCES };
            userSettings = { ...DEFAULT_USER_SETTINGS };
            updateAccountUI(null);
            showAuthOnly(
                event === 'SIGNED_OUT' ? 'تم تسجيل الخروج بنجاح.' : '',
                event === 'SIGNED_OUT' ? 'success' : ''
            );
        });
    }

    async function handleAuthenticatedUser(user) {
        authUser = user;
        updateAccountUI(authUser);

        try {
            await initializeFinancialData();
            startAuthenticatedFlow();
        } catch (error) {
            console.error('Financial data load failed:', error);
            showAuthOnly(`تم تسجيل الدخول، لكن تعذر تحميل البيانات المالية: ${getReadableSupabaseError(error)}`, 'error');
        }
    }

    function getReadableSupabaseError(error) {
        const message = error && error.message ? error.message : '';
        const code = error && error.code ? ` (${error.code})` : '';
        const normalized = message.toLowerCase();

        if (normalized.includes('row-level security') || normalized.includes('rls')) {
            return 'راجع سياسات RLS للجداول المالية.';
        }

        if (normalized.includes('permission denied') || normalized.includes('violates row-level security')) {
            return 'لا توجد صلاحية كافية لإضافة أو قراءة بيانات هذا المستخدم.';
        }

        if (normalized.includes('relation') && normalized.includes('does not exist')) {
            return 'أحد الجداول المالية غير موجود أو اسمه مختلف.';
        }

        if (normalized.includes('column') && normalized.includes('does not exist')) {
            return 'أحد أسماء الأعمدة في Supabase مختلف عن الكود.';
        }

        if (message) return `${message}${code}`;
        return 'راجع الجداول وسياسات RLS في Supabase.';
    }

    async function signUpWithEmail() {
        if (!supabaseClient || !validateAuthInputs()) return;

        setAuthLoading(true);
        setAuthMessage('');

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: dom.authEmail.value.trim(),
                password: dom.authPassword.value,
            });

            if (error) throw error;

            if (data && data.session && data.session.user) {
                setAuthMessage('تم إنشاء الحساب وتسجيل الدخول بنجاح.', 'success');
            } else {
                setAuthMessage('تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا طلب Supabase التأكيد.', 'success');
            }
        } catch (error) {
            setAuthMessage(translateAuthError(error), 'error');
        } finally {
            setAuthLoading(false);
        }
    }

    async function signInWithEmail() {
        if (!supabaseClient || !validateAuthInputs()) return;

        setAuthLoading(true);
        setAuthMessage('');

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: dom.authEmail.value.trim(),
                password: dom.authPassword.value,
            });

            if (error) throw error;
            setAuthMessage('تم تسجيل الدخول بنجاح.', 'success');
        } catch (error) {
            setAuthMessage(translateAuthError(error), 'error');
        } finally {
            setAuthLoading(false);
        }
    }

    async function signOutUser() {
        if (!supabaseClient) return;

        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
        } catch (error) {
            showToast('تعذر تسجيل الخروج. حاول مرة أخرى.');
        }
    }

    function validateAuthInputs() {
        const email = dom.authEmail ? dom.authEmail.value.trim() : '';
        const password = dom.authPassword ? dom.authPassword.value : '';

        if (!email || !password) {
            setAuthMessage('أدخل البريد الإلكتروني وكلمة المرور.', 'error');
            return false;
        }

        if (password.length < 6) {
            setAuthMessage('كلمة المرور يجب أن تكون 6 أحرف أو أكثر.', 'error');
            return false;
        }

        return true;
    }

    function showAuthOnly(message = '', type = '') {
        updateAuthMode('login', { keepMessage: true });
        if (dom.splash) dom.splash.classList.add('hidden');
        if (dom.lockScreen) {
            dom.lockScreen.classList.add('hidden');
            dom.lockScreen.hidden = true;
        }
        if (dom.app) dom.app.classList.add('hidden');
        if (dom.authScreen) {
            dom.authScreen.classList.remove('hidden');
            dom.authScreen.hidden = false;
        }
        setAuthMessage(message, type);
        setTimeout(() => {
            if (dom.authEmail) dom.authEmail.focus();
        }, 120);
    }

    function startAuthenticatedFlow() {
        if (dom.authScreen) {
            dom.authScreen.classList.add('hidden');
            dom.authScreen.hidden = true;
        }

        if (appFlowStarted) return;
        appFlowStarted = true;

        if (dom.splash) dom.splash.classList.remove('hidden');

        setTimeout(() => {
            if (dom.splash) dom.splash.classList.add('hidden');
            showLockScreen();
        }, 700);
    }

    function updateAccountUI(user) {
        if (!dom.accountEmail) return;

        dom.accountEmail.textContent = user && user.email ? user.email : 'غير مسجل';
        if (dom.logoutBtn) {
            dom.logoutBtn.hidden = !user;
        }
    }

    function updateDistributionSummary() {
        const text = `توزيع الدخل الحالي: ${userSettings.expenses_percentage}% مصروفات - ${userSettings.savings_percentage}% ادخار - ${userSettings.emergency_percentage}% طوارئ`;
        if (dom.distributionSummary) {
            dom.distributionSummary.textContent = text;
        }
        if (dom.incomeSplitNote) {
            dom.incomeSplitNote.textContent = text;
        }
    }

    function updateCurrencyBadges() {
        document.querySelectorAll('.currency-badge').forEach((badge) => {
            badge.textContent = getCurrencyDisplay();
        });
    }

    function openDistributionModal() {
        if (!dom.distributionModal) return;
        dom.distributionExpenses.value = userSettings.expenses_percentage;
        dom.distributionSavings.value = userSettings.savings_percentage;
        dom.distributionEmergency.value = userSettings.emergency_percentage;
        dom.distributionError.textContent = '';
        dom.distributionModal.classList.add('active');
    }

    function closeDistributionModal() {
        if (!dom.distributionModal) return;
        dom.distributionModal.classList.remove('active');
    }

    async function handleSaveDistribution() {
        const expensesPercentage = Number(dom.distributionExpenses.value);
        const savingsPercentage = Number(dom.distributionSavings.value);
        const emergencyPercentage = Number(dom.distributionEmergency.value);
        const values = [expensesPercentage, savingsPercentage, emergencyPercentage];

        const invalid = values.some((value) => Number.isNaN(value) || value < 0);
        const total = expensesPercentage + savingsPercentage + emergencyPercentage;

        if (invalid || total !== 100) {
            dom.distributionError.textContent = 'يجب أن يكون مجموع النسب 100%';
            return;
        }

        try {
            dom.saveDistributionBtn.disabled = true;
            await saveUserSettings({
                ...userSettings,
                expenses_percentage: expensesPercentage,
                savings_percentage: savingsPercentage,
                emergency_percentage: emergencyPercentage,
            });
            closeDistributionModal();
            showToast('تم حفظ توزيع الدخل');
        } catch (error) {
            console.error('Failed to save distribution:', error);
            dom.distributionError.textContent = 'تعذر حفظ النسب. حاول مرة أخرى.';
        } finally {
            dom.saveDistributionBtn.disabled = false;
        }
    }

    function updateAuthMode(mode, options = {}) {
        authMode = mode === 'signup' ? 'signup' : 'login';

        const isSignup = authMode === 'signup';
        if (dom.authTitle) {
            dom.authTitle.textContent = isSignup ? 'إنشاء حساب Cashgo' : 'Cashgo';
        }
        if (dom.authSubtitle) {
            dom.authSubtitle.textContent = isSignup
                ? 'أنشئ حسابك لحفظ بياناتك بأمان'
                : 'إدارة مصروفاتك اليومية بسهولة';
        }
        if (dom.authPassword) {
            dom.authPassword.autocomplete = isSignup ? 'new-password' : 'current-password';
        }
        if (dom.authLoginBtn) {
            dom.authLoginBtn.textContent = isSignup ? 'إنشاء الحساب' : 'تسجيل الدخول';
        }
        if (dom.authSignupBtn) {
            dom.authSignupBtn.textContent = isSignup ? 'لدي حساب بالفعل' : 'إنشاء حساب';
        }

        if (!options.keepMessage) {
            setAuthMessage('');
        }
    }

    function setAuthLoading(isLoading) {
        [dom.authLoginBtn, dom.authSignupBtn].forEach((btn) => {
            if (!btn) return;
            btn.disabled = isLoading;
        });

        if (dom.authLoginBtn) {
            dom.authLoginBtn.textContent = isLoading
                ? 'جارِ المعالجة...'
                : (authMode === 'signup' ? 'إنشاء الحساب' : 'تسجيل الدخول');
        }
    }

    function setAuthMessage(message, type = '') {
        if (!dom.authMessage) return;

        dom.authMessage.textContent = message || '';
        dom.authMessage.classList.remove('success', 'error');
        if (type) dom.authMessage.classList.add(type);
    }

    function translateAuthError(error) {
        const message = error && error.message ? error.message : '';
        const normalized = message.toLowerCase();

        if (normalized.includes('invalid login credentials')) {
            return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        }

        if (normalized.includes('email not confirmed')) {
            return 'يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول.';
        }

        if (normalized.includes('already registered') || normalized.includes('user already registered')) {
            return 'هذا البريد الإلكتروني مسجل بالفعل.';
        }

        return 'حدث خطأ في تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.';
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
        updateHome();
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

        if (dom.sourceWalletToggle) {
            dom.sourceWalletToggle.addEventListener('click', (e) => {
                const btn = e.target.closest('.wallet-btn');
                if (!btn) return;
                dom.sourceWalletToggle.querySelectorAll('.wallet-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        }

        // Add expense
        dom.addExpenseBtn.addEventListener('click', addExpense);

        // Add income
        dom.addIncomeBtn.addEventListener('click', addIncome);

        if (dom.editDistributionBtn) {
            dom.editDistributionBtn.addEventListener('click', openDistributionModal);
        }

        if (dom.closeDistribution) {
            dom.closeDistribution.addEventListener('click', closeDistributionModal);
        }

        if (dom.cancelDistribution) {
            dom.cancelDistribution.addEventListener('click', closeDistributionModal);
        }

        if (dom.distributionModal) {
            dom.distributionModal.addEventListener('click', (e) => {
                if (e.target === dom.distributionModal) closeDistributionModal();
            });
        }

        if (dom.saveDistributionBtn) {
            dom.saveDistributionBtn.addEventListener('click', handleSaveDistribution);
        }

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

        dom.currencySelect.addEventListener('change', async () => {
            currency = dom.currencySelect.value;
            saveCurrency();
            if (authUser) {
                try {
                    await saveUserSettings({ ...userSettings, currency });
                } catch (error) {
                    console.error('Failed to save currency:', error);
                    showToast('تعذر حفظ العملة');
                }
            }
            updateHome();
            updateAnalytics();
        });

        if (dom.saveSheetUrlBtn) {
            dom.saveSheetUrlBtn.addEventListener('click', () => {
                showToast('تم إيقاف Google Sheets. البيانات المالية محفوظة في Supabase الآن.');
            });
        }

        if (dom.cloudSyncBtn) {
            dom.cloudSyncBtn.addEventListener('click', () => {
                showToast('تم إيقاف Google Sheets. البيانات المالية محفوظة في Supabase الآن.');
            });
        }

        dom.clearDataBtn.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                try {
                    const userId = requireFinancialUser();
                    const [incomeDelete, expenseDelete] = await Promise.all([
                        supabaseClient.from('incomes').delete().eq('user_id', userId),
                        supabaseClient.from('transactions').delete().eq('user_id', userId),
                    ]);

                    if (incomeDelete.error) throw incomeDelete.error;
                    if (expenseDelete.error) throw expenseDelete.error;

                    transactions = [];
                    await saveWalletBalances({ ...DEFAULT_WALLET_BALANCES });
                    updateHome();
                    updateAnalytics();
                    dom.settingsModal.classList.remove('active');
                    showToast('تم مسح جميع البيانات');
                } catch (error) {
                    console.error('Failed to clear data:', error);
                    showToast('تعذر مسح البيانات. حاول مرة أخرى');
                }
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
                showToast('تم إيقاف Google Sheets. البيانات المالية محفوظة في Supabase الآن.');
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
        const activeWallet = dom.sourceWalletToggle
            ? dom.sourceWalletToggle.querySelector('.wallet-btn.active')
            : null;
        const sourceWallet = activeWallet ? activeWallet.dataset.wallet : 'expenses';
        const currentBalance = Number(walletBalances[`${sourceWallet}_balance`] || 0);

        if (amount > currentBalance) {
            showToast('الرصيد غير كافٍ في هذه الخانة');
            return;
        }

        const userId = requireFinancialUser();
        const expenseDate = dom.expenseDate.value || new Date().toISOString().split('T')[0];
        const category = activeCategory ? activeCategory.dataset.category : 'food';
        const paymentMethod = activePayment ? activePayment.dataset.method : 'cash';

        try {
            dom.addExpenseBtn.disabled = true;

            const { error } = await supabaseClient
                .from('transactions')
                .insert({
                    user_id: userId,
                    amount,
                    category,
                    source_wallet: sourceWallet,
                    payment_method: paymentMethod,
                    note: dom.expenseDesc.value.trim(),
                    transaction_date: expenseDate,
                });

            if (error) throw error;

            const nextBalances = {
                ...walletBalances,
                [`${sourceWallet}_balance`]: currentBalance - amount,
                total_spent: Number(walletBalances.total_spent || 0) + amount,
            };

            await saveWalletBalances(nextBalances);
            await loadRecentRecords();
            updateHome();

            dom.expenseAmount.value = '';
            dom.expenseDesc.value = '';

            showToast('تمت إضافة المصروف بنجاح');
            setTimeout(() => navigateTo('home'), 500);
        } catch (error) {
            console.error('Failed to add expense:', error);
            showToast('تعذر إضافة المصروف. حاول مرة أخرى');
        } finally {
            dom.addExpenseBtn.disabled = false;
        }
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

        const userId = requireFinancialUser();
        const expensesAmount = amount * Number(userSettings.expenses_percentage || 0) / 100;
        const savingsAmount = amount * Number(userSettings.savings_percentage || 0) / 100;
        const emergencyAmount = amount * Number(userSettings.emergency_percentage || 0) / 100;
        const incomeDate = dom.incomeDate.value || new Date().toISOString().split('T')[0];

        try {
            dom.addIncomeBtn.disabled = true;

            const { error } = await supabaseClient
                .from('incomes')
                .insert({
                    user_id: userId,
                    amount,
                    note: dom.incomeDesc.value.trim(),
                    income_date: incomeDate,
                    expenses_amount: expensesAmount,
                    savings_amount: savingsAmount,
                    emergency_amount: emergencyAmount,
                });

            if (error) throw error;

            await saveWalletBalances({
                expenses_balance: Number(walletBalances.expenses_balance || 0) + expensesAmount,
                savings_balance: Number(walletBalances.savings_balance || 0) + savingsAmount,
                emergency_balance: Number(walletBalances.emergency_balance || 0) + emergencyAmount,
                total_income: Number(walletBalances.total_income || 0) + amount,
                total_spent: Number(walletBalances.total_spent || 0),
            });

            await loadRecentRecords();
            updateHome();

            dom.incomeAmount.value = '';
            dom.incomeDesc.value = '';

            showToast('تمت إضافة الدخل وتوزيعه بنجاح');
            setTimeout(() => navigateTo('home'), 500);
        } catch (error) {
            console.error('Failed to add income:', error);
            showToast('تعذر إضافة الدخل. حاول مرة أخرى');
        } finally {
            dom.addIncomeBtn.disabled = false;
        }
    }

    // ==========================================
    // DELETE TRANSACTION
    // ==========================================
    async function deleteTransaction(id) {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        try {
            if (tx.type === 'income') {
                const { error } = await supabaseClient
                    .from('incomes')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', requireFinancialUser());

                if (error) throw error;

                await saveWalletBalances({
                    expenses_balance: Number(walletBalances.expenses_balance || 0) - Number(tx.expensesAmount || 0),
                    savings_balance: Number(walletBalances.savings_balance || 0) - Number(tx.savingsAmount || 0),
                    emergency_balance: Number(walletBalances.emergency_balance || 0) - Number(tx.emergencyAmount || 0),
                    total_income: Number(walletBalances.total_income || 0) - Number(tx.amount || 0),
                    total_spent: Number(walletBalances.total_spent || 0),
                });
            } else {
                const { error } = await supabaseClient
                    .from('transactions')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', requireFinancialUser());

                if (error) throw error;

                const sourceWallet = tx.sourceWallet || 'expenses';
                await saveWalletBalances({
                    ...walletBalances,
                    [`${sourceWallet}_balance`]: Number(walletBalances[`${sourceWallet}_balance`] || 0) + Number(tx.amount || 0),
                    total_spent: Math.max(0, Number(walletBalances.total_spent || 0) - Number(tx.amount || 0)),
                });
            }

            await loadRecentRecords();
            updateHome();
            showToast('تم حذف المعاملة');
        } catch (error) {
            console.error('Failed to delete record:', error);
            showToast('تعذر حذف المعاملة. حاول مرة أخرى');
        }
    }

    // ==========================================
    // FIXED WALLET SPLITS
    // ==========================================
    function getTotals() {
        const totalIncome = Number(walletBalances.total_income || 0);
        const totalExpenses = Number(walletBalances.total_spent || 0);
        const balance =
            Number(walletBalances.expenses_balance || 0) +
            Number(walletBalances.savings_balance || 0) +
            Number(walletBalances.emergency_balance || 0);

        return { totalIncome, totalExpenses, balance };
    }

    function calculateSplitsFromBalance(balance) {
        const available = Math.max(0, balance);

        return {
            savings: available * Number(userSettings.savings_percentage || 0) / 100,
            expenses: available * Number(userSettings.expenses_percentage || 0) / 100,
            emergency: available * Number(userSettings.emergency_percentage || 0) / 100,
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

        dom.totalBalance.textContent = formatMoneyWithCurrency(balance);
        dom.totalIncome.textContent = formatMoneyWithCurrency(totalIncome);
        dom.totalExpenses.textContent = formatMoneyWithCurrency(totalExpenses);

        dom.savingsAmount.textContent = formatMoneyWithCurrency(walletBalances.savings_balance);
        dom.expensesSplitAmount.textContent = formatMoneyWithCurrency(walletBalances.expenses_balance);
        dom.emergencyAmount.textContent = formatMoneyWithCurrency(walletBalances.emergency_balance);

        dom.cashTotal.textContent = formatMoneyWithCurrency(cashExpenses);
        dom.cardTotal.textContent = formatMoneyWithCurrency(cardExpenses);
        updateDistributionSummary();

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
            const walletLabel = WALLET_LABELS[tx.sourceWallet] || WALLET_LABELS.expenses;
            const dateFormatted = formatDate(tx.date);

            div.innerHTML = `
                <div class="transaction-icon expense-type">${cat.emoji}</div>
                <div class="transaction-info">
                    <div class="transaction-category">
                        ${cat.label}
                        <span class="payment-badge ${paymentClass}">${paymentLabel}</span>
                        <span class="payment-badge badge-wallet">${walletLabel}</span>
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
        const monthSavings = scopedTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.savingsAmount || 0), 0);
        const monthExpensesSplit = scopedTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.expensesAmount || 0), 0);
        const monthEmergency = scopedTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.emergencyAmount || 0), 0);

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
        const labels = total === 0 ? ['لا توجد بيانات'] : ['ادخار', 'مصروفات', 'طوارئ'];
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
