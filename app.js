/* ============================================
   EXPENSE TRACKER - APPLICATION LOGIC
   Supabase financial source of truth
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const SUPABASE_URL = "https://gtqxewzvhxhfnumdsgyj.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Go8b9K2xCi2aIybRvwrMSw_0etxTUsd";
    const ADMIN_EMAIL = 'zeiadlibya@gmail.com';

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
        CURRENCY: 'wallet_currency',
        UI_THEME: 'cashgo_ui_theme',
        UI_COLOR_THEME: 'cashgo_ui_color_theme',
        UI_LANGUAGE: 'cashgo_ui_language',
        DEMO_DATA: 'cashgo_demo_data',
        DEMO_ACTION_COUNT: 'cashgo_demo_action_count',
    };
    const SUPPORTED_LANGUAGES = ['ar', 'en'];
    const TEXT_TRANSLATIONS = {
        'محفظتي - إدارة المصروفات والدخل': 'Cashgo - Expense and Income Manager',
        'إدارة مصروفاتك اليومية بسهولة': 'Manage your daily expenses easily',
        'البريد الإلكتروني': 'Email',
        'كلمة المرور': 'Password',
        'تسجيل الدخول': 'Log in',
        'إنشاء حساب': 'Create account',
        'إنشاء الحساب': 'Create account',
        'تسجيل الدخول باستخدام Google': 'Sign in with Google',
        'متابعة التجربة': 'Continue demo',
        'إدارة ذكية لأموالك': 'Smart money management',
        'محفظتي': 'My Wallet',
        'أنت تستخدم Cashgo كتجربة. سجّل دخولك لحفظ بياناتك والرجوع لها من أي جهاز.': 'You are using Cashgo in demo mode. Log in to save your data and access it from any device.',
        'حفظ بياناتي': 'Save my data',
        'الرصيد الإجمالي': 'Total balance',
        'الدخل': 'Income',
        'المصروفات': 'Expenses',
        'أرصدة المحافظ': 'Wallet balances',
        'رصيد الادخار': 'Savings balance',
        'رصيد المصروفات': 'Expenses balance',
        'رصيد الطوارئ': 'Emergency balance',
        'توزيع الدخل الحالي': 'Current income distribution',
        'تعديل توزيع الدخل': 'Edit income distribution',
        'تحويل بين المحافظ': 'Transfer between wallets',
        'المصروفات حسب طريقة الدفع': 'Expenses by payment method',
        'كاش': 'Cash',
        'بطاقة': 'Card',
        'آخر المعاملات': 'Recent transactions',
        'عرض الكل': 'View all',
        'لا توجد معاملات بعد': 'No transactions yet',
        'ابدأ بإضافة دخل أو مصروف': 'Start by adding income or an expense',
        'إضافة مصروف': 'Add expense',
        'سجل مصروفاتك بسهولة وسرعة': 'Record your expenses easily and quickly',
        'المبلغ': 'Amount',
        'د.ل': 'LYD',
        'الوصف (اختياري)': 'Description (optional)',
        'نوع المصروف': 'Expense category',
        'غذائية': 'Food',
        'دخان': 'Smoking',
        'ترفيه': 'Entertainment',
        'عناية شخصية': 'Personal care',
        'التزامات اسرية': 'Family commitments',
        'طريقة الدفع': 'Payment method',
        'مصدر المصروف': 'Expense source',
        'الادخار': 'Savings',
        'الطوارئ': 'Emergency',
        'تقسيم المصروف على أكثر من محفظة': 'Split expense across wallets',
        'التاريخ': 'Date',
        'إضافة المصروف': 'Add expense',
        'إضافة دخل': 'Add income',
        'سجل دخلك وحدد نسب التوزيع': 'Record income and set distribution percentages',
        'المبلغ الإجمالي': 'Total amount',
        'المصدر (اختياري)': 'Source (optional)',
        'يتم توزيع الدخل تلقائياً حسب النسب الحالية.': 'Income is distributed automatically using the current percentages.',
        'إضافة الدخل': 'Add income',
        'كل البيانات': 'All data',
        'شهر محدد': 'Specific month',
        'إجمالي الدخل': 'Total income',
        'إجمالي المصروفات': 'Total expenses',
        'الرصيد': 'Balance',
        'سجل العمليات': 'Records',
        'تصدير': 'Export',
        'هذا الشهر': 'This month',
        'اليوم': 'Today',
        'الشهر الماضي': 'Last month',
        'فترة مخصصة': 'Custom period',
        'الكل': 'All',
        'التحويلات': 'Transfers',
        'دخل الفترة': 'Period income',
        'مصروف الفترة': 'Period expenses',
        'صافي المتبقي': 'Net remaining',
        'أكثر تصنيف': 'Top category',
        'لا يوجد': 'None',
        'عدد العمليات': 'Records count',
        'المصروفات حسب النوع': 'Expenses by category',
        'كاش مقابل بطاقة': 'Cash vs card',
        'توزيع الدخل': 'Income distribution',
        'ادخار': 'Savings',
        'مصروفات': 'Expenses',
        'طوارئ': 'Emergency',
        'الإنفاق حسب الشهر': 'Spending by month',
        'الإنفاق اليومي': 'Daily spending',
        'الرئيسية': 'Home',
        'مصروف': 'Expense',
        'دخل': 'Income',
        'تحليلات': 'Analytics',
        'تمت الإضافة بنجاح': 'Added successfully',
        'الإعدادات': 'Settings',
        'الحساب': 'Account',
        'غير مسجل': 'Not signed in',
        'وضع التجربة': 'Demo mode',
        'تسجيل الخروج': 'Log out',
        'العملة': 'Currency',
        'دينار ليبي (د.ل)': 'Libyan dinar (LYD)',
        'ريال سعودي (ر.س)': 'Saudi riyal (SAR)',
        'درهم إماراتي (د.إ)': 'UAE dirham (AED)',
        'دولار ($)': 'Dollar ($)',
        'يورو (€)': 'Euro (€)',
        'اللغة': 'Language',
        'العربية': 'Arabic',
        'المظهر والثيمات': 'Appearance and themes',
        'الوضع الفاتح': 'Light mode',
        'الوضع الداكن': 'Dark mode',
        'الكلاسيكي': 'Classic',
        'الأزرق': 'Blue',
        'الأخضر': 'Green',
        'البرتقالي': 'Orange',
        'الإعلانات / البنرات': 'Ads / banners',
        'إعلانات الصفحة الرئيسية': 'Home page ads',
        'إدارة البنرات': 'Manage banners',
        'حذف جميع البيانات': 'Delete all data',
        'مسح الكل': 'Clear all',
        'الترتيب': 'Order',
        'نشط': 'Active',
        'يبدأ': 'Starts',
        'ينتهي': 'Ends',
        'تفريغ': 'Clear',
        'حفظ البنر': 'Save banner',
        'تحديث البنر': 'Update banner',
        'المصروفات %': 'Expenses %',
        'الادخار %': 'Savings %',
        'الطوارئ %': 'Emergency %',
        'إلغاء': 'Cancel',
        'حفظ': 'Save',
        'من محفظة': 'From wallet',
        'إلى محفظة': 'To wallet',
        'ملاحظة': 'Note',
        'حفظ التحويل': 'Save transfer',
        'تأكيد الحذف': 'Confirm deletion',
        'هل أنت متأكد من حذف هذه المعاملة؟': 'Are you sure you want to delete this record?',
        'حذف': 'Delete',
        'تفاصيل العملية': 'Record details',
        'تعديل': 'Edit',
        'تعديل العملية': 'Edit record',
        'الوصف / الملاحظة': 'Description / note',
        'حفظ التعديل': 'Save changes',
        'تسجيل الدخول إلى Cashgo': 'Log in to Cashgo',
        'إغلاق تسجيل الدخول': 'Close login',
        'إعلانات': 'Ads',
        'شرائح الإعلان': 'Ad slides',
        'مثال: غداء، بنزين...': 'Example: lunch, fuel...',
        'مثال: راتب، عمل حر...': 'Example: salary, freelance work...',
        'نطاق التحليل': 'Analytics range',
        'اختيار اللغة': 'Choose language',
        'عنوان البنر': 'Banner title',
        'رابط الصورة': 'Image URL',
        'رابط عند الضغط': 'Click target URL',
        'اختياري': 'Optional',
        'يونيو': 'June',
        'يناير': 'January',
        'فبراير': 'February',
        'مارس': 'March',
        'أبريل': 'April',
        'مايو': 'May',
        'يوليو': 'July',
        'أغسطس': 'August',
        'سبتمبر': 'September',
        'أكتوبر': 'October',
        'نوفمبر': 'November',
        'ديسمبر': 'December',
        'الأحد': 'Sunday',
        'الاثنين': 'Monday',
        'الثلاثاء': 'Tuesday',
        'الأربعاء': 'Wednesday',
        'الخميس': 'Thursday',
        'الجمعة': 'Friday',
        'السبت': 'Saturday',
        'تم اختيار اللغة العربية': 'Arabic selected',
        'تم حفظ المظهر بنجاح': 'Appearance saved successfully',
        'تعذر حفظ المظهر': 'Could not save appearance',
        'تم حفظ توزيع الدخل': 'Income distribution saved',
        'تم حفظ توزيع الدخل في وضع التجربة': 'Income distribution saved in demo mode',
        'يجب أن يكون مجموع النسب 100%': 'The total percentage must be 100%',
        'تعذر حفظ النسب. حاول مرة أخرى.': 'Could not save percentages. Try again.',
        'أدخل مبلغ صحيح للتحويل': 'Enter a valid transfer amount',
        'لا يمكن التحويل إلى نفس المحفظة': 'You cannot transfer to the same wallet',
        'الرصيد غير كافٍ في المحفظة المحددة': 'Insufficient balance in the selected wallet',
        'تم تحويل المبلغ بنجاح': 'Transfer saved successfully',
        'تم تحويل المبلغ في وضع التجربة': 'Transfer saved in demo mode',
        'تعذر حفظ التحويل. حاول مرة أخرى.': 'Could not save transfer. Try again.',
        'أدخل مبلغ صحيح': 'Enter a valid amount',
        'تم حفظ التعديل': 'Changes saved',
        'تعذر تسجيل الخروج. حاول مرة أخرى.': 'Could not log out. Try again.',
        'يرجى تسجيل الدخول أولاً': 'Please log in first',
        'تم تسجيل الدخول بنجاح. بيانات حسابك محفوظة الآن.': 'Logged in successfully. Your account data is saved now.',
        'تم تسجيل الدخول وحفظ بيانات التجربة في حسابك.': 'Logged in and saved your demo data to your account.',
        'هذه الصفحة مخصصة للأدمن فقط': 'This page is for admins only',
        'تم حذف البنر': 'Banner deleted',
        'تعذر تحميل البنرات. تأكد من صلاحيات Supabase.': 'Could not load banners. Check Supabase permissions.',
        'جاري تحميل البنرات...': 'Loading banners...',
        'لا توجد بنرات بعد': 'No banners yet',
        'تم مسح بيانات التجربة': 'Demo data cleared',
        'تم مسح جميع البيانات': 'All data cleared',
        'تعذر مسح البيانات. حاول مرة أخرى': 'Could not clear data. Try again',
        'يجب أن يساوي مجموع التقسيم مبلغ المصروف': 'Split total must equal the expense amount',
        'مجموع التقسيم غير مطابق للمبلغ': 'Split total does not match the amount',
        'الرصيد غير كافٍ في هذه الخانة': 'Insufficient balance in this wallet',
        'تمت إضافة المصروف بنجاح': 'Expense added successfully',
        'تمت إضافة المصروف في وضع التجربة': 'Expense added in demo mode',
        'تعذر إضافة المصروف. حاول مرة أخرى': 'Could not add expense. Try again',
        'تمت إضافة الدخل وتوزيعه بنجاح': 'Income added and distributed successfully',
        'تمت إضافة الدخل في وضع التجربة': 'Income added in demo mode',
        'تعذر إضافة الدخل. حاول مرة أخرى': 'Could not add income. Try again',
        'تم حذف المعاملة': 'Record deleted',
        'تم حذف المعاملة من التجربة': 'Record deleted from demo',
        'تعذر حذف المعاملة. حاول مرة أخرى': 'Could not delete record. Try again',
        'لا توجد عمليات للتصدير': 'No records to export',
        'تم تصدير السجل': 'Records exported',
        'لا توجد بيانات': 'No data',
        'كل الفترات': 'All periods',
        'اليوم': 'Today'
    };
    const textOriginals = new WeakMap();
    const FIXED_SPLIT_RATIOS = {
        savings: 0.30,
        expenses: 0.50,
        emergency: 0.20,
    };
    const DEFAULT_USER_SETTINGS = {
        currency: 'LYD',
        theme: 'light',
        color_theme: 'classic',
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
    let appLanguage = loadUiLanguage();
    let transactions = [];
    let userSettings = { ...DEFAULT_USER_SETTINGS };
    let walletBalances = { ...DEFAULT_WALLET_BALANCES };
    let analyticsMode = 'all';
    let analyticsMonth = new Date().getMonth();
    let analyticsYear = new Date().getFullYear();
    let deleteTargetId = null;
    let toastTimer = null;
    let authUser = null;
    let demoMode = true;
    let demoImportInProgress = false;
    let isBannerAdmin = false;
    let appFlowStarted = false;
    let authMode = 'login';
    let authStateListenerAttached = false;
    let recordFilterMode = 'month';
    let editTargetId = null;
    let recordTypeFilter = 'all';
    let detailTargetId = null;
    let banners = [];
    let bannerAdminItems = [];
    let editingBannerId = null;
    let activeBannerIndex = 0;
    let bannerAutoTimer = null;
    let viewedBannerIds = new Set();
    let bannerTouchStartX = 0;
    let bannerTouchDeltaX = 0;
    let bannerPointerDown = false;
    let bannerWasSwiping = false;
    let bannerSwipeEventsBound = false;
    let languageObserver = null;

    // Chart instances
    let categoryChart = null;
    let paymentChart = null;
    let incomeDistChart = null;
    let dailyChart = null;

    // ==========================================
    // LOCAL STORAGE (UI preferences only)
    // ==========================================
    function loadCurrency() {
        return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'د.ل';
    }

    function saveCurrency() {
        localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
    }

    function loadUiLanguage() {
        const savedLanguage = localStorage.getItem(STORAGE_KEYS.UI_LANGUAGE);
        return SUPPORTED_LANGUAGES.includes(savedLanguage) ? savedLanguage : 'ar';
    }

    function saveUiLanguage(language) {
        appLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'ar';
        localStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, appLanguage);
        applyUiLanguage();
        updateLanguageControls();
    }

    function applyUiLanguage() {
        document.documentElement.lang = appLanguage;
        document.documentElement.dir = appLanguage === 'ar' ? 'rtl' : 'ltr';
        document.body.dataset.language = appLanguage;
        translatePage();
    }

    function normalizeTranslationKey(text) {
        return String(text || '').replace(/\s+/g, ' ').trim();
    }

    function translateText(text) {
        if (appLanguage !== 'en') return text;
        const original = String(text || '');
        const key = normalizeTranslationKey(original);
        if (!key) return original;

        if (TEXT_TRANSLATIONS[key]) {
            return original.replace(key, TEXT_TRANSLATIONS[key]);
        }

        let translated = original;
        Object.keys(TEXT_TRANSLATIONS)
            .sort((a, b) => b.length - a.length)
            .forEach((arabicText) => {
                if (!translated.includes(arabicText)) return;
                translated = translated.split(arabicText).join(TEXT_TRANSLATIONS[arabicText]);
            });
        return translated;
    }

    function translateTextNode(node) {
        if (!node || !normalizeTranslationKey(node.nodeValue)) return;

        const savedOriginal = textOriginals.get(node);
        if (appLanguage === 'ar') {
            if (savedOriginal !== undefined) node.nodeValue = savedOriginal;
            return;
        }

        if (savedOriginal === undefined || /[\u0600-\u06FF]/.test(node.nodeValue)) {
            textOriginals.set(node, node.nodeValue);
        }

        const original = textOriginals.get(node) || node.nodeValue;
        node.nodeValue = translateText(original);
    }

    function translateElementAttributes(element) {
        if (!element || !element.getAttribute) return;
        ['placeholder', 'aria-label', 'title'].forEach((attribute) => {
            const value = element.getAttribute(attribute);
            if (!value) return;
            const dataKey = `i18nOriginal${attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}`;
            const savedOriginal = element.dataset ? element.dataset[dataKey] : null;

            if (appLanguage === 'ar') {
                if (savedOriginal) element.setAttribute(attribute, savedOriginal);
                return;
            }

            if (!savedOriginal || /[\u0600-\u06FF]/.test(value)) {
                element.dataset[dataKey] = value;
            }

            element.setAttribute(attribute, translateText(element.dataset[dataKey] || value));
        });
    }

    function translateElement(root = document.body) {
        if (!root) return;

        if (root.nodeType === Node.TEXT_NODE) {
            translateTextNode(root);
            return;
        }

        if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
        const element = root.nodeType === Node.ELEMENT_NODE ? root : null;
        if (element && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) return;

        if (element) translateElementAttributes(element);

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
            acceptNode(node) {
                if (node.nodeType === Node.ELEMENT_NODE && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.nodeType === Node.TEXT_NODE) {
                translateTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                translateElementAttributes(node);
            }
        }
    }

    function translatePage() {
        translateElement(document.body);
        if (!document.documentElement.dataset.originalTitle) {
            document.documentElement.dataset.originalTitle = document.title;
        }
        document.title = appLanguage === 'ar'
            ? document.documentElement.dataset.originalTitle
            : translateText(document.documentElement.dataset.originalTitle);
    }

    function startLanguageObserver() {
        if (languageObserver || !document.body) return;

        languageObserver = new MutationObserver((mutations) => {
            if (appLanguage !== 'en') return;
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData') {
                    translateTextNode(mutation.target);
                    return;
                }
                mutation.addedNodes.forEach((node) => translateElement(node));
                if (mutation.type === 'attributes') {
                    translateElementAttributes(mutation.target);
                }
            });
        });

        languageObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['placeholder', 'aria-label', 'title'],
        });
    }

    function loadLocalAppearance() {
        return {
            theme: localStorage.getItem(STORAGE_KEYS.UI_THEME) || DEFAULT_USER_SETTINGS.theme,
            color_theme: localStorage.getItem(STORAGE_KEYS.UI_COLOR_THEME) || DEFAULT_USER_SETTINGS.color_theme,
        };
    }

    function saveLocalAppearance(settings) {
        localStorage.setItem(STORAGE_KEYS.UI_THEME, settings.theme || DEFAULT_USER_SETTINGS.theme);
        localStorage.setItem(STORAGE_KEYS.UI_COLOR_THEME, settings.color_theme || DEFAULT_USER_SETTINGS.color_theme);
    }

    function applyAppearance(settings = userSettings) {
        const mode = settings.theme === 'dark' ? 'dark' : 'light';
        const colorTheme = ['classic', 'blue', 'green', 'orange'].includes(settings.color_theme)
            ? settings.color_theme
            : DEFAULT_USER_SETTINGS.color_theme;

        document.documentElement.dataset.appearanceMode = mode;
        document.documentElement.dataset.colorTheme = colorTheme;
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', mode === 'dark' ? '#0a0a0f' : '#f8fafc');
        }
    }

    function isDemoMode() {
        return !authUser || demoMode;
    }

    function loadDemoData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.DEMO_DATA);
            if (!raw) {
                transactions = [];
                walletBalances = { ...DEFAULT_WALLET_BALANCES };
                userSettings = { ...DEFAULT_USER_SETTINGS, ...loadLocalAppearance() };
                applyAppearance(userSettings);
                return;
            }

            const data = JSON.parse(raw);
            transactions = Array.isArray(data.transactions) ? data.transactions : [];
            walletBalances = normalizeWalletBalances(data.walletBalances || DEFAULT_WALLET_BALANCES);
            userSettings = normalizeUserSettings({
                ...data.userSettings,
                ...loadLocalAppearance(),
            });
            applyAppearance(userSettings);
        } catch (error) {
            console.warn('Demo data loading failed:', error);
            transactions = [];
            walletBalances = { ...DEFAULT_WALLET_BALANCES };
            userSettings = { ...DEFAULT_USER_SETTINGS, ...loadLocalAppearance() };
            applyAppearance(userSettings);
        }
    }

    function saveDemoData() {
        if (!isDemoMode()) return;
        localStorage.setItem(STORAGE_KEYS.DEMO_DATA, JSON.stringify({
            transactions,
            walletBalances,
            userSettings,
        }));
    }

    function clearDemoData() {
        localStorage.removeItem(STORAGE_KEYS.DEMO_DATA);
        localStorage.removeItem(STORAGE_KEYS.DEMO_ACTION_COUNT);
    }

    function getDemoActionCount() {
        return Number(localStorage.getItem(STORAGE_KEYS.DEMO_ACTION_COUNT) || 0);
    }

    function incrementDemoActionCount() {
        if (!isDemoMode()) return 0;
        const count = getDemoActionCount() + 1;
        localStorage.setItem(STORAGE_KEYS.DEMO_ACTION_COUNT, String(count));
        maybeShowLoginPrompt(count);
        return count;
    }

    function maybeShowLoginPrompt(count = getDemoActionCount()) {
        if (!isDemoMode()) return;
        if (count === 5) {
            openAuthModal('جربت Cashgo بنجاح. سجّل دخولك الآن لحفظ بياناتك ومتابعتها من أي جهاز.', 'success', {
                allowContinueDemo: true,
            });
        } else if (count > 5 && count % 3 === 0) {
            showToast('سجّل دخولك لحفظ بيانات التجربة والرجوع لها لاحقاً');
        }
    }

    function getStoredDemoData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.DEMO_DATA);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('Stored demo data parsing failed:', error);
            return null;
        }
    }

    async function importDemoDataToAccount() {
        if (!authUser || !supabaseClient || demoImportInProgress) return false;

        const demoData = getStoredDemoData();
        const demoTransactions = Array.isArray(demoData?.transactions) ? demoData.transactions : [];
        const demoBalances = normalizeWalletBalances(demoData?.walletBalances || DEFAULT_WALLET_BALANCES);
        const hasDemoBalances = Object.values(demoBalances).some((value) => Number(value || 0) !== 0);

        if (!demoTransactions.length && !hasDemoBalances) return false;

        demoImportInProgress = true;

        try {
            const userId = authUser.id;
            const incomes = demoTransactions.filter((record) => record.type === 'income');
            const expenses = demoTransactions.filter((record) => record.type === 'expense');
            const transfers = demoTransactions.filter((record) => record.type === 'transfer');

            if (incomes.length) {
                const { error } = await supabaseClient
                    .from('incomes')
                    .insert(incomes.map((record) => ({
                        user_id: userId,
                        amount: Number(record.amount || 0),
                        note: record.description || '',
                        income_date: record.date || new Date().toISOString().split('T')[0],
                        expenses_amount: Number(record.expensesAmount || 0),
                        savings_amount: Number(record.savingsAmount || 0),
                        emergency_amount: Number(record.emergencyAmount || 0),
                    })));
                if (error) throw error;
            }

            for (const record of expenses) {
                const { data, error } = await supabaseClient
                    .from('transactions')
                    .insert({
                        user_id: userId,
                        amount: Number(record.amount || 0),
                        category: record.category || 'food',
                        source_wallet: record.sourceWallet || 'expenses',
                        payment_method: record.paymentMethod || 'cash',
                        note: record.description || '',
                        transaction_date: record.date || new Date().toISOString().split('T')[0],
                    })
                    .select('id')
                    .single();

                if (error) throw error;

                const splitParts = Array.isArray(record.walletSplits) ? record.walletSplits : [];
                if (splitParts.length > 1) {
                    const { error: splitError } = await supabaseClient
                        .from('transaction_wallet_splits')
                        .insert(splitParts.map((part) => ({
                            transaction_id: data.id,
                            user_id: userId,
                            source_wallet: part.source_wallet,
                            amount: Number(part.amount || 0),
                        })));
                    if (splitError) throw splitError;
                }
            }

            if (transfers.length) {
                const { error } = await supabaseClient
                    .from('wallet_transfers')
                    .insert(transfers.map((record) => ({
                        user_id: userId,
                        from_wallet: record.fromWallet || 'expenses',
                        to_wallet: record.toWallet || 'savings',
                        amount: Number(record.amount || 0),
                        note: record.description || '',
                        transfer_date: record.date || new Date().toISOString().split('T')[0],
                    })));
                if (error) throw error;
            }

            await saveWalletBalances({
                expenses_balance: Number(walletBalances.expenses_balance || 0) + Number(demoBalances.expenses_balance || 0),
                savings_balance: Number(walletBalances.savings_balance || 0) + Number(demoBalances.savings_balance || 0),
                emergency_balance: Number(walletBalances.emergency_balance || 0) + Number(demoBalances.emergency_balance || 0),
                total_income: Number(walletBalances.total_income || 0) + Number(demoBalances.total_income || 0),
                total_spent: Number(walletBalances.total_spent || 0) + Number(demoBalances.total_spent || 0),
            });

            clearDemoData();
            await loadRecentRecords();
            return true;
        } finally {
            demoImportInProgress = false;
        }
    }

    async function initializeFinancialData() {
        await loadUserSettings();
        await loadWalletBalances();
        await loadRecentRecords();
        await loadActiveBanners();
        updateHome();
        updateAnalytics();
    }

    async function loadUserSettings() {
        if (!supabaseClient) return userSettings;
        const userId = requireFinancialUser();
        let supportsColorTheme = true;

        let { data, error } = await supabaseClient
            .from('user_settings')
            .select('expenses_percentage, savings_percentage, emergency_percentage, currency, theme, color_theme')
            .eq('user_id', userId)
            .maybeSingle();

        if (isMissingColorThemeColumn(error)) {
            supportsColorTheme = false;
            showToast('أضف عمود color_theme في Supabase أولاً');
            const fallback = await supabaseClient
                .from('user_settings')
                .select('expenses_percentage, savings_percentage, emergency_percentage, currency, theme')
                .eq('user_id', userId)
                .maybeSingle();
            data = fallback.data;
            error = fallback.error;
        }

        if (error) throw error;

        if (!data) {
            const defaults = { user_id: userId, ...DEFAULT_USER_SETTINGS };
            if (!supportsColorTheme) delete defaults.color_theme;
            const { data: inserted, error: insertError } = await supabaseClient
                .from('user_settings')
                .insert(defaults)
                .select(supportsColorTheme
                    ? 'expenses_percentage, savings_percentage, emergency_percentage, currency, theme, color_theme'
                    : 'expenses_percentage, savings_percentage, emergency_percentage, currency, theme')
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
        applyAppearance(userSettings);
        updateAppearanceControls();
        return userSettings;
    }

    async function saveUserSettings(nextSettings) {
        if (!supabaseClient) return null;
        const userId = requireFinancialUser();

        const payload = {
            user_id: userId,
            currency: nextSettings.currency || userSettings.currency || DEFAULT_USER_SETTINGS.currency,
            theme: nextSettings.theme || userSettings.theme || DEFAULT_USER_SETTINGS.theme,
            color_theme: nextSettings.color_theme || userSettings.color_theme || DEFAULT_USER_SETTINGS.color_theme,
            expenses_percentage: Number(nextSettings.expenses_percentage),
            savings_percentage: Number(nextSettings.savings_percentage),
            emergency_percentage: Number(nextSettings.emergency_percentage),
        };

        let { data, error } = await supabaseClient
            .from('user_settings')
            .update(payload)
            .eq('user_id', userId)
            .select('expenses_percentage, savings_percentage, emergency_percentage, currency, theme, color_theme')
            .maybeSingle();

        if (isMissingColorThemeColumn(error)) {
            throw new Error('missing_color_theme_column');
        }

        if (error) throw error;

        if (!data) {
            const insertResult = await supabaseClient
                .from('user_settings')
                .insert(payload)
                .select('expenses_percentage, savings_percentage, emergency_percentage, currency, theme, color_theme')
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
        applyAppearance(userSettings);
        updateAppearanceControls();
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
        const recordsLimit = 1000;

        const [incomeResult, expenseResult, transferResult] = await Promise.all([
            supabaseClient
                .from('incomes')
                .select('id, amount, note, income_date, expenses_amount, savings_amount, emergency_amount, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(recordsLimit),
            supabaseClient
                .from('transactions')
                .select('id, amount, category, source_wallet, payment_method, note, transaction_date, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(recordsLimit),
            supabaseClient
                .from('wallet_transfers')
                .select('id, from_wallet, to_wallet, amount, note, transfer_date, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(recordsLimit),
        ]);

        if (incomeResult.error) throw incomeResult.error;
        if (expenseResult.error) throw expenseResult.error;
        if (transferResult.error) throw transferResult.error;

        const expenseIds = (expenseResult.data || []).map((row) => row.id);
        let splitRows = [];
        if (expenseIds.length > 0) {
            const splitResult = await supabaseClient
                .from('transaction_wallet_splits')
                .select('transaction_id, source_wallet, amount')
                .eq('user_id', userId)
                .in('transaction_id', expenseIds);

            if (splitResult.error) throw splitResult.error;
            splitRows = splitResult.data || [];
        }

        const splitsByTransaction = splitRows.reduce((map, row) => {
            if (!map.has(row.transaction_id)) map.set(row.transaction_id, []);
            map.get(row.transaction_id).push({
                source_wallet: row.source_wallet,
                amount: Number(row.amount || 0),
            });
            return map;
        }, new Map());

        const incomes = (incomeResult.data || []).map(normalizeIncomeRecord);
        const expenses = (expenseResult.data || []).map((row) => (
            normalizeExpenseRecord(row, splitsByTransaction.get(row.id) || [])
        ));
        const transfers = (transferResult.data || []).map(normalizeTransferRecord);

        transactions = [...incomes, ...expenses, ...transfers]
            .sort((a, b) => getCreatedTime(b) - getCreatedTime(a));

        return transactions;
    }

    async function loadActiveBanners() {
        if (!supabaseClient) return [];
        if (!authUser) {
            banners = [];
            renderBannerSlider();
            return [];
        }

        try {
            const nowIso = new Date().toISOString();
            const { data, error } = await supabaseClient
                .from('banners')
                .select('id, title, image_url, target_url, sort_order, is_active, starts_at, ends_at')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })
                .limit(10);

            if (error) throw error;

            banners = (data || [])
                .filter((banner) => {
                    const startsOk = !banner.starts_at || banner.starts_at <= nowIso;
                    const endsOk = !banner.ends_at || banner.ends_at >= nowIso;
                    return banner.is_active && startsOk && endsOk && banner.image_url && banner.target_url;
                })
                .slice(0, 3);

            renderBannerSlider();
            return banners;
        } catch (error) {
            console.warn('Banner loading failed:', error);
            banners = [];
            renderBannerSlider();
            return [];
        }
    }

    function renderBannerSlider() {
        if (!dom.bannerSlider || !dom.bannerTrack || !dom.bannerDots) return;

        stopBannerAutoSlide();
        activeBannerIndex = 0;
        viewedBannerIds = new Set();

        if (!banners.length) {
            dom.bannerSlider.classList.add('hidden');
            dom.bannerTrack.innerHTML = '';
            dom.bannerDots.innerHTML = '';
            return;
        }

        dom.bannerTrack.innerHTML = banners.map((banner, index) => `
            <button class="banner-slide" type="button" data-index="${index}" aria-label="${escapeHTML(banner.title || 'إعلان')}">
                <img src="${escapeHTML(banner.image_url)}" alt="${escapeHTML(banner.title || 'إعلان')}" loading="lazy">
            </button>
        `).join('');

        dom.bannerDots.innerHTML = banners.map((_, index) => (
            `<button class="banner-dot${index === 0 ? ' active' : ''}" type="button" data-index="${index}" aria-label="عرض الإعلان ${index + 1}"></button>`
        )).join('');

        dom.bannerSlider.classList.remove('hidden');
        updateBannerSlide(0);
        bindBannerSlideEvents();
        startBannerAutoSlide();
    }

    function bindBannerSlideEvents() {
        dom.bannerTrack.querySelectorAll('.banner-slide').forEach((slide) => {
            slide.addEventListener('click', (event) => {
                if (bannerWasSwiping) {
                    event.preventDefault();
                    bannerWasSwiping = false;
                    return;
                }
                const index = Number(slide.dataset.index || 0);
                const banner = banners[index];
                if (banner) trackBannerClick(banner.id, banner.target_url);
            });

            const img = slide.querySelector('img');
            if (img) {
                img.addEventListener('error', () => {
                    slide.classList.add('image-error');
                    img.remove();
                });
            }
        });

        dom.bannerDots.querySelectorAll('.banner-dot').forEach((dot) => {
            dot.addEventListener('click', () => {
                updateBannerSlide(Number(dot.dataset.index || 0));
                startBannerAutoSlide();
            });
        });

        const swipeSurface = dom.bannerSlider || dom.bannerTrack;
        if (bannerSwipeEventsBound) return;
        bannerSwipeEventsBound = true;

        swipeSurface.addEventListener('touchstart', (event) => {
            bannerTouchStartX = event.touches[0].clientX;
            bannerTouchDeltaX = 0;
            bannerWasSwiping = false;
        }, { passive: true });

        swipeSurface.addEventListener('touchmove', (event) => {
            bannerTouchDeltaX = event.touches[0].clientX - bannerTouchStartX;
            if (Math.abs(bannerTouchDeltaX) > 12) {
                bannerWasSwiping = true;
            }
        }, { passive: true });

        swipeSurface.addEventListener('touchend', () => {
            if (Math.abs(bannerTouchDeltaX) < 28) return;
            if (bannerTouchDeltaX < 0) {
                updateBannerSlide(activeBannerIndex + 1);
            } else {
                updateBannerSlide(activeBannerIndex - 1);
            }
            startBannerAutoSlide();
            setTimeout(() => {
                bannerWasSwiping = false;
            }, 80);
        });

        swipeSurface.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'touch') return;
            bannerPointerDown = true;
            bannerTouchStartX = event.clientX;
            bannerTouchDeltaX = 0;
        });

        swipeSurface.addEventListener('pointermove', (event) => {
            if (!bannerPointerDown) return;
            bannerTouchDeltaX = event.clientX - bannerTouchStartX;
        });

        swipeSurface.addEventListener('pointerup', () => {
            if (!bannerPointerDown) return;
            bannerPointerDown = false;
            if (Math.abs(bannerTouchDeltaX) < 40) return;
            updateBannerSlide(bannerTouchDeltaX < 0 ? activeBannerIndex + 1 : activeBannerIndex - 1);
            startBannerAutoSlide();
        });

        swipeSurface.addEventListener('pointerleave', () => {
            bannerPointerDown = false;
        });
    }

    function updateBannerSlide(nextIndex) {
        if (!banners.length || !dom.bannerTrack) return;
        activeBannerIndex = (nextIndex + banners.length) % banners.length;
        dom.bannerTrack.style.transform = `translateX(-${activeBannerIndex * 100}%)`;
        dom.bannerDots.querySelectorAll('.banner-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === activeBannerIndex);
        });
        trackBannerView(banners[activeBannerIndex].id);
    }

    async function trackBannerView(bannerId) {
        if (!bannerId || viewedBannerIds.has(bannerId) || !authUser || !supabaseClient) return;
        viewedBannerIds.add(bannerId);

        try {
            const { error } = await supabaseClient
                .from('banner_stats')
                .insert({
                    banner_id: bannerId,
                    user_id: authUser.id,
                    event_type: 'view',
                });
            if (error) throw error;
        } catch (error) {
            console.warn('Banner view tracking failed:', error);
        }
    }

    async function trackBannerClick(bannerId, targetUrl) {
        if (!targetUrl) return;

        try {
            if (bannerId && authUser && supabaseClient) {
                const { error } = await supabaseClient
                    .from('banner_stats')
                    .insert({
                        banner_id: bannerId,
                        user_id: authUser.id,
                        event_type: 'click',
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.warn('Banner click tracking failed:', error);
        } finally {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
    }

    function startBannerAutoSlide() {
        stopBannerAutoSlide();
        if (banners.length <= 1) return;
        bannerAutoTimer = setInterval(() => {
            updateBannerSlide(activeBannerIndex + 1);
        }, 7000);
    }

    function stopBannerAutoSlide() {
        if (bannerAutoTimer) {
            clearInterval(bannerAutoTimer);
            bannerAutoTimer = null;
        }
    }

    function setBannerAdminMessage(message = '', isError = true) {
        if (!dom.bannerAdminMessage) return;
        dom.bannerAdminMessage.textContent = message;
        dom.bannerAdminMessage.classList.toggle('success-message', !isError && Boolean(message));
    }

    function formatDateTimeInput(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().slice(0, 16);
    }

    function readDateTimeInput(input) {
        if (!input || !input.value) return null;
        const date = new Date(input.value);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }

    async function openBannerAdminModal() {
        if (!dom.bannerAdminModal) return;
        if (!isBannerAdmin) {
            showToast('هذه الصفحة مخصصة للأدمن فقط');
            return;
        }
        dom.settingsModal.classList.remove('active');
        dom.bannerAdminModal.classList.add('active');
        resetBannerAdminForm();
        await loadBannerAdminItems();
    }

    function closeBannerAdminModal() {
        if (!dom.bannerAdminModal) return;
        dom.bannerAdminModal.classList.remove('active');
        resetBannerAdminForm();
    }

    function resetBannerAdminForm() {
        editingBannerId = null;
        if (dom.bannerTitleInput) dom.bannerTitleInput.value = '';
        if (dom.bannerImageInput) dom.bannerImageInput.value = '';
        if (dom.bannerTargetInput) dom.bannerTargetInput.value = '';
        if (dom.bannerOrderInput) dom.bannerOrderInput.value = '1';
        if (dom.bannerActiveInput) dom.bannerActiveInput.checked = true;
        if (dom.bannerStartInput) dom.bannerStartInput.value = '';
        if (dom.bannerEndInput) dom.bannerEndInput.value = '';
        if (dom.saveBannerBtn) dom.saveBannerBtn.textContent = 'حفظ البنر';
        setBannerAdminMessage('');
    }

    async function loadBannerAdminItems() {
        if (!supabaseClient || !authUser || !dom.bannerAdminList) return;

        dom.bannerAdminList.innerHTML = '<div class="banner-admin-empty">جاري تحميل البنرات...</div>';

        try {
            const { data, error } = await supabaseClient
                .from('banners')
                .select('id, title, image_url, target_url, sort_order, is_active, starts_at, ends_at, created_at')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            bannerAdminItems = data || [];
            renderBannerAdminList();
        } catch (error) {
            console.warn('Banner admin loading failed:', error);
            bannerAdminItems = [];
            dom.bannerAdminList.innerHTML = '<div class="banner-admin-empty">تعذر تحميل البنرات. تأكد من صلاحيات Supabase.</div>';
        }
    }

    function renderBannerAdminList() {
        if (!dom.bannerAdminList) return;

        if (!bannerAdminItems.length) {
            dom.bannerAdminList.innerHTML = '<div class="banner-admin-empty">لا توجد بنرات بعد</div>';
            return;
        }

        dom.bannerAdminList.innerHTML = bannerAdminItems.map((banner) => `
            <div class="banner-admin-item" data-id="${escapeHTML(banner.id)}">
                <img src="${escapeHTML(banner.image_url || '')}" alt="${escapeHTML(banner.title || 'بنر')}" loading="lazy">
                <div class="banner-admin-info">
                    <strong>${escapeHTML(banner.title || 'بدون عنوان')}</strong>
                    <span>${banner.is_active ? 'نشط' : 'متوقف'} · ترتيب ${Number(banner.sort_order || 0)}</span>
                </div>
                <div class="banner-admin-actions">
                    <button type="button" data-action="edit">تعديل</button>
                    <button type="button" data-action="delete">حذف</button>
                </div>
            </div>
        `).join('');
    }

    async function saveBannerAdminItem() {
        if (!supabaseClient || !authUser) return;

        const title = dom.bannerTitleInput?.value.trim();
        const imageUrl = dom.bannerImageInput?.value.trim();
        const targetUrl = dom.bannerTargetInput?.value.trim();
        const sortOrder = Math.max(1, Number(dom.bannerOrderInput?.value || 1));

        if (!title || !imageUrl || !targetUrl) {
            setBannerAdminMessage('اكتب العنوان ورابط الصورة ورابط الضغط');
            return;
        }

        const payload = {
            title,
            image_url: imageUrl,
            target_url: targetUrl,
            sort_order: sortOrder,
            is_active: Boolean(dom.bannerActiveInput?.checked),
            starts_at: readDateTimeInput(dom.bannerStartInput),
            ends_at: readDateTimeInput(dom.bannerEndInput),
            updated_at: new Date().toISOString(),
        };

        try {
            const request = editingBannerId
                ? supabaseClient.from('banners').update(payload).eq('id', editingBannerId)
                : supabaseClient.from('banners').insert(payload);
            const { error } = await request;
            if (error) throw error;

            resetBannerAdminForm();
            setBannerAdminMessage('تم حفظ البنر بنجاح', false);
            await loadBannerAdminItems();
            await loadActiveBanners();
        } catch (error) {
            console.warn('Banner save failed:', error);
            setBannerAdminMessage('تعذر حفظ البنر. تأكد من صلاحيات Supabase');
        }
    }

    function fillBannerAdminForm(banner) {
        editingBannerId = banner.id;
        dom.bannerTitleInput.value = banner.title || '';
        dom.bannerImageInput.value = banner.image_url || '';
        dom.bannerTargetInput.value = banner.target_url || '';
        dom.bannerOrderInput.value = Number(banner.sort_order || 1);
        dom.bannerActiveInput.checked = Boolean(banner.is_active);
        dom.bannerStartInput.value = formatDateTimeInput(banner.starts_at);
        dom.bannerEndInput.value = formatDateTimeInput(banner.ends_at);
        dom.saveBannerBtn.textContent = 'تحديث البنر';
        setBannerAdminMessage('');
    }

    async function deleteBannerAdminItem(bannerId) {
        if (!bannerId || !supabaseClient) return;
        if (!confirm('هل تريد حذف هذا البنر؟')) return;

        try {
            const { error } = await supabaseClient
                .from('banners')
                .delete()
                .eq('id', bannerId);

            if (error) throw error;
            showToast('تم حذف البنر');
            resetBannerAdminForm();
            await loadBannerAdminItems();
            await loadActiveBanners();
        } catch (error) {
            console.warn('Banner delete failed:', error);
            setBannerAdminMessage('تعذر حذف البنر. تأكد من صلاحيات Supabase');
        }
    }

    function escapeHTML(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizeUserSettings(settings = {}) {
        return {
            currency: settings.currency || DEFAULT_USER_SETTINGS.currency,
            theme: settings.theme || DEFAULT_USER_SETTINGS.theme,
            color_theme: settings.color_theme || DEFAULT_USER_SETTINGS.color_theme,
            expenses_percentage: Number(settings.expenses_percentage ?? DEFAULT_USER_SETTINGS.expenses_percentage),
            savings_percentage: Number(settings.savings_percentage ?? DEFAULT_USER_SETTINGS.savings_percentage),
            emergency_percentage: Number(settings.emergency_percentage ?? DEFAULT_USER_SETTINGS.emergency_percentage),
        };
    }

    function isMissingColorThemeColumn(error) {
        const message = error && error.message ? error.message.toLowerCase() : '';
        return Boolean(error) && message.includes('color_theme') && message.includes('column');
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

    function normalizeExpenseRecord(row, walletSplits = []) {
        return {
            id: row.id,
            type: 'expense',
            amount: Number(row.amount || 0),
            description: row.note || '',
            category: row.category || 'food',
            sourceWallet: row.source_wallet || 'expenses',
            walletSplits,
            paymentMethod: row.payment_method || 'cash',
            date: row.transaction_date,
            createdAt: row.created_at,
        };
    }

    function normalizeTransferRecord(row) {
        return {
            id: row.id,
            type: 'transfer',
            amount: Number(row.amount || 0),
            description: row.note || '',
            fromWallet: row.from_wallet || 'expenses',
            toWallet: row.to_wallet || 'savings',
            date: row.transfer_date,
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

    async function refreshAdminAccess() {
        isBannerAdmin = false;

        if (!supabaseClient || !authUser) {
            updateAdminUI();
            return false;
        }

        const userEmail = (authUser.email || '').toLowerCase();
        if (userEmail === ADMIN_EMAIL) {
            isBannerAdmin = true;
            updateAdminUI();
            return true;
        }

        try {
            const { data, error } = await supabaseClient
                .from('app_admins')
                .select('user_id')
                .eq('user_id', authUser.id)
                .maybeSingle();

            if (error) throw error;
            isBannerAdmin = Boolean(data);
        } catch (error) {
            console.warn('Admin access check failed:', error);
            isBannerAdmin = false;
        }

        updateAdminUI();
        return isBannerAdmin;
    }

    function updateAdminUI() {
        if (dom.bannerSettingsSection) {
            dom.bannerSettingsSection.classList.toggle('hidden', isDemoMode() || !isBannerAdmin);
        }
        if (dom.openBannerAdminBtn) {
            dom.openBannerAdminBtn.classList.toggle('hidden', isDemoMode() || !isBannerAdmin);
        }
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
        authGoogleBtn: $('#auth-google-btn'),
        authCloseBtn: $('#auth-close-btn'),
        authContinueDemoBtn: $('#auth-continue-demo-btn'),
        authMessage: $('#auth-message'),
        splash: $('#splash-screen'),
        app: $('#app'),
        headerLoginBtn: $('#header-login-btn'),
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
        openTransferBtn: $('#open-transfer-btn'),
        bannerSlider: $('#banner-slider'),
        bannerTrack: $('#banner-track'),
        bannerDots: $('#banner-dots'),
        demoNotice: $('#demo-notice'),
        saveDemoDataBtn: $('#save-demo-data-btn'),
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
        splitExpenseCheckbox: $('#split-expense-checkbox'),
        splitExpensePanel: $('#split-expense-panel'),
        splitExpensesAmount: $('#split-expenses-amount'),
        splitSavingsAmount: $('#split-savings-amount'),
        splitEmergencyAmount: $('#split-emergency-amount'),
        splitExpenseError: $('#split-expense-error'),
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
        recordFilterTabs: $('#record-filter-tabs'),
        recordTypeTabs: $('#record-type-tabs'),
        customFilterRow: $('#custom-filter-row'),
        filterFromDate: $('#filter-from-date'),
        filterToDate: $('#filter-to-date'),
        periodIncome: $('#period-income'),
        periodExpenses: $('#period-expenses'),
        periodNet: $('#period-net'),
        topCategory: $('#top-category'),
        periodCount: $('#period-count'),
        analyticsRecordsList: $('#analytics-records-list'),
        exportRecordsBtn: $('#export-records-btn'),

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
        languageToggle: $('#language-toggle'),
        appearanceModeToggle: $('#appearance-mode-toggle'),
        colorThemeGrid: $('#color-theme-grid'),
        clearDataBtn: $('#clear-data-btn'),
        accountEmail: $('#account-email'),
        logoutBtn: $('#logout-btn'),
        bannerSettingsSection: $('#banner-settings-section'),
        openBannerAdminBtn: $('#open-banner-admin-btn'),

        // Banner admin modal
        bannerAdminModal: $('#banner-admin-modal'),
        closeBannerAdmin: $('#close-banner-admin'),
        bannerTitleInput: $('#banner-title-input'),
        bannerImageInput: $('#banner-image-input'),
        bannerTargetInput: $('#banner-target-input'),
        bannerOrderInput: $('#banner-order-input'),
        bannerActiveInput: $('#banner-active-input'),
        bannerStartInput: $('#banner-start-input'),
        bannerEndInput: $('#banner-end-input'),
        bannerAdminMessage: $('#banner-admin-message'),
        bannerAdminList: $('#banner-admin-list'),
        resetBannerFormBtn: $('#reset-banner-form-btn'),
        saveBannerBtn: $('#save-banner-btn'),

        // Distribution modal
        distributionModal: $('#distribution-modal'),
        closeDistribution: $('#close-distribution'),
        cancelDistribution: $('#cancel-distribution'),
        saveDistributionBtn: $('#save-distribution-btn'),
        distributionExpenses: $('#distribution-expenses'),
        distributionSavings: $('#distribution-savings'),
        distributionEmergency: $('#distribution-emergency'),
        distributionError: $('#distribution-error'),

        // Transfer modal
        transferModal: $('#transfer-modal'),
        closeTransfer: $('#close-transfer'),
        cancelTransfer: $('#cancel-transfer'),
        saveTransferBtn: $('#save-transfer-btn'),
        transferFromWallet: $('#transfer-from-wallet'),
        transferToWallet: $('#transfer-to-wallet'),
        transferAmount: $('#transfer-amount'),
        transferNote: $('#transfer-note'),
        transferDate: $('#transfer-date'),
        transferError: $('#transfer-error'),

        // Delete modal
        deleteModal: $('#delete-modal'),
        cancelDelete: $('#cancel-delete'),
        confirmDelete: $('#confirm-delete'),

        // Record details modal
        recordDetailModal: $('#record-detail-modal'),
        closeRecordDetail: $('#close-record-detail'),
        recordDetailTitle: $('#record-detail-title'),
        recordDetailBody: $('#record-detail-body'),
        detailEditBtn: $('#detail-edit-btn'),
        detailDeleteBtn: $('#detail-delete-btn'),

        // Edit record modal
        editRecordModal: $('#edit-record-modal'),
        closeEditRecord: $('#close-edit-record'),
        cancelEditRecord: $('#cancel-edit-record'),
        saveEditRecord: $('#save-edit-record'),
        editRecordTitle: $('#edit-record-title'),
        editRecordAmount: $('#edit-record-amount'),
        editRecordNote: $('#edit-record-note'),
        editRecordDate: $('#edit-record-date'),
        editSplitFields: $('#edit-split-fields'),
        editSplitExpenses: $('#edit-split-expenses'),
        editSplitSavings: $('#edit-split-savings'),
        editSplitEmergency: $('#edit-split-emergency'),
        editRecordError: $('#edit-record-error'),
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
        if (dom.transferDate) {
            dom.transferDate.value = todayStr;
        }

        // Set currency select
        dom.currencySelect.value = currency;
        userSettings = normalizeUserSettings({ ...userSettings, ...loadLocalAppearance() });
        startLanguageObserver();
        applyUiLanguage();
        applyAppearance(userSettings);
        updateAppearanceControls();
        updateLanguageControls();
        hideToast();

        // Bind events
        bindEvents();
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

        if (dom.authGoogleBtn) {
            dom.authGoogleBtn.addEventListener('click', signInWithGoogle);
        }

        if (dom.authCloseBtn) {
            dom.authCloseBtn.addEventListener('click', closeAuthModal);
        }

        if (dom.authContinueDemoBtn) {
            dom.authContinueDemoBtn.addEventListener('click', closeAuthModal);
        }

        if (dom.headerLoginBtn) {
            dom.headerLoginBtn.addEventListener('click', () => openAuthModal());
        }

        if (dom.saveDemoDataBtn) {
            dom.saveDemoDataBtn.addEventListener('click', () => openAuthModal(
                'سجّل دخولك لحفظ بياناتك والرجوع لها من أي جهاز.',
                ''
            ));
        }

        if (dom.authScreen) {
            dom.authScreen.addEventListener('click', (event) => {
                if (event.target === dom.authScreen && isDemoMode()) closeAuthModal();
            });
        }

        dom.logoutBtn.addEventListener('click', () => {
            signOutUser();
        });
    }

    async function initAuth() {
        if (!supabaseClient) {
            switchToDemoMode();
            openAuthModal('أضف رابط Supabase والمفتاح العام في ملف app.js أولاً.', 'error');
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
                switchToDemoMode();
            }
        } catch (error) {
            console.error('Supabase auth init failed:', error);
            switchToDemoMode();
            openAuthModal(`تعذر الاتصال بـ Supabase: ${getReadableSupabaseError(error)}`, 'error');
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
            demoMode = true;
            isBannerAdmin = false;
            appFlowStarted = false;
            banners = [];
            viewedBannerIds = new Set();
            stopBannerAutoSlide();
            renderBannerSlider();
            updateAdminUI();
            switchToDemoMode(event === 'SIGNED_OUT' ? 'تم تسجيل الخروج بنجاح.' : '');
        });
    }

    async function handleAuthenticatedUser(user) {
        authUser = user;
        demoMode = false;
        updateAccountUI(authUser);
        await refreshAdminAccess();

        try {
            await initializeFinancialData();
            const importedDemoData = await importDemoDataToAccount();
            startAuthenticatedFlow();
            if (importedDemoData) {
                updateHome();
                updateAnalytics();
                showToast('تم تسجيل الدخول وحفظ بيانات التجربة في حسابك.');
            } else {
                showToast('تم تسجيل الدخول بنجاح. بيانات حسابك محفوظة الآن.');
            }
        } catch (error) {
            console.error('Financial data load failed:', error);
            openAuthModal(`تم تسجيل الدخول، لكن تعذر تحميل البيانات المالية: ${getReadableSupabaseError(error)}`, 'error');
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

    async function signInWithGoogle() {
        if (!supabaseClient) {
            setAuthMessage('تعذر تسجيل الدخول باستخدام Google', 'error');
            return;
        }

        setAuthLoading(true);
        setAuthMessage('');

        try {
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname,
                },
            });

            if (error) throw error;
        } catch (error) {
            console.error('Google login failed:', error);
            setAuthMessage('تعذر تسجيل الدخول باستخدام Google', 'error');
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

    function openAuthModal(message = '', type = '', options = {}) {
        updateAuthMode('login', { keepMessage: true });
        if (dom.authScreen) {
            dom.authScreen.classList.remove('hidden');
            dom.authScreen.hidden = false;
        }
        if (dom.authContinueDemoBtn) {
            dom.authContinueDemoBtn.classList.toggle('hidden', !options.allowContinueDemo);
        }
        setAuthMessage(message, type);
        setTimeout(() => {
            if (dom.authEmail) dom.authEmail.focus();
        }, 120);
    }

    function closeAuthModal() {
        if (dom.authScreen) {
            dom.authScreen.classList.add('hidden');
            dom.authScreen.hidden = true;
        }
        if (dom.authContinueDemoBtn) {
            dom.authContinueDemoBtn.classList.add('hidden');
        }
        setAuthLoading(false);
        setAuthMessage('');
    }

    function showAuthOnly(message = '', type = '') {
        openAuthModal(message, type);
    }

    function switchToDemoMode(message = '') {
        authUser = null;
        demoMode = true;
        isBannerAdmin = false;
        appFlowStarted = true;
        loadDemoData();
        updateAdminUI();
        updateAccountUI(null);
        updateDemoUI();
        updateDistributionSummary();
        updateCurrencyBadges();
        if (dom.splash) dom.splash.classList.add('hidden');
        if (dom.app) dom.app.classList.remove('hidden');
        closeAuthModal();
        updateHome();
        updateAnalytics();
        loadActiveBanners();
        if (message) showToast(message);
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
            unlockApp();
        }, 700);
    }

    function updateAccountUI(user) {
        if (!dom.accountEmail) return;

        dom.accountEmail.textContent = user && user.email ? user.email : 'وضع التجربة';
        if (dom.logoutBtn) {
            dom.logoutBtn.hidden = !user;
        }
        updateDemoUI();
    }

    function updateDemoUI() {
        const demo = isDemoMode();
        if (dom.headerLoginBtn) {
            dom.headerLoginBtn.classList.toggle('hidden', !demo);
        }
        if (dom.demoNotice) {
            dom.demoNotice.classList.toggle('hidden', !demo);
        }
        if (dom.bannerSettingsSection) {
            dom.bannerSettingsSection.classList.toggle('hidden', demo || !isBannerAdmin);
        }
        if (dom.openBannerAdminBtn) {
            dom.openBannerAdminBtn.classList.toggle('hidden', demo || !isBannerAdmin);
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

    function updateAppearanceControls() {
        if (dom.appearanceModeToggle) {
            dom.appearanceModeToggle.querySelectorAll('.appearance-mode-btn').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.themeMode === userSettings.theme);
            });
        }

        if (dom.colorThemeGrid) {
            dom.colorThemeGrid.querySelectorAll('.theme-card').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.colorTheme === userSettings.color_theme);
            });
        }
    }

    function updateLanguageControls() {
        if (!dom.languageToggle) return;
        dom.languageToggle.querySelectorAll('.language-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.language === appLanguage);
        });
    }

    async function handleAppearanceChange(nextAppearance) {
        const nextSettings = normalizeUserSettings({
            ...userSettings,
            ...nextAppearance,
        });

        userSettings = nextSettings;
        applyAppearance(userSettings);
        updateAppearanceControls();

        try {
            if (isDemoMode()) {
                saveLocalAppearance(userSettings);
                saveDemoData();
            } else {
                await saveUserSettings(userSettings);
            }
            showToast('تم حفظ المظهر بنجاح');
        } catch (error) {
            console.error('Failed to save appearance:', error);
            showToast(error.message === 'missing_color_theme_column'
                ? 'أضف عمود color_theme في Supabase أولاً'
                : 'تعذر حفظ المظهر');
        }
    }

    function getWalletBalanceKey(wallet) {
        return `${wallet}_balance`;
    }

    function getWalletBalance(wallet) {
        return Number(walletBalances[getWalletBalanceKey(wallet)] || 0);
    }

    function resetSplitExpenseFields() {
        if (dom.splitExpensesAmount) dom.splitExpensesAmount.value = '';
        if (dom.splitSavingsAmount) dom.splitSavingsAmount.value = '';
        if (dom.splitEmergencyAmount) dom.splitEmergencyAmount.value = '';
        if (dom.splitExpenseError) dom.splitExpenseError.textContent = '';
    }

    function getSplitExpenseParts(totalAmount) {
        const isSplit = dom.splitExpenseCheckbox && dom.splitExpenseCheckbox.checked;
        if (!isSplit) {
            const activeWallet = dom.sourceWalletToggle
                ? dom.sourceWalletToggle.querySelector('.wallet-btn.active')
                : null;
            const sourceWallet = activeWallet ? activeWallet.dataset.wallet : 'expenses';
            return [{ source_wallet: sourceWallet, amount: totalAmount }];
        }

        const parts = [
            { source_wallet: 'expenses', amount: Number(dom.splitExpensesAmount.value || 0) },
            { source_wallet: 'savings', amount: Number(dom.splitSavingsAmount.value || 0) },
            { source_wallet: 'emergency', amount: Number(dom.splitEmergencyAmount.value || 0) },
        ].filter((part) => part.amount > 0);

        const sum = parts.reduce((total, part) => total + part.amount, 0);
        const roundedSum = Number(sum.toFixed(2));
        const roundedAmount = Number(totalAmount.toFixed(2));

        if (parts.length === 0 || roundedSum !== roundedAmount) {
            throw new Error('split_sum_invalid');
        }

        return parts;
    }

    function validateWalletParts(parts) {
        for (const part of parts) {
            if (part.amount > getWalletBalance(part.source_wallet)) {
                throw new Error('wallet_balance_insufficient');
            }
        }
    }

    function applyExpensePartsToBalances(parts, totalAmount) {
        const nextBalances = { ...walletBalances };
        parts.forEach((part) => {
            const key = getWalletBalanceKey(part.source_wallet);
            nextBalances[key] = Number(nextBalances[key] || 0) - Number(part.amount || 0);
        });
        nextBalances.total_spent = Number(nextBalances.total_spent || 0) + totalAmount;
        return nextBalances;
    }

    function getIncomePartsForAmount(record, amount) {
        const oldTotal = Number(record.amount || 0);
        if (oldTotal > 0) {
            return {
                expensesAmount: amount * Number(record.expensesAmount || 0) / oldTotal,
                savingsAmount: amount * Number(record.savingsAmount || 0) / oldTotal,
                emergencyAmount: amount * Number(record.emergencyAmount || 0) / oldTotal,
            };
        }

        return {
            expensesAmount: amount * Number(userSettings.expenses_percentage || 0) / 100,
            savingsAmount: amount * Number(userSettings.savings_percentage || 0) / 100,
            emergencyAmount: amount * Number(userSettings.emergency_percentage || 0) / 100,
        };
    }

    function getRecordExpenseParts(record) {
        if (record.walletSplits && record.walletSplits.length) return record.walletSplits;
        return [{ source_wallet: record.sourceWallet || 'expenses', amount: Number(record.amount || 0) }];
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

        if (isDemoMode()) {
            userSettings = normalizeUserSettings({
                ...userSettings,
                expenses_percentage: expensesPercentage,
                savings_percentage: savingsPercentage,
                emergency_percentage: emergencyPercentage,
            });
            saveDemoData();
            updateDistributionSummary();
            closeDistributionModal();
            showToast('تم حفظ توزيع الدخل في وضع التجربة');
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

    function openTransferModal() {
        if (!dom.transferModal) return;
        if (dom.transferFromWallet) dom.transferFromWallet.value = 'expenses';
        if (dom.transferToWallet) dom.transferToWallet.value = 'savings';
        if (dom.transferAmount) dom.transferAmount.value = '';
        if (dom.transferNote) dom.transferNote.value = '';
        if (dom.transferDate) dom.transferDate.value = new Date().toISOString().split('T')[0];
        if (dom.transferError) dom.transferError.textContent = '';
        dom.transferModal.classList.add('active');
    }

    function closeTransferModal() {
        if (!dom.transferModal) return;
        dom.transferModal.classList.remove('active');
    }

    async function handleWalletTransfer() {
        const fromWallet = dom.transferFromWallet.value;
        const toWallet = dom.transferToWallet.value;
        const amount = Number(dom.transferAmount.value || 0);

        if (!amount || amount <= 0) {
            dom.transferError.textContent = 'أدخل مبلغ صحيح للتحويل';
            return;
        }

        if (fromWallet === toWallet) {
            dom.transferError.textContent = 'لا يمكن التحويل إلى نفس المحفظة';
            return;
        }

        if (amount > getWalletBalance(fromWallet)) {
            dom.transferError.textContent = 'الرصيد غير كافٍ في المحفظة المحددة';
            return;
        }

        if (isDemoMode()) {
            const transferDate = dom.transferDate.value || new Date().toISOString().split('T')[0];
            const transferRecord = {
                id: `demo-${generateId()}`,
                type: 'transfer',
                amount,
                description: dom.transferNote.value.trim(),
                fromWallet,
                toWallet,
                date: transferDate,
                createdAt: Date.now(),
            };

            walletBalances = normalizeWalletBalances({
                ...walletBalances,
                [getWalletBalanceKey(fromWallet)]: getWalletBalance(fromWallet) - amount,
                [getWalletBalanceKey(toWallet)]: getWalletBalance(toWallet) + amount,
            });
            transactions = [transferRecord, ...transactions].sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
            saveDemoData();
            incrementDemoActionCount();
            updateHome();
            updateAnalytics();
            closeTransferModal();
            showToast('تم تحويل المبلغ في وضع التجربة');
            return;
        }

        try {
            dom.saveTransferBtn.disabled = true;
            const userId = requireFinancialUser();
            const transferDate = dom.transferDate.value || new Date().toISOString().split('T')[0];

            const { error } = await supabaseClient
                .from('wallet_transfers')
                .insert({
                    user_id: userId,
                    from_wallet: fromWallet,
                    to_wallet: toWallet,
                    amount,
                    note: dom.transferNote.value.trim(),
                    transfer_date: transferDate,
                });

            if (error) throw error;

            await saveWalletBalances({
                ...walletBalances,
                [getWalletBalanceKey(fromWallet)]: getWalletBalance(fromWallet) - amount,
                [getWalletBalanceKey(toWallet)]: getWalletBalance(toWallet) + amount,
            });

            if (isDemoMode()) {
                saveDemoData();
            } else {
                await loadRecentRecords();
            }
            updateHome();
            updateAnalytics();
            closeTransferModal();
            showToast('تم تحويل المبلغ بنجاح');
        } catch (error) {
            console.error('Failed to transfer wallet balance:', error);
            dom.transferError.textContent = 'تعذر حفظ التحويل. حاول مرة أخرى.';
        } finally {
            dom.saveTransferBtn.disabled = false;
        }
    }

    function openEditRecordModal(id) {
        const record = transactions.find(item => item.id === id);
        if (!record || !dom.editRecordModal) return;

        editTargetId = id;
        dom.editRecordTitle.textContent =
            record.type === 'income' ? 'تعديل دخل' :
            record.type === 'expense' ? 'تعديل مصروف' :
            'تعديل تحويل';
        dom.editRecordAmount.value = record.amount;
        dom.editRecordNote.value = record.description || '';
        dom.editRecordDate.value = record.date || new Date().toISOString().split('T')[0];
        dom.editRecordError.textContent = '';

        const isSplitExpense = record.type === 'expense' && record.walletSplits && record.walletSplits.length;
        dom.editSplitFields.classList.toggle('hidden', !isSplitExpense);
        if (isSplitExpense) {
            const getPart = wallet => record.walletSplits.find(part => part.source_wallet === wallet)?.amount || 0;
            dom.editSplitExpenses.value = getPart('expenses');
            dom.editSplitSavings.value = getPart('savings');
            dom.editSplitEmergency.value = getPart('emergency');
        }

        dom.editRecordModal.classList.add('active');
    }

    function closeEditRecordModal() {
        editTargetId = null;
        if (dom.editRecordModal) dom.editRecordModal.classList.remove('active');
    }

    async function handleSaveEditedRecord() {
        const record = transactions.find(item => item.id === editTargetId);
        if (!record) return;

        const amount = Number(dom.editRecordAmount.value || 0);
        const note = dom.editRecordNote.value.trim();
        const date = dom.editRecordDate.value || new Date().toISOString().split('T')[0];

        if (!amount || amount <= 0) {
            dom.editRecordError.textContent = 'أدخل مبلغ صحيح';
            return;
        }

        try {
            dom.saveEditRecord.disabled = true;

            if (record.type === 'income') {
                await updateIncomeRecord(record, amount, note, date);
            } else if (record.type === 'expense') {
                await updateExpenseRecord(record, amount, note, date);
            } else if (record.type === 'transfer') {
                await updateTransferRecord(record, amount, note, date);
            }

            await loadRecentRecords();
            updateHome();
            updateAnalytics();
            closeEditRecordModal();
            showToast('تم حفظ التعديل');
        } catch (error) {
            console.error('Failed to edit record:', error);
            dom.editRecordError.textContent =
                error.message === 'wallet_balance_insufficient'
                    ? 'الرصيد غير كافٍ بعد التعديل'
                    : error.message === 'split_sum_invalid'
                        ? 'يجب أن يساوي مجموع التقسيم مبلغ المصروف'
                        : 'تعذر حفظ التعديل. حاول مرة أخرى.';
        } finally {
            dom.saveEditRecord.disabled = false;
        }
    }

    async function updateIncomeRecord(record, amount, note, date) {
        const parts = getIncomePartsForAmount(record, amount);
        if (isDemoMode()) {
            const oldAmount = Number(record.amount || 0);
            const oldExpensesAmount = Number(record.expensesAmount || 0);
            const oldSavingsAmount = Number(record.savingsAmount || 0);
            const oldEmergencyAmount = Number(record.emergencyAmount || 0);

            record.amount = amount;
            record.description = note;
            record.date = date;
            record.expensesAmount = parts.expensesAmount;
            record.savingsAmount = parts.savingsAmount;
            record.emergencyAmount = parts.emergencyAmount;
            walletBalances = normalizeWalletBalances({
                expenses_balance: getWalletBalance('expenses') - oldExpensesAmount + parts.expensesAmount,
                savings_balance: getWalletBalance('savings') - oldSavingsAmount + parts.savingsAmount,
                emergency_balance: getWalletBalance('emergency') - oldEmergencyAmount + parts.emergencyAmount,
                total_income: Number(walletBalances.total_income || 0) - oldAmount + amount,
                total_spent: Number(walletBalances.total_spent || 0),
            });
            return;
        }

        const { error } = await supabaseClient
            .from('incomes')
            .update({
                amount,
                note,
                income_date: date,
                expenses_amount: parts.expensesAmount,
                savings_amount: parts.savingsAmount,
                emergency_amount: parts.emergencyAmount,
            })
            .eq('id', record.id)
            .eq('user_id', requireFinancialUser());

        if (error) throw error;

        await saveWalletBalances({
            expenses_balance: getWalletBalance('expenses') - Number(record.expensesAmount || 0) + parts.expensesAmount,
            savings_balance: getWalletBalance('savings') - Number(record.savingsAmount || 0) + parts.savingsAmount,
            emergency_balance: getWalletBalance('emergency') - Number(record.emergencyAmount || 0) + parts.emergencyAmount,
            total_income: Number(walletBalances.total_income || 0) - Number(record.amount || 0) + amount,
            total_spent: Number(walletBalances.total_spent || 0),
        });
    }

    async function updateExpenseRecord(record, amount, note, date) {
        const oldParts = getRecordExpenseParts(record);
        let newParts = oldParts;

        if (record.walletSplits && record.walletSplits.length) {
            newParts = [
                { source_wallet: 'expenses', amount: Number(dom.editSplitExpenses.value || 0) },
                { source_wallet: 'savings', amount: Number(dom.editSplitSavings.value || 0) },
                { source_wallet: 'emergency', amount: Number(dom.editSplitEmergency.value || 0) },
            ].filter(part => part.amount > 0);
            const splitTotal = Number(newParts.reduce((sum, part) => sum + part.amount, 0).toFixed(2));
            if (splitTotal !== Number(amount.toFixed(2))) {
                throw new Error('split_sum_invalid');
            }
        } else {
            newParts = [{ source_wallet: record.sourceWallet || 'expenses', amount }];
        }

        const temporaryBalances = { ...walletBalances };
        oldParts.forEach((part) => {
            const key = getWalletBalanceKey(part.source_wallet);
            temporaryBalances[key] = Number(temporaryBalances[key] || 0) + Number(part.amount || 0);
        });
        for (const part of newParts) {
            const key = getWalletBalanceKey(part.source_wallet);
            if (Number(part.amount || 0) > Number(temporaryBalances[key] || 0)) {
                throw new Error('wallet_balance_insufficient');
            }
            temporaryBalances[key] = Number(temporaryBalances[key] || 0) - Number(part.amount || 0);
        }
        temporaryBalances.total_spent = Number(walletBalances.total_spent || 0) - Number(record.amount || 0) + amount;

        if (isDemoMode()) {
            record.amount = amount;
            record.description = note;
            record.date = date;
            record.sourceWallet = newParts[0]?.source_wallet || record.sourceWallet || 'expenses';
            record.walletSplits = record.walletSplits && record.walletSplits.length ? newParts : [];
            walletBalances = normalizeWalletBalances(temporaryBalances);
            return;
        }

        const { error } = await supabaseClient
            .from('transactions')
            .update({
                amount,
                note,
                transaction_date: date,
                source_wallet: newParts[0]?.source_wallet || record.sourceWallet || 'expenses',
            })
            .eq('id', record.id)
            .eq('user_id', requireFinancialUser());

        if (error) throw error;

        if (record.walletSplits && record.walletSplits.length) {
            const deleteResult = await supabaseClient
                .from('transaction_wallet_splits')
                .delete()
                .eq('transaction_id', record.id)
                .eq('user_id', requireFinancialUser());
            if (deleteResult.error) throw deleteResult.error;

            const insertResult = await supabaseClient
                .from('transaction_wallet_splits')
                .insert(newParts.map(part => ({
                    transaction_id: record.id,
                    user_id: requireFinancialUser(),
                    source_wallet: part.source_wallet,
                    amount: part.amount,
                })));
            if (insertResult.error) throw insertResult.error;
        }

        await saveWalletBalances(temporaryBalances);
    }

    async function updateTransferRecord(record, amount, note, date) {
        const temporaryBalances = {
            ...walletBalances,
            [getWalletBalanceKey(record.fromWallet)]: getWalletBalance(record.fromWallet) + Number(record.amount || 0),
            [getWalletBalanceKey(record.toWallet)]: getWalletBalance(record.toWallet) - Number(record.amount || 0),
        };

        const fromKey = getWalletBalanceKey(record.fromWallet);
        if (amount > Number(temporaryBalances[fromKey] || 0)) {
            throw new Error('wallet_balance_insufficient');
        }

        temporaryBalances[fromKey] = Number(temporaryBalances[fromKey] || 0) - amount;
        temporaryBalances[getWalletBalanceKey(record.toWallet)] = Number(temporaryBalances[getWalletBalanceKey(record.toWallet)] || 0) + amount;

        if (isDemoMode()) {
            record.amount = amount;
            record.description = note;
            record.date = date;
            walletBalances = normalizeWalletBalances(temporaryBalances);
            return;
        }

        const { error } = await supabaseClient
            .from('wallet_transfers')
            .update({
                amount,
                note,
                transfer_date: date,
            })
            .eq('id', record.id)
            .eq('user_id', requireFinancialUser());

        if (error) throw error;
        await saveWalletBalances(temporaryBalances);
    }

    function updateAuthMode(mode, options = {}) {
        authMode = mode === 'signup' ? 'signup' : 'login';

        const isSignup = authMode === 'signup';
        if (dom.authTitle) {
            dom.authTitle.textContent = isSignup ? 'إنشاء حساب Cashgo' : 'تسجيل الدخول إلى Cashgo';
        }
        if (dom.authSubtitle) {
            dom.authSubtitle.textContent = isSignup
                ? 'أنشئ حسابك لحفظ بياناتك بأمان'
                : 'سجّل دخولك لحفظ بياناتك والرجوع لها من أي جهاز';
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
        [dom.authLoginBtn, dom.authSignupBtn, dom.authGoogleBtn].forEach((btn) => {
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

    function unlockApp() {
        dom.app.classList.remove('hidden');
        updateHome();
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

        if (dom.splitExpenseCheckbox) {
            dom.splitExpenseCheckbox.addEventListener('change', () => {
                const isSplit = dom.splitExpenseCheckbox.checked;
                dom.splitExpensePanel.classList.toggle('hidden', !isSplit);
                if (dom.sourceWalletToggle) {
                    dom.sourceWalletToggle.classList.toggle('muted-control', isSplit);
                }
                if (!isSplit) {
                    resetSplitExpenseFields();
                }
            });
        }

        // Add expense
        dom.addExpenseBtn.addEventListener('click', addExpense);

        // Add income
        dom.addIncomeBtn.addEventListener('click', addIncome);

        if (dom.editDistributionBtn) {
            dom.editDistributionBtn.addEventListener('click', openDistributionModal);
        }

        if (dom.openTransferBtn) {
            dom.openTransferBtn.addEventListener('click', openTransferModal);
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

        if (dom.closeTransfer) {
            dom.closeTransfer.addEventListener('click', closeTransferModal);
        }

        if (dom.cancelTransfer) {
            dom.cancelTransfer.addEventListener('click', closeTransferModal);
        }

        if (dom.transferModal) {
            dom.transferModal.addEventListener('click', (e) => {
                if (e.target === dom.transferModal) closeTransferModal();
            });
        }

        if (dom.saveTransferBtn) {
            dom.saveTransferBtn.addEventListener('click', handleWalletTransfer);
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

        if (dom.recordFilterTabs) {
            dom.recordFilterTabs.addEventListener('click', (event) => {
                const btn = event.target.closest('.record-filter-btn');
                if (!btn) return;
                recordFilterMode = btn.dataset.filter;
                updateAnalytics();
            });
        }

        if (dom.recordTypeTabs) {
            dom.recordTypeTabs.addEventListener('click', (event) => {
                const btn = event.target.closest('.record-type-btn');
                if (!btn) return;
                recordTypeFilter = btn.dataset.type || 'all';
                updateAnalytics();
            });
        }

        if (dom.exportRecordsBtn) {
            dom.exportRecordsBtn.addEventListener('click', exportFilteredRecords);
        }

        [dom.filterFromDate, dom.filterToDate].forEach((input) => {
            if (!input) return;
            input.addEventListener('change', () => {
                recordFilterMode = 'custom';
                updateAnalytics();
            });
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

        if (dom.appearanceModeToggle) {
            dom.appearanceModeToggle.addEventListener('click', (event) => {
                const btn = event.target.closest('.appearance-mode-btn');
                if (!btn) return;
                handleAppearanceChange({ theme: btn.dataset.themeMode });
            });
        }

        if (dom.languageToggle) {
            dom.languageToggle.addEventListener('click', (event) => {
                const btn = event.target.closest('.language-btn');
                if (!btn) return;
                saveUiLanguage(btn.dataset.language);
                showToast(btn.dataset.language === 'ar' ? 'تم اختيار اللغة العربية' : 'English selected');
            });
        }

        if (dom.colorThemeGrid) {
            dom.colorThemeGrid.addEventListener('click', (event) => {
                const btn = event.target.closest('.theme-card');
                if (!btn) return;
                handleAppearanceChange({ color_theme: btn.dataset.colorTheme });
            });
        }

        if (dom.openBannerAdminBtn) {
            dom.openBannerAdminBtn.addEventListener('click', openBannerAdminModal);
        }

        if (dom.closeBannerAdmin) {
            dom.closeBannerAdmin.addEventListener('click', closeBannerAdminModal);
        }

        if (dom.bannerAdminModal) {
            dom.bannerAdminModal.addEventListener('click', (event) => {
                if (event.target === dom.bannerAdminModal) closeBannerAdminModal();
            });
        }

        if (dom.resetBannerFormBtn) {
            dom.resetBannerFormBtn.addEventListener('click', resetBannerAdminForm);
        }

        if (dom.saveBannerBtn) {
            dom.saveBannerBtn.addEventListener('click', saveBannerAdminItem);
        }

        if (dom.bannerAdminList) {
            dom.bannerAdminList.addEventListener('click', (event) => {
                const actionBtn = event.target.closest('button[data-action]');
                const item = event.target.closest('.banner-admin-item');
                if (!actionBtn || !item) return;

                const banner = bannerAdminItems.find((entry) => entry.id === item.dataset.id);
                if (!banner) return;

                if (actionBtn.dataset.action === 'edit') {
                    fillBannerAdminForm(banner);
                } else if (actionBtn.dataset.action === 'delete') {
                    deleteBannerAdminItem(banner.id);
                }
            });
        }

        dom.clearDataBtn.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                if (isDemoMode()) {
                    transactions = [];
                    walletBalances = { ...DEFAULT_WALLET_BALANCES };
                    clearDemoData();
                    saveDemoData();
                    updateHome();
                    updateAnalytics();
                    dom.settingsModal.classList.remove('active');
                    showToast('تم مسح بيانات التجربة');
                    return;
                }

                try {
                    const userId = requireFinancialUser();
                    const [incomeDelete, expenseDelete, transferDelete] = await Promise.all([
                        supabaseClient.from('incomes').delete().eq('user_id', userId),
                        supabaseClient.from('transactions').delete().eq('user_id', userId),
                        supabaseClient.from('wallet_transfers').delete().eq('user_id', userId),
                    ]);

                    if (incomeDelete.error) throw incomeDelete.error;
                    if (expenseDelete.error) throw expenseDelete.error;
                    if (transferDelete.error) throw transferDelete.error;

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

        if (dom.closeRecordDetail) {
            dom.closeRecordDetail.addEventListener('click', closeRecordDetailModal);
        }

        if (dom.recordDetailModal) {
            dom.recordDetailModal.addEventListener('click', (event) => {
                if (event.target === dom.recordDetailModal) closeRecordDetailModal();
            });
        }

        if (dom.detailEditBtn) {
            dom.detailEditBtn.addEventListener('click', () => {
                if (!detailTargetId) return;
                const id = detailTargetId;
                closeRecordDetailModal();
                openEditRecordModal(id);
            });
        }

        if (dom.detailDeleteBtn) {
            dom.detailDeleteBtn.addEventListener('click', () => {
                if (!detailTargetId) return;
                deleteTargetId = detailTargetId;
                closeRecordDetailModal();
                dom.deleteModal.classList.add('active');
            });
        }

        if (dom.closeEditRecord) {
            dom.closeEditRecord.addEventListener('click', closeEditRecordModal);
        }

        if (dom.cancelEditRecord) {
            dom.cancelEditRecord.addEventListener('click', closeEditRecordModal);
        }

        if (dom.editRecordModal) {
            dom.editRecordModal.addEventListener('click', (event) => {
                if (event.target === dom.editRecordModal) closeEditRecordModal();
            });
        }

        if (dom.saveEditRecord) {
            dom.saveEditRecord.addEventListener('click', handleSaveEditedRecord);
        }

        // See all transactions
        dom.seeAllBtn.addEventListener('click', () => {
            navigateTo('analytics');
        });

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
        let walletParts = [];
        try {
            walletParts = getSplitExpenseParts(amount);
            validateWalletParts(walletParts);
            if (dom.splitExpenseError) dom.splitExpenseError.textContent = '';
        } catch (error) {
            if (error.message === 'split_sum_invalid') {
                if (dom.splitExpenseError) {
                    dom.splitExpenseError.textContent = 'يجب أن يساوي مجموع التقسيم مبلغ المصروف';
                }
                showToast('مجموع التقسيم غير مطابق للمبلغ');
                return;
            }

            if (error.message === 'wallet_balance_insufficient') {
                showToast('الرصيد غير كافٍ في هذه الخانة');
                return;
            }

            throw error;
        }

        const expenseDate = dom.expenseDate.value || new Date().toISOString().split('T')[0];
        const category = activeCategory ? activeCategory.dataset.category : 'food';
        const paymentMethod = activePayment ? activePayment.dataset.method : 'cash';
        const sourceWallet = walletParts[0] ? walletParts[0].source_wallet : 'expenses';

        if (isDemoMode()) {
            const demoId = `demo-${generateId()}`;
            const expenseRecord = {
                id: demoId,
                type: 'expense',
                amount,
                description: dom.expenseDesc.value.trim(),
                category,
                sourceWallet,
                walletSplits: walletParts.length > 1 ? walletParts : [],
                paymentMethod,
                date: expenseDate,
                createdAt: Date.now(),
            };

            transactions = [expenseRecord, ...transactions].sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
            walletBalances = applyExpensePartsToBalances(walletParts, amount);
            saveDemoData();
            incrementDemoActionCount();
            updateHome();
            updateAnalytics();

            dom.expenseAmount.value = '';
            dom.expenseDesc.value = '';
            if (dom.splitExpenseCheckbox) {
                dom.splitExpenseCheckbox.checked = false;
                dom.splitExpensePanel.classList.add('hidden');
            }
            resetSplitExpenseFields();
            showToast('تمت إضافة المصروف في وضع التجربة');
            setTimeout(() => navigateTo('home'), 500);
            return;
        }

        try {
            dom.addExpenseBtn.disabled = true;
            const userId = requireFinancialUser();

            const { data: insertedTransaction, error } = await supabaseClient
                .from('transactions')
                .insert({
                    user_id: userId,
                    amount,
                    category,
                    source_wallet: sourceWallet,
                    payment_method: paymentMethod,
                    note: dom.expenseDesc.value.trim(),
                    transaction_date: expenseDate,
                })
                .select('id')
                .single();

            if (error) throw error;

            if (walletParts.length > 1) {
                const splitPayload = walletParts.map((part) => ({
                    transaction_id: insertedTransaction.id,
                    user_id: userId,
                    source_wallet: part.source_wallet,
                    amount: part.amount,
                }));

                const { error: splitError } = await supabaseClient
                    .from('transaction_wallet_splits')
                    .insert(splitPayload);

                if (splitError) throw splitError;
            }

            await saveWalletBalances(applyExpensePartsToBalances(walletParts, amount));
            await loadRecentRecords();
            updateHome();

            dom.expenseAmount.value = '';
            dom.expenseDesc.value = '';
            if (dom.splitExpenseCheckbox) {
                dom.splitExpenseCheckbox.checked = false;
                dom.splitExpensePanel.classList.add('hidden');
            }
            resetSplitExpenseFields();

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

        const expensesAmount = amount * Number(userSettings.expenses_percentage || 0) / 100;
        const savingsAmount = amount * Number(userSettings.savings_percentage || 0) / 100;
        const emergencyAmount = amount * Number(userSettings.emergency_percentage || 0) / 100;
        const incomeDate = dom.incomeDate.value || new Date().toISOString().split('T')[0];

        if (isDemoMode()) {
            const incomeRecord = {
                id: `demo-${generateId()}`,
                type: 'income',
                amount,
                description: dom.incomeDesc.value.trim(),
                date: incomeDate,
                createdAt: Date.now(),
                expensesAmount,
                savingsAmount,
                emergencyAmount,
            };

            transactions = [incomeRecord, ...transactions].sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
            walletBalances = normalizeWalletBalances({
                expenses_balance: Number(walletBalances.expenses_balance || 0) + expensesAmount,
                savings_balance: Number(walletBalances.savings_balance || 0) + savingsAmount,
                emergency_balance: Number(walletBalances.emergency_balance || 0) + emergencyAmount,
                total_income: Number(walletBalances.total_income || 0) + amount,
                total_spent: Number(walletBalances.total_spent || 0),
            });
            saveDemoData();
            incrementDemoActionCount();
            updateHome();
            updateAnalytics();

            dom.incomeAmount.value = '';
            dom.incomeDesc.value = '';
            showToast('تمت إضافة الدخل في وضع التجربة');
            setTimeout(() => navigateTo('home'), 500);
            return;
        }

        try {
            dom.addIncomeBtn.disabled = true;
            const userId = requireFinancialUser();

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
            if (isDemoMode()) {
                if (tx.type === 'income') {
                    walletBalances = normalizeWalletBalances({
                        expenses_balance: Number(walletBalances.expenses_balance || 0) - Number(tx.expensesAmount || 0),
                        savings_balance: Number(walletBalances.savings_balance || 0) - Number(tx.savingsAmount || 0),
                        emergency_balance: Number(walletBalances.emergency_balance || 0) - Number(tx.emergencyAmount || 0),
                        total_income: Number(walletBalances.total_income || 0) - Number(tx.amount || 0),
                        total_spent: Number(walletBalances.total_spent || 0),
                    });
                } else if (tx.type === 'expense') {
                    const refundParts = tx.walletSplits && tx.walletSplits.length
                        ? tx.walletSplits
                        : [{ source_wallet: tx.sourceWallet || 'expenses', amount: Number(tx.amount || 0) }];
                    const nextBalances = { ...walletBalances };
                    refundParts.forEach((part) => {
                        const key = getWalletBalanceKey(part.source_wallet);
                        nextBalances[key] = Number(nextBalances[key] || 0) + Number(part.amount || 0);
                    });
                    nextBalances.total_spent = Math.max(0, Number(walletBalances.total_spent || 0) - Number(tx.amount || 0));
                    walletBalances = normalizeWalletBalances(nextBalances);
                } else if (tx.type === 'transfer') {
                    walletBalances = normalizeWalletBalances({
                        ...walletBalances,
                        [getWalletBalanceKey(tx.fromWallet)]: getWalletBalance(tx.fromWallet) + Number(tx.amount || 0),
                        [getWalletBalanceKey(tx.toWallet)]: getWalletBalance(tx.toWallet) - Number(tx.amount || 0),
                    });
                }

                transactions = transactions.filter(item => item.id !== id);
                saveDemoData();
                updateHome();
                updateAnalytics();
                showToast('تم حذف المعاملة من التجربة');
                return;
            }

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
            } else if (tx.type === 'expense') {
                const { error } = await supabaseClient
                    .from('transactions')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', requireFinancialUser());

                if (error) throw error;

                const refundParts = tx.walletSplits && tx.walletSplits.length
                    ? tx.walletSplits
                    : [{ source_wallet: tx.sourceWallet || 'expenses', amount: Number(tx.amount || 0) }];
                const nextBalances = { ...walletBalances };
                refundParts.forEach((part) => {
                    const key = getWalletBalanceKey(part.source_wallet);
                    nextBalances[key] = Number(nextBalances[key] || 0) + Number(part.amount || 0);
                });
                nextBalances.total_spent = Math.max(0, Number(walletBalances.total_spent || 0) - Number(tx.amount || 0));

                await saveWalletBalances(nextBalances);
            } else if (tx.type === 'transfer') {
                const { error } = await supabaseClient
                    .from('wallet_transfers')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', requireFinancialUser());

                if (error) throw error;

                await saveWalletBalances({
                    ...walletBalances,
                    [getWalletBalanceKey(tx.fromWallet)]: getWalletBalance(tx.fromWallet) + Number(tx.amount || 0),
                    [getWalletBalanceKey(tx.toWallet)]: getWalletBalance(tx.toWallet) - Number(tx.amount || 0),
                });
            }

            await loadRecentRecords();
            updateHome();
            updateAnalytics();
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
        div.dataset.recordId = tx.id;

        if (tx.type === 'expense') {
            const cat = CATEGORIES[tx.category] || CATEGORIES.food;
            const paymentLabel = tx.paymentMethod === 'cash' ? 'كاش' : 'بطاقة';
            const paymentClass = tx.paymentMethod === 'cash' ? 'badge-cash' : 'badge-card';
            const walletLabel = tx.walletSplits && tx.walletSplits.length
                ? 'مقسم'
                : (WALLET_LABELS[tx.sourceWallet] || WALLET_LABELS.expenses);
            const dateFormatted = formatDate(tx.date);

            div.innerHTML = `
                <div class="transaction-icon expense-type">${cat.emoji}</div>
                <div class="transaction-info">
                    <div class="transaction-category">
                        ${cat.label}
                        <span class="payment-badge ${paymentClass}">${paymentLabel}</span>
                        <span class="payment-badge badge-wallet">${walletLabel}</span>
                    </div>
                    <div class="transaction-desc">${escapeHTML(tx.description || 'بدون وصف')}</div>
                    <span class="transaction-date-text">${dateFormatted}</span>
                </div>
                <div>
                    <span class="transaction-amount expense">-${formatMoney(tx.amount)}</span>
                </div>
                ${getRecordActionsHTML()}
            `;
        } else if (tx.type === 'income') {
            const dateFormatted = formatDate(tx.date);
            div.innerHTML = `
                <div class="transaction-icon income-type">💰</div>
                <div class="transaction-info">
                    <div class="transaction-category">دخل</div>
                    <div class="transaction-desc">${escapeHTML(tx.description || 'بدون وصف')}</div>
                    <span class="transaction-date-text">${dateFormatted}</span>
                </div>
                <div>
                    <span class="transaction-amount income">+${formatMoney(tx.amount)}</span>
                </div>
                ${getRecordActionsHTML()}
            `;
        } else {
            const dateFormatted = formatDate(tx.date);
            div.innerHTML = `
                <div class="transaction-icon transfer-type">⇄</div>
                <div class="transaction-info">
                    <div class="transaction-category">تحويل</div>
                    <div class="transaction-desc">${WALLET_LABELS[tx.fromWallet]} ← ${WALLET_LABELS[tx.toWallet]}${tx.description ? ` - ${escapeHTML(tx.description)}` : ''}</div>
                    <span class="transaction-date-text">${dateFormatted}</span>
                </div>
                <div>
                    <span class="transaction-amount transfer">${formatMoney(tx.amount)}</span>
                </div>
                ${getRecordActionsHTML()}
            `;
        }

        const deleteBtn = div.querySelector('.transaction-delete');
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteTargetId = tx.id;
            dom.deleteModal.classList.add('active');
        });

        const editBtn = div.querySelector('.transaction-edit');
        editBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            openEditRecordModal(tx.id);
        });

        div.addEventListener('click', () => {
            openRecordDetailModal(tx.id);
        });

        return div;
    }

    function getRecordActionsHTML() {
        return `
            <div class="transaction-actions">
                <button class="transaction-edit" type="button" aria-label="تعديل">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                </button>
                <button class="transaction-delete" type="button" aria-label="حذف">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
    }

    function getRecordTitle(record) {
        if (record.type === 'income') return 'دخل';
        if (record.type === 'transfer') return 'تحويل بين المحافظ';
        const cat = CATEGORIES[record.category] || CATEGORIES.food;
        return cat.label;
    }

    function getRecordSubtitle(record) {
        if (record.type === 'income') return record.description || 'بدون وصف';
        if (record.type === 'transfer') {
            return `${WALLET_LABELS[record.fromWallet]} ← ${WALLET_LABELS[record.toWallet]}`;
        }
        const walletLabel = record.walletSplits && record.walletSplits.length
            ? 'مصروف مقسّم'
            : (WALLET_LABELS[record.sourceWallet] || WALLET_LABELS.expenses);
        const paymentLabel = record.paymentMethod === 'cash' ? 'كاش' : 'بطاقة';
        return `${walletLabel} · ${paymentLabel}`;
    }

    function getRecordSignedAmount(record) {
        if (record.type === 'income') return `+${formatMoneyWithCurrency(record.amount)}`;
        if (record.type === 'expense') return `-${formatMoneyWithCurrency(record.amount)}`;
        return formatMoneyWithCurrency(record.amount);
    }

    function getRecordDetailRows(record) {
        const rows = [
            ['المبلغ', getRecordSignedAmount(record)],
            ['التاريخ', formatDate(record.date)],
            ['الوصف', record.description || 'بدون وصف'],
        ];

        if (record.type === 'income') {
            rows.push(
                ['للمصروفات', formatMoneyWithCurrency(record.expensesAmount || 0)],
                ['للاَدخار', formatMoneyWithCurrency(record.savingsAmount || 0)],
                ['للطوارئ', formatMoneyWithCurrency(record.emergencyAmount || 0)],
            );
        } else if (record.type === 'expense') {
            const cat = CATEGORIES[record.category] || CATEGORIES.food;
            rows.push(
                ['التصنيف', cat.label],
                ['طريقة الدفع', record.paymentMethod === 'cash' ? 'كاش' : 'بطاقة'],
            );

            if (record.walletSplits && record.walletSplits.length) {
                rows.push([
                    'تقسيم المحافظ',
                    record.walletSplits
                        .map((part) => `${WALLET_LABELS[part.source_wallet]}: ${formatMoneyWithCurrency(part.amount)}`)
                        .join(' / '),
                ]);
            } else {
                rows.push(['المحفظة', WALLET_LABELS[record.sourceWallet] || WALLET_LABELS.expenses]);
            }
        } else {
            rows.push(
                ['من محفظة', WALLET_LABELS[record.fromWallet] || record.fromWallet],
                ['إلى محفظة', WALLET_LABELS[record.toWallet] || record.toWallet],
            );
        }

        return rows;
    }

    function openRecordDetailModal(recordId) {
        const record = transactions.find((item) => item.id === recordId);
        if (!record || !dom.recordDetailModal || !dom.recordDetailBody) return;

        detailTargetId = record.id;
        dom.recordDetailTitle.textContent = getRecordTitle(record);
        dom.recordDetailBody.innerHTML = `
            <div class="record-detail-amount ${record.type}">${getRecordSignedAmount(record)}</div>
            <div class="record-detail-subtitle">${escapeHTML(getRecordSubtitle(record))}</div>
            <div class="record-detail-rows">
                ${getRecordDetailRows(record).map(([label, value]) => `
                    <div class="record-detail-row">
                        <span>${escapeHTML(label)}</span>
                        <strong>${escapeHTML(String(value))}</strong>
                    </div>
                `).join('')}
            </div>
        `;
        dom.recordDetailModal.classList.add('active');
    }

    function closeRecordDetailModal() {
        detailTargetId = null;
        if (dom.recordDetailModal) {
            dom.recordDetailModal.classList.remove('active');
        }
    }

    function csvEscape(value) {
        const text = String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    }

    function exportFilteredRecords() {
        const records = getFilteredRecords();
        if (!records.length) {
            showToast('لا توجد عمليات للتصدير');
            return;
        }

        const header = ['النوع', 'التاريخ', 'المبلغ', 'الوصف', 'التصنيف/المحفظة', 'طريقة الدفع'];
        const rows = records.map((record) => {
            const type = record.type === 'income' ? 'دخل' : record.type === 'expense' ? 'مصروف' : 'تحويل';
            const category = record.type === 'expense'
                ? getRecordSubtitle(record)
                : record.type === 'transfer'
                    ? `${WALLET_LABELS[record.fromWallet]} إلى ${WALLET_LABELS[record.toWallet]}`
                    : 'توزيع الدخل';
            const payment = record.type === 'expense'
                ? (record.paymentMethod === 'cash' ? 'كاش' : 'بطاقة')
                : '';

            return [
                type,
                record.date,
                record.amount,
                record.description || '',
                category,
                payment,
            ];
        });

        const csv = [header, ...rows]
            .map((row) => row.map(csvEscape).join(','))
            .join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cashgo-records-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('تم تصدير السجل');
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

    function getRecordFilterRange() {
        const now = new Date();
        const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

        if (recordFilterMode === 'today') {
            return { from: startOfDay(now), to: endOfDay(now) };
        }

        if (recordFilterMode === 'lastMonth') {
            return {
                from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
            };
        }

        if (recordFilterMode === 'custom') {
            const from = parseTransactionDate(dom.filterFromDate && dom.filterFromDate.value);
            const to = parseTransactionDate(dom.filterToDate && dom.filterToDate.value);
            return {
                from: from ? startOfDay(from) : null,
                to: to ? endOfDay(to) : null,
            };
        }

        return {
            from: new Date(now.getFullYear(), now.getMonth(), 1),
            to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        };
    }

    function isRecordInFilter(record) {
        const date = parseTransactionDate(record.date);
        if (!date) return false;
        const { from, to } = getRecordFilterRange();
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
    }

    function getFilteredRecords() {
        return transactions
            .filter(isRecordInFilter)
            .filter((record) => recordTypeFilter === 'all' || record.type === recordTypeFilter)
            .sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
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
        updateRecordsPanel();
    }

    function updateRecordsPanel() {
        if (!dom.analyticsRecordsList) return;

        dom.recordFilterTabs.querySelectorAll('.record-filter-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.filter === recordFilterMode);
        });

        if (dom.recordTypeTabs) {
            dom.recordTypeTabs.querySelectorAll('.record-type-btn').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.type === recordTypeFilter);
            });
        }

        if (dom.customFilterRow) {
            dom.customFilterRow.classList.toggle('hidden', recordFilterMode !== 'custom');
        }

        const records = getFilteredRecords();
        const periodIncome = records
            .filter(record => record.type === 'income')
            .reduce((sum, record) => sum + record.amount, 0);
        const periodExpenses = records
            .filter(record => record.type === 'expense')
            .reduce((sum, record) => sum + record.amount, 0);
        const categoryTotals = {};
        records
            .filter(record => record.type === 'expense')
            .forEach((record) => {
                categoryTotals[record.category] = (categoryTotals[record.category] || 0) + record.amount;
            });
        const topCategoryKey = Object.keys(categoryTotals)
            .sort((a, b) => categoryTotals[b] - categoryTotals[a])[0];

        dom.periodIncome.textContent = formatMoneyWithCurrency(periodIncome);
        dom.periodExpenses.textContent = formatMoneyWithCurrency(periodExpenses);
        dom.periodNet.textContent = formatMoneyWithCurrency(periodIncome - periodExpenses);
        dom.topCategory.textContent = topCategoryKey
            ? `${CATEGORIES[topCategoryKey]?.label || topCategoryKey} (${formatMoney(categoryTotals[topCategoryKey])})`
            : 'لا يوجد';
        if (dom.periodCount) {
            dom.periodCount.textContent = String(records.length);
        }

        if (records.length === 0) {
            dom.analyticsRecordsList.innerHTML = '';
            dom.analyticsRecordsList.appendChild(createEmptyState());
            return;
        }

        dom.analyticsRecordsList.innerHTML = '';
        records.forEach((record) => {
            dom.analyticsRecordsList.appendChild(createTransactionElement(record));
        });
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

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js?v=34', { scope: './' })
                .then((registration) => {
                    registration.update();
                })
                .catch((error) => {
                    console.warn('Service worker registration failed:', error);
                });
        });
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

    registerServiceWorker();

})();
