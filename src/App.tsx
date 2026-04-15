import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, Check, X, AlertCircle, PieChart, Target, 
  Settings, Download, Upload, CreditCard, ArrowDownRight, ArrowUpRight, 
  RefreshCw, Eye, EyeOff, Calendar, Wallet, TrendingUp, Activity, 
  Landmark, Smartphone, Palette, Globe, AlertTriangle, ChevronRight,
  Bitcoin, Banknote, CreditCard as CardIcon, ChevronLeft, Lock, Fingerprint, ShieldCheck, User,
  MessageSquare, Users, Shield, WifiOff, Sparkles, Home, ChevronRight as ChevronRightIcon,
  Moon, Sun, Info
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import Gam3eyaTab from './components/Gam3eyaTab';

// --- Types ---
type TransactionType = 'income' | 'expense' | 'debt';
type Language = 'en' | 'ar';
type Theme = 'frosted' | 'midnight' | 'emerald' | 'sunset' | 'programmer' | 'girly' | 'business' | 'gamer';

interface WalletType {
  id: string;
  name: string;
  icon: string; // ID of the SVG icon
}

interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  date: string;
  walletId?: string;
}

interface Gam3eyaMember {
  id: string;
  name: string;
  isPaid: boolean;
  payoutMonth: number;
}

interface Gam3eya {
  id: string;
  name: string;
  monthlyAmount: number;
  totalMonths: number;
  currentMonth: number;
  startDate: string;
  members: Gam3eyaMember[];
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'EGP', symbol: 'E£', label: 'Egyptian Pound' },
  { code: 'SAR', symbol: 'SR', label: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
];

const getTheme = (themeName: Theme, isDark: boolean) => {
  const themes: Record<Theme, any> = {
    frosted: {
      bg: isDark ? 'bg-[#0B1120]' : 'bg-slate-50',
      card: isDark ? 'from-slate-800/90 to-slate-900/90' : 'from-white/90 to-slate-100/90',
      accent: 'text-sky-500',
      btn: 'bg-sky-500 hover:bg-sky-400 text-white',
      shadow: 'shadow-sky-500/20',
      gradient: isDark ? 'radial-gradient(circle at 15% 50%, rgba(56, 189, 248, 0.08), transparent 25%), radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08), transparent 25%)' : 'radial-gradient(circle at 15% 50%, rgba(56, 189, 248, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.15), transparent 25%)',
      text: isDark ? 'text-slate-50' : 'text-slate-900'
    },
    midnight: {
      bg: isDark ? 'bg-[#000000]' : 'bg-zinc-100',
      card: isDark ? 'from-zinc-900/90 to-black/90' : 'from-white/90 to-zinc-50/90',
      accent: isDark ? 'text-white' : 'text-zinc-900',
      btn: 'bg-zinc-800 hover:bg-zinc-700 text-white',
      shadow: 'shadow-zinc-500/20',
      gradient: 'none',
      text: isDark ? 'text-white' : 'text-zinc-900'
    },
    emerald: {
      bg: isDark ? 'bg-[#022c22]' : 'bg-emerald-50',
      card: isDark ? 'from-emerald-900/90 to-emerald-950/90' : 'from-white/90 to-emerald-100/90',
      accent: 'text-emerald-500',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      shadow: 'shadow-emerald-500/20',
      gradient: isDark ? 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15), transparent 50%)' : 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.2), transparent 50%)',
      text: isDark ? 'text-emerald-50' : 'text-emerald-950'
    },
    sunset: {
      bg: isDark ? 'bg-[#431407]' : 'bg-orange-50',
      card: isDark ? 'from-orange-900/90 to-rose-950/90' : 'from-white/90 to-orange-100/90',
      accent: 'text-orange-500',
      btn: 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white',
      shadow: 'shadow-orange-500/20',
      gradient: isDark ? 'radial-gradient(circle at 100% 100%, rgba(249, 115, 22, 0.15), transparent 50%)' : 'radial-gradient(circle at 100% 100%, rgba(249, 115, 22, 0.2), transparent 50%)',
      text: isDark ? 'text-orange-50' : 'text-orange-950'
    },
    programmer: {
      bg: isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]',
      card: isDark ? 'from-[#161b22]/90 to-[#0d1117]/90' : 'from-white/90 to-[#f6f8fa]/90',
      accent: 'text-[#0969da]',
      btn: 'bg-[#238636] hover:bg-[#2ea043] border border-[#f0f6fc1a] text-white',
      shadow: 'shadow-[#58a6ff]/10',
      gradient: 'none',
      text: isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'
    },
    girly: {
      bg: isDark ? 'bg-[#4a044e]' : 'bg-[#fdf2f8]',
      card: isDark ? 'from-fuchsia-900/90 to-pink-950/90' : 'from-pink-100/90 to-rose-50/90',
      accent: isDark ? 'text-pink-400' : 'text-pink-500',
      btn: 'bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-pink-200 text-white',
      shadow: 'shadow-pink-500/20',
      gradient: isDark ? 'radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.15), transparent 70%)' : 'radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.1), transparent 70%)',
      text: isDark ? 'text-pink-50' : 'text-slate-800'
    },
    business: {
      bg: isDark ? 'bg-[#0f172a]' : 'bg-slate-100',
      card: isDark ? 'from-slate-800/90 to-slate-900/90' : 'from-white/90 to-slate-50/90',
      accent: isDark ? 'text-blue-400' : 'text-blue-600',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white',
      shadow: 'shadow-blue-500/20',
      gradient: 'none',
      text: isDark ? 'text-slate-200' : 'text-slate-800'
    },
    gamer: {
      bg: isDark ? 'bg-[#09090b]' : 'bg-zinc-100',
      card: isDark ? 'from-zinc-900/90 to-black/90' : 'from-white/90 to-zinc-50/90',
      accent: 'text-[#00ff00]',
      btn: 'bg-[#00ff00] hover:bg-[#00cc00] text-black font-bold uppercase tracking-widest',
      shadow: 'shadow-[#00ff00]/20',
      gradient: isDark ? 'radial-gradient(circle at 50% 0%, rgba(0, 255, 0, 0.1), transparent 50%)' : 'radial-gradient(circle at 50% 0%, rgba(0, 255, 0, 0.2), transparent 50%)',
      text: isDark ? 'text-zinc-100' : 'text-zinc-900'
    }
  };
  return themes[themeName] || themes.frosted;
};

// --- Custom SVGs for Wallets ---
const WALLET_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-5 h-5" />,
  bank: <Landmark className="w-5 h-5" />,
  mobile: <Smartphone className="w-5 h-5" />,
  card: <CardIcon className="w-5 h-5" />,
  crypto: <Bitcoin className="w-5 h-5" />,
  wallet: <Wallet className="w-5 h-5" />
};

// --- Translations ---
const dict = {
  en: {
    brand: "Money Note",
    tagline: "Smarter spending for a clearer future",
    availableBalance: "Available Balance",
    dailyAllowance: "Daily Allowance",
    totalIncome: "Total Income",
    fixedExpenses: "Fixed Expenses",
    debtsSavings: "Debts & Savings",
    analytics: "Analytics",
    settings: "Settings",
    income: "Income",
    expense: "Expense",
    debt: "Debt",
    addTransaction: "Add Transaction",
    name: "Name",
    amount: "Amount",
    date: "Date",
    type: "Type",
    wallet: "Payment Method",
    noTransactions: "No transactions recorded yet.",
    savingsGoal: "Savings Goal",
    language: "Language",
    currency: "Currency",
    theme: "Theme",
    exportData: "Export Data",
    importData: "Import Data",
    resetData: "Reset Data",
    resetConfirmTitle: "Reset All Data?",
    resetConfirmMsg: "This will permanently delete all your data. This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Yes, Reset",
    goalProgress: "Savings Goal Progress",
    goalMet: "Goal met! 🎉",
    moreToGo: "more to go",
    errorName: "Name cannot be empty",
    errorAmount: "Amount must be a positive number",
    errorDate: "Please select a valid date",
    financialBreakdown: "Financial Analytics",
    recentTransactions: "Recent Transactions",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    allTime: "All Time",
    thisMonth: "This Month",
    cashFlow: "Cash Flow",
    distribution: "Distribution",
    wallets: "Payment Methods",
    addWallet: "Add Method",
    editWallet: "Edit Method",
    walletName: "Method Name",
    selectIcon: "Select Icon",
    dailyLimitWarning: "⚠️ Daily limit exceeded! You've spent more than your daily allowance today.",
    monthlyLimitWarning: "🚨 Monthly limit exceeded! Your expenses have surpassed your total income.",
    convertedTo: "Converted to",
    today: "Today",
    yesterday: "Yesterday",
    setupWelcome: "Welcome to Money Planner",
    setupDesc: "Let's set up your financial profile to get started.",
    setupName: "What should we call you?",
    setupCurrency: "Choose your primary currency",
    setupPin: "Set a 4-digit PIN for security (Optional)",
    setupPinPlaceholder: "0000",
    setupStart: "Get Started",
    enterPin: "Enter your PIN to access",
    unlock: "Unlock",
    wrongPin: "Incorrect PIN. Try again.",
    security: "Security",
    enablePin: "Enable PIN Protection",
    changePin: "Change PIN",
    removePin: "Remove PIN",
    biometricAuth: "Biometric Authentication",
    biometricDesc: "Use fingerprint or face ID to unlock",
    hello: "Hello",
    onboarding1Title: "Total Privacy",
    onboarding1Desc: "100% Offline. Your data never leaves your device. No servers, no tracking.",
    onboarding2Title: "Smart Tracking",
    onboarding2Desc: "Track expenses, parse SMS receipts, and manage your daily allowance easily.",
    onboarding3Title: "Money Pools (Gam3eya)",
    onboarding3Desc: "Organize and track group savings and payouts effortlessly.",
    next: "Next",
    startSetup: "Start Setup",
    smartPaste: "Smart SMS Paste",
    pasteSmsHere: "Paste your bank SMS here...",
    parse: "Parse",
    gam3eya: "Money Pools",
    home: "Home",
    addGam3eya: "New Pool",
    members: "Members",
    monthlyAmount: "Monthly Amount",
    payoutMonth: "Payout Month",
    markPaid: "Mark Paid",
    currentMonth: "Current Month"
  },
  ar: {
    brand: "موني نوت",
    tagline: "تخطيط ذكي لمستقبل مالي أوضح",
    availableBalance: "الرصيد المتاح",
    dailyAllowance: "المصروف اليومي",
    totalIncome: "إجمالي الدخل",
    fixedExpenses: "المصروفات الثابتة",
    debtsSavings: "الديون والمدخرات",
    analytics: "التحليلات",
    settings: "الإعدادات",
    income: "دخل",
    expense: "مصروف",
    debt: "دين/توفير",
    addTransaction: "إضافة معاملة",
    name: "الاسم",
    amount: "المبلغ",
    date: "التاريخ",
    type: "النوع",
    wallet: "وسيلة الدفع",
    noTransactions: "لا توجد معاملات مسجلة حتى الآن.",
    savingsGoal: "هدف الإدخار",
    language: "اللغة",
    currency: "العملة الأساسية",
    theme: "المظهر (الثيم)",
    exportData: "تصدير البيانات",
    importData: "استيراد البيانات",
    resetData: "مسح البيانات",
    resetConfirmTitle: "مسح جميع البيانات؟",
    resetConfirmMsg: "سيؤدي هذا إلى حذف جميع بياناتك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    confirm: "نعم، امسح",
    goalProgress: "التقدم نحو هدف الإدخار",
    goalMet: "تم تحقيق الهدف! 🎉",
    moreToGo: "متبقي للهدف",
    errorName: "لا يمكن أن يكون الاسم فارغاً",
    errorAmount: "يجب أن يكون المبلغ رقماً موجباً",
    errorDate: "يرجى تحديد تاريخ صحيح",
    financialBreakdown: "التحليلات المالية",
    recentTransactions: "المعاملات الأخيرة",
    save: "حفظ",
    edit: "تعديل",
    delete: "حذف",
    allTime: "كل الوقت",
    thisMonth: "هذا الشهر",
    cashFlow: "التدفق النقدي",
    distribution: "توزيع النفقات",
    wallets: "طرق الدفع",
    addWallet: "إضافة طريقة",
    editWallet: "تعديل طريقة",
    walletName: "اسم الطريقة",
    selectIcon: "اختر أيقونة",
    dailyLimitWarning: "⚠️ تحذير: لقد تجاوزت الحد المسموح به لمصروفك اليومي!",
    monthlyLimitWarning: "🚨 تحذير خطير: مصروفاتك هذا الشهر تجاوزت إجمالي دخلك!",
    convertedTo: "يعادل بـ",
    today: "اليوم",
    yesterday: "أمس",
    setupWelcome: "مرحباً بك في موني بلانر",
    setupDesc: "دعنا نقوم بإعداد ملفك المالي للبدء.",
    setupName: "بماذا نناديك؟",
    setupCurrency: "اختر عملتك الأساسية",
    setupPin: "قم بتعيين رمز PIN من 4 أرقام للأمان (اختياري)",
    setupPinPlaceholder: "0000",
    setupStart: "ابدأ الآن",
    enterPin: "أدخل رمز PIN للدخول",
    unlock: "فتح",
    wrongPin: "رمز PIN غير صحيح. حاول مرة أخرى.",
    security: "الأمان",
    enablePin: "تفعيل حماية PIN",
    changePin: "تغيير رمز PIN",
    removePin: "إزالة رمز PIN",
    biometricAuth: "المصادقة البيومترية",
    biometricDesc: "استخدم البصمة أو التعرف على الوجه لفتح التطبيق",
    hello: "أهلاً",
    onboarding1Title: "خصوصية تامة",
    onboarding1Desc: "يعمل 100% بدون إنترنت. بياناتك لا تغادر هاتفك أبداً. لا سيرفرات، لا تتبع.",
    onboarding2Title: "تتبع ذكي",
    onboarding2Desc: "تتبع مصروفاتك، حلل رسائل البنك النصية، ونظم ميزانيتك اليومية بسهولة.",
    onboarding3Title: "إدارة الجمعيات",
    onboarding3Desc: "نظم وتتبع الجمعيات المالية ومواعيد القبض للأعضاء بكل سهولة.",
    next: "التالي",
    startSetup: "ابدأ الإعداد",
    smartPaste: "لصق ذكي للرسائل",
    pasteSmsHere: "الصق رسالة البنك هنا لاستخراج البيانات...",
    parse: "تحليل",
    gam3eya: "الجمعيات",
    home: "الرئيسية",
    addGam3eya: "جمعية جديدة",
    members: "الأعضاء",
    monthlyAmount: "المبلغ الشهري",
    payoutMonth: "شهر القبض",
    markPaid: "تم الدفع",
    currentMonth: "الشهر الحالي"
  }
};

// --- Custom Hooks ---
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

// --- Helper Functions ---
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

const formatCurrency = (amount: number, currencyCode: string, lang: Language, showDecimals = true) => {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

const formatDate = (dateString: string, lang: Language) => {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }).format(new Date(dateString));
};

const getDaysInCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

const isThisMonth = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const isToday = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const isYesterday = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

// --- Components ---

export default function App() {
  // State
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage<boolean>('budget_seen_onboarding', false);
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage<boolean>('budget_setup_complete', false);
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showBalanceAuth, setShowBalanceAuth] = useState(false);
  const [balancePinInput, setBalancePinInput] = useState('');
  const [balancePinError, setBalancePinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'gam3eya' | 'transactions'>('home');
  
  // User Profile
  const [userName, setUserName] = useLocalStorage<string>('budget_user_name', '');
  const [userPin, setUserPin] = useLocalStorage<string>('budget_user_pin', '');
  const [useBiometrics, setUseBiometrics] = useLocalStorage<boolean>('budget_use_biometrics', false);

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('budget_transactions', []);
  const [gam3eyat, setGam3eyat] = useLocalStorage<Gam3eya[]>('budget_gam3eyat', []);
  const [wallets, setWallets] = useLocalStorage<WalletType[]>('budget_wallets', [
    { id: '1', name: 'Cash / كاش', icon: 'cash' },
    { id: '2', name: 'Bank / بنك', icon: 'bank' },
    { id: '3', name: 'Vodafone Cash', icon: 'mobile' }
  ]);
  const [currency, setCurrency] = useLocalStorage<string>('budget_currency', 'USD');
  const [savingsGoal, setSavingsGoal] = useLocalStorage<number>('budget_savings_goal', 0);
  const [lang, setLang] = useLocalStorage<Language>('budget_language', 'en');
  const [theme, setTheme] = useLocalStorage<Theme>('budget_theme', 'frosted');
  const [showBalances, setShowBalances] = useLocalStorage<boolean>('budget_show_balances', true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Add/Edit Transaction Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    walletId: wallets[0]?.id
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Wallet Manager State
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [walletFormData, setWalletFormData] = useState<Partial<WalletType>>({ icon: 'wallet', name: '' });
  const [showAddGam3eyaModal, setShowAddGam3eyaModal] = useState(false);
  const [showSmsParser, setShowSmsParser] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('budget_dark_mode', true);
  const [gam3eyaFormData, setGam3eyaFormData] = useState<Partial<Gam3eya>>({
    name: '',
    monthlyAmount: 0,
    totalMonths: 5,
    currentMonth: 1,
    startDate: new Date().toISOString().split('T')[0],
    members: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = dict[lang];
  const currentTheme = getTheme(theme, isDarkMode);

  // Splash Screen Timer & Auth
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
      // If no PIN is set, or setup isn't complete, don't lock
      if (!userPin || !isSetupComplete || !hasSeenOnboarding) {
        setIsLocked(false);
      } else if (useBiometrics && window.PublicKeyCredential) {
        // Attempt biometric auth if enabled (simulated for web)
        handleBiometricAuth();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [userPin, isSetupComplete, useBiometrics, hasSeenOnboarding]);

  const handleBiometricAuth = async () => {
    try {
      // In a real PWA/Native app, this would call the WebAuthn or native biometric API
      // For this web preview, we simulate a successful biometric prompt if the browser supports it
      setIsLocked(false);
    } catch (e) {
      console.error("Biometric auth failed", e);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === userPin) {
      setIsLocked(false);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleToggleBalance = async () => {
    if (showBalances) {
      setShowBalances(false);
    } else {
      if (useBiometrics) {
        try {
          // Simulate biometric auth
          setShowBalances(true);
        } catch (e) {
          setShowBalanceAuth(true);
        }
      } else {
        setShowBalanceAuth(true);
      }
    }
  };

  const handleBalancePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (balancePinInput === userPin) {
      setShowBalances(true);
      setShowBalanceAuth(false);
      setBalancePinInput('');
      setBalancePinError(false);
    } else {
      setBalancePinError(true);
      setBalancePinInput('');
    }
  };

  const handleCompleteSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    setIsSetupComplete(true);
    setHasSeenOnboarding(true);
    setIsLocked(false);
  };

  const handleSaveGam3eya = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gam3eyaFormData.name || !gam3eyaFormData.monthlyAmount) return;
    
    // Auto-generate members if empty
    let members = gam3eyaFormData.members || [];
    if (members.length === 0) {
      for (let i = 1; i <= (gam3eyaFormData.totalMonths || 5); i++) {
        members.push({
          id: generateId() + i,
          name: `Member ${i}`,
          payoutMonth: i,
          hasPaidCurrent: false
        });
      }
    }

    const newGam3eya: Gam3eya = {
      id: generateId(),
      name: gam3eyaFormData.name,
      monthlyAmount: Number(gam3eyaFormData.monthlyAmount),
      totalMonths: Number(gam3eyaFormData.totalMonths) || 5,
      currentMonth: Number(gam3eyaFormData.currentMonth) || 1,
      startDate: gam3eyaFormData.startDate || new Date().toISOString().split('T')[0],
      members
    };

    setGam3eyat([...gam3eyat, newGam3eya]);
    setShowAddGam3eyaModal(false);
    setGam3eyaFormData({ name: '', monthlyAmount: 0, totalMonths: 5, currentMonth: 1, startDate: new Date().toISOString().split('T')[0], members: [] });
  };

  const toggleMemberPaid = (gam3eyaId: string, memberId: string) => {
    setGam3eyat(gam3eyat.map(g => {
      if (g.id === gam3eyaId) {
        return {
          ...g,
          members: g.members.map(m => m.id === memberId ? { ...m, hasPaidCurrent: !m.hasPaidCurrent } : m)
        };
      }
      return g;
    }));
  };

  const deleteGam3eya = (id: string) => {
    setGam3eyat(gam3eyat.filter(g => g.id !== id));
  };
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSmsText(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      // Fallback: user can still manually paste
    }
  };

  const handleParseSms = () => {
    if (!smsText.trim()) return;
    
    // Extract amount using regex (looks for numbers possibly with decimals)
    const amountMatch = smsText.match(/\b\d+(?:[.,]\d+)?\b/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : 0;
    
    // Determine type based on keywords
    const isIncome = /إيداع|راتب|استلام|اضافة|deposit|salary|received|added/i.test(smsText);
    const isExpense = /خصم|سحب|دفع|شراء|فاتورة|withdrawal|payment|purchase|paid|spent/i.test(smsText);
    
    const type = isIncome ? 'income' : (isExpense ? 'expense' : 'expense');
    
    setFormData({
      ...formData,
      amount: amount || undefined,
      type,
      name: type === 'income' ? (lang === 'ar' ? 'إيداع بنكي' : 'Bank Deposit') : (lang === 'ar' ? 'مدفوعات بنكية' : 'Bank Payment'),
      date: new Date().toISOString().split('T')[0]
    });
    
    setShowSmsParser(false);
    setSmsText('');
  };

  // Calculations
  const { totalIncome, totalExpenses, totalDebts, todayExpenses, monthExpenses } = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'income') acc.totalIncome += curr.amount;
      if (curr.type === 'expense') {
        acc.totalExpenses += curr.amount;
        if (isThisMonth(curr.date)) acc.monthExpenses += curr.amount;
        if (isToday(curr.date)) acc.todayExpenses += curr.amount;
      }
      if (curr.type === 'debt') acc.totalDebts += curr.amount;
      return acc;
    }, { totalIncome: 0, totalExpenses: 0, totalDebts: 0, todayExpenses: 0, monthExpenses: 0 });
  }, [transactions]);
  
  const totalObligations = totalExpenses + totalDebts;
  const remainingBalance = totalIncome - totalObligations;
  
  const daysInMonth = getDaysInCurrentMonth();
  const dailyAllowance = remainingBalance > 0 ? remainingBalance / daysInMonth : 0;

  // Warnings Logic
  const isDailyLimitExceeded = todayExpenses > dailyAllowance && dailyAllowance > 0;
  const isMonthlyLimitExceeded = monthExpenses > totalIncome && totalIncome > 0;

  // Group Transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [transactions]);

  const addTransactionDirectly = (name: string, amount: number, type: TransactionType) => {
    const newTransaction: Transaction = {
      id: generateId(),
      name,
      amount,
      type,
      date: new Date().toISOString().split('T')[0],
      walletId: wallets[0]?.id
    };
    setTransactions([newTransaction, ...transactions]);
  };

  // Handlers
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return setFormError(t.errorName);
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) return setFormError(t.errorAmount);
    if (!formData.date) return setFormError(t.errorDate);

    const newTransaction: Transaction = {
      id: editingId || generateId(),
      name: formData.name.trim(),
      amount: Number(formData.amount),
      type: formData.type as TransactionType,
      date: formData.date,
      walletId: formData.walletId
    };

    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? newTransaction : t));
    } else {
      setTransactions([newTransaction, ...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    closeAddModal();
  };

  const openAddModal = (type: TransactionType = 'expense') => {
    setFormData({ type, date: new Date().toISOString().split('T')[0], name: '', amount: undefined, walletId: wallets[0]?.id });
    setEditingId(null);
    setFormError(null);
    setShowAddModal(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setFormData({ ...transaction });
    setEditingId(transaction.id);
    setFormError(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleReset = () => {
    setTransactions([]);
    setSavingsGoal(0);
    setShowResetConfirm(false);
    setShowSettingsModal(false);
  };

  const handleExport = () => {
    const data = { transactions, wallets, currency, savingsGoal, lang, theme };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions) setTransactions(data.transactions);
        if (data.wallets) setWallets(data.wallets);
        if (data.currency) setCurrency(data.currency);
        if (data.savingsGoal) setSavingsGoal(data.savingsGoal);
        if (data.lang) setLang(data.lang);
        if (data.theme) setTheme(data.theme);
        setShowSettingsModal(false);
      } catch (error) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  // Wallet Management Handlers
  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletFormData.name?.trim()) return;
    
    const newWallet: WalletType = {
      id: editingWalletId || generateId(),
      name: walletFormData.name.trim(),
      icon: walletFormData.icon || 'wallet'
    };

    if (editingWalletId) {
      setWallets(wallets.map(w => w.id === editingWalletId ? newWallet : w));
    } else {
      setWallets([...wallets, newWallet]);
    }
    setEditingWalletId(null);
    setWalletFormData({ icon: 'wallet', name: '' });
  };

  const handleDeleteWallet = (id: string) => {
    setWallets(wallets.filter(w => w.id !== id));
    // Also remove walletId from transactions that used this wallet
    setTransactions(transactions.map(t => t.walletId === id ? { ...t, walletId: undefined } : t));
  };


  const currentCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  // Render Helpers
  const BlurredText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <span className={`${className} transition-all duration-300 ${!showBalances ? 'blur-md select-none opacity-50' : ''}`}>
      {children}
    </span>
  );

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'income': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'expense': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'debt': return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'income': return <ArrowDownRight className="w-5 h-5" />;
      case 'expense': return <ArrowUpRight className="w-5 h-5" />;
      case 'debt': return <RefreshCw className="w-5 h-5" />;
    }
  };

  const getDateLabel = (dateString: string) => {
    if (isToday(dateString)) return t.today;
    if (isYesterday(dateString)) return t.yesterday;
    return formatDate(dateString, lang);
  };

  // --- Android SMS Integration (Beta) ---
  useEffect(() => {
    // Expose function to global window object for Android WebView to call
    (window as any).receiveSMS = (smsBody: string) => {
      console.log("Received SMS from Android:", smsBody);
      setSmsText(smsBody);
      setShowSmsParser(true);
      // We could also auto-parse here, but showing the modal is safer for beta
    };

    return () => {
      delete (window as any).receiveSMS;
    };
  }, []);

  const requestSmsPermission = () => {
    if ((window as any).AndroidBridge && (window as any).AndroidBridge.requestSmsPermission) {
      (window as any).AndroidBridge.requestSmsPermission();
    } else {
      alert(lang === 'ar' ? 'هذه الميزة تتطلب تطبيق الأندرويد.' : 'This feature requires the Android app.');
    }
  };

  // --- Splash Screen ---
  if (isSplashVisible) {
    return (
      <motion.div 
        initial={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${currentTheme.bg}`}
        style={{ backgroundImage: currentTheme.gradient }}
      >
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.8, ease: "easeOut" }} 
          className="flex flex-col items-center relative"
        >
          <motion.div 
            animate={{ 
              boxShadow: ['0px 0px 0px 0px rgba(255, 255, 255, 0)', '0px 0px 40px 10px rgba(255, 255, 255, 0.1)', '0px 0px 0px 0px rgba(255, 255, 255, 0)'] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-28 h-28 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl mb-8 relative overflow-hidden"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Wallet className={`w-14 h-14 ${currentTheme.accent} drop-shadow-lg`} />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
            className={`text-5xl font-extrabold tracking-tight mb-3 ${currentTheme.text || 'text-white'}`}
          >
            {t.brand}
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}
            className="text-sky-400 font-semibold tracking-widest uppercase text-sm"
          >
            {t.tagline}
          </motion.p>

          <motion.div 
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
            className="w-32 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent mt-12 rounded-full"
          />
        </motion.div>
      </motion.div>
    );
  }

  // --- Lock Screen ---
  if (isLocked && isSetupComplete) {
    return (
      <div className={`fixed inset-0 z-[90] flex flex-col items-center justify-center p-6 ${currentTheme.bg}`} style={{ backgroundImage: currentTheme.gradient }}>
        <div className={`w-full max-w-sm p-8 rounded-[2.5rem] bg-gradient-to-br ${currentTheme.card} border border-white/10 shadow-2xl backdrop-blur-xl text-center`}>
          <div className="w-20 h-20 mx-auto bg-sky-500/20 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-sky-400" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${currentTheme.text || 'text-white'}`}>{t.hello}, {userName}</h2>
          <p className="text-slate-400 text-sm mb-8">{t.enterPin}</p>
          
          <form onSubmit={handleUnlock} className="space-y-6">
            <div>
              <input 
                type="password" 
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className={`w-full text-center text-3xl tracking-[1em] bg-white/5 border ${pinError ? 'border-rose-500' : 'border-white/10'} rounded-2xl py-4 focus:outline-none focus:border-sky-500/50 ${currentTheme.text || 'text-white'}`}
                autoFocus
              />
              {pinError && <p className="text-rose-400 text-sm mt-2">{t.wrongPin}</p>}
            </div>
            <button type="submit" disabled={pinInput.length !== 4} className={`w-full py-4 rounded-2xl font-bold text-white transition-colors disabled:opacity-50 ${currentTheme.btn}`}>
              {t.unlock}
            </button>
          </form>

          {useBiometrics && (
            <button onClick={handleBiometricAuth} className="mt-6 flex items-center justify-center gap-2 text-sky-400 hover:text-sky-300 mx-auto">
              <Fingerprint className="w-5 h-5" />
              <span className="text-sm font-medium">{t.biometricAuth}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Onboarding Screen ---
  if (!hasSeenOnboarding) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 ${currentTheme.bg}`} style={{ backgroundImage: currentTheme.gradient }}>
        <div className="absolute top-6 end-6">
          <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-slate-300 focus:outline-none">
            <option value="en" className="bg-slate-900">EN</option>
            <option value="ar" className="bg-slate-900">AR</option>
          </select>
        </div>

        <AnimatePresence mode="wait">
            <motion.div key="setup" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className={`w-full max-w-md p-8 rounded-[2.5rem] bg-gradient-to-br ${currentTheme.card} border border-white/10 shadow-2xl backdrop-blur-xl`}>
              <h2 className={`text-3xl font-bold mb-2 ${currentTheme.text || 'text-white'}`}>{t.setupWelcome}</h2>
              <p className="text-slate-400 text-sm mb-8">{t.setupDesc}</p>

              <form onSubmit={handleCompleteSetup} className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">{t.setupName}</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 start-4 my-auto w-5 h-5 text-slate-500" />
                    <input 
                      type="text" required value={userName} onChange={(e) => setUserName(e.target.value)}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 ps-12 pe-4 focus:outline-none focus:border-sky-500/50 ${currentTheme.text || 'text-white'}`}
                      placeholder="e.g. Alex"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">{t.setupCurrency}</label>
                  <select 
                    value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 appearance-none ${currentTheme.text || 'text-white'}`}
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.label} ({c.symbol})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">{t.setupPin}</label>
                  <div className="relative">
                    <Lock className="absolute inset-y-0 start-4 my-auto w-5 h-5 text-slate-500" />
                    <input 
                      type="password" inputMode="numeric" maxLength={4} value={userPin} onChange={(e) => setUserPin(e.target.value.replace(/\D/g, ''))}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 ps-12 pe-4 tracking-[0.5em] focus:outline-none focus:border-sky-500/50 ${currentTheme.text || 'text-white'}`}
                      placeholder={t.setupPinPlaceholder}
                    />
                  </div>
                </div>

                <button type="submit" disabled={!userName.trim()} className={`w-full py-4 rounded-2xl font-bold text-white transition-colors mt-4 disabled:opacity-50 ${currentTheme.btn}`}>
                  {t.setupStart}
                </button>
              </form>
            </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'} 
      className={`min-h-screen selection:bg-sky-500/30 selection:text-sky-100 flex flex-col relative pb-28 transition-colors duration-500 font-sans ${currentTheme.bg} ${currentTheme.text || 'text-slate-50'}`}
      style={{ backgroundImage: currentTheme.gradient }}
    >
      {/* Header */}
      <header className={`pt-4 sm:pt-6 pb-3 sm:pb-4 sticky top-0 z-30 backdrop-blur-2xl border-b border-white/5 ${currentTheme.bg}/70`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
              <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTheme.accent} drop-shadow-md relative z-10`} />
            </div>
            <div>
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight truncate max-w-[150px] sm:max-w-none ${currentTheme.text || 'text-slate-50'}`}>
                {t.hello}, {userName || t.brand}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors">
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button onClick={handleToggleBalance} className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors">
              {showBalances ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button onClick={() => setShowAnalyticsModal(true)} className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 flex-grow flex flex-col w-full mt-6">
        {activeTab === 'home' ? (
          <>
            {/* Warnings */}
            <AnimatePresence>
              {isMonthlyLimitExceeded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-rose-500/20 border border-rose-500/50 text-rose-100 p-4 rounded-2xl flex items-start gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{t.monthlyLimitWarning}</p>
                  </div>
                </motion.div>
              )}
              {isDailyLimitExceeded && !isMonthlyLimitExceeded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-orange-500/20 border border-orange-500/50 text-orange-100 p-4 rounded-2xl flex items-start gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{t.dailyLimitWarning}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Wallet Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
              className={`relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 bg-gradient-to-br ${currentTheme.card} border border-white/10 shadow-2xl ${currentTheme.shadow} backdrop-blur-xl`}
            >
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col gap-5 sm:gap-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="w-full sm:w-auto">
                    <p className={`text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.availableBalance}</p>
                    <BlurredText className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight flex items-baseline gap-2 break-words ${currentTheme.text || 'text-white'}`}>
                      {formatCurrency(remainingBalance, currency, lang, true)}
                    </BlurredText>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-[140px] border border-white/10 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-stretch shadow-inner">
                    <p className={`text-[10px] font-bold uppercase tracking-wider sm:mb-1 ${currentTheme.accent}`}>{t.dailyAllowance}</p>
                    <BlurredText className={`text-xl sm:text-3xl font-bold ${currentTheme.text || 'text-white'}`}>
                      {formatCurrency(dailyAllowance, currency, lang, true)}
                    </BlurredText>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/10">
                  <div className="bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                    <p className={`text-[10px] uppercase mb-1 flex items-center gap-1 truncate ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}><ArrowDownRight className="w-3 h-3 text-emerald-400 shrink-0"/> <span className="truncate">{t.income}</span></p>
                    <BlurredText className={`text-xs sm:text-base font-bold truncate block ${currentTheme.text || 'text-slate-200'}`}>{formatCurrency(totalIncome, currency, lang, false)}</BlurredText>
                  </div>
                  <div className="bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                    <p className={`text-[10px] uppercase mb-1 flex items-center gap-1 truncate ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}><ArrowUpRight className="w-3 h-3 text-rose-400 shrink-0"/> <span className="truncate">{t.expense}</span></p>
                    <BlurredText className={`text-xs sm:text-base font-bold truncate block ${currentTheme.text || 'text-slate-200'}`}>{formatCurrency(totalExpenses, currency, lang, false)}</BlurredText>
                  </div>
                  <div className="bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                    <p className={`text-[10px] uppercase mb-1 flex items-center gap-1 truncate ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}><RefreshCw className="w-3 h-3 text-violet-400 shrink-0"/> <span className="truncate">{t.debt}</span></p>
                    <BlurredText className={`text-xs sm:text-base font-bold truncate block ${currentTheme.text || 'text-slate-200'}`}>{formatCurrency(totalDebts, currency, lang, false)}</BlurredText>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Transactions List */}
            <div className="flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className={`text-lg font-bold ${currentTheme.text || 'text-slate-50'}`}>{t.recentTransactions}</h2>
                {transactions.length > 1 && (
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`text-xs font-medium px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${currentTheme.text || 'text-slate-300'}`}
                  >
                    {lang === 'ar' ? 'عرض الكل' : 'Show All'}
                  </button>
                )}
              </div>

              {transactions.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-500 h-48">
                  <Activity className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">{t.noTransactions}</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {groupedTransactions.slice(0, 1).map(([date, txs]) => [date, txs.slice(0, 1)] as [string, Transaction[]]).map(([date, dayTransactions]) => (
                    <div key={date} className="space-y-2">
                      <div className="flex justify-center sticky top-[72px] sm:top-[88px] z-20 py-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md border ${currentTheme.text ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-slate-900/80 border-white/10 text-slate-400'}`}>
                          {getDateLabel(date)}
                        </span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-2 space-y-1 shadow-sm">
                        {dayTransactions.map((item) => {
                          const wallet = wallets.find(w => w.id === item.walletId);
                          return (
                            <motion.div 
                              layoutId={item.id}
                              key={item.id} 
                              className="flex items-center justify-between p-3 sm:p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer" 
                              onClick={() => setActiveTab('transactions')}
                            >
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border shrink-0 ${getTypeColor(item.type)}`}>
                                  {getTypeIcon(item.type)}
                                </div>
                                <div className="min-w-0">
                                  <p className={`font-semibold text-sm sm:text-base truncate ${currentTheme.text || 'text-slate-100'}`}>{item.name}</p>
                                  {wallet && (
                                    <div className={`flex items-center gap-1 text-[10px] sm:text-xs mt-0.5 ${currentTheme.text ? 'text-slate-500' : 'text-slate-500'}`}>
                                      {WALLET_ICONS[wallet.icon] || WALLET_ICONS['wallet']}
                                      <span className="truncate">{wallet.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-end shrink-0 ms-2">
                                <BlurredText className={`font-bold text-sm sm:text-base ${item.type === 'income' ? 'text-emerald-400' : (currentTheme.text || 'text-slate-100')}`}>
                                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency, lang, false)}
                                </BlurredText>
                                <p className={`text-[10px] uppercase mt-0.5 ${currentTheme.text ? 'text-slate-500' : 'text-slate-500'}`}>{t[item.type]}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'transactions' ? (
          <div className="flex flex-col flex-grow">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className={`text-2xl font-bold ${currentTheme.text || 'text-slate-50'}`}>{lang === 'ar' ? 'جميع المعاملات' : 'All Transactions'}</h2>
            </div>
            {transactions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-500 h-48">
                <Activity className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">{t.noTransactions}</p>
              </motion.div>
            ) : (
              <div className="space-y-6 pb-24">
                {groupedTransactions.map(([date, dayTransactions]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex justify-center sticky top-[72px] sm:top-[88px] z-20 py-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md border ${currentTheme.text ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-slate-900/80 border-white/10 text-slate-400'}`}>
                        {getDateLabel(date)}
                      </span>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-2 space-y-1 shadow-sm">
                      {dayTransactions.map((item) => {
                        const wallet = wallets.find(w => w.id === item.walletId);
                        return (
                          <motion.div 
                            layoutId={item.id}
                            key={item.id} 
                            className="flex items-center justify-between p-3 sm:p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer" 
                            onClick={() => openEditModal(item)}
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border shrink-0 ${getTypeColor(item.type)}`}>
                                {getTypeIcon(item.type)}
                              </div>
                              <div className="min-w-0">
                                <p className={`font-semibold text-sm sm:text-base truncate ${currentTheme.text || 'text-slate-100'}`}>{item.name}</p>
                                {wallet && (
                                  <div className={`flex items-center gap-1 text-[10px] sm:text-xs mt-0.5 ${currentTheme.text ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {WALLET_ICONS[wallet.icon] || WALLET_ICONS['wallet']}
                                    <span className="truncate">{wallet.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-end shrink-0 ms-2">
                              <BlurredText className={`font-bold text-sm sm:text-base ${item.type === 'income' ? 'text-emerald-400' : (currentTheme.text || 'text-slate-100')}`}>
                                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency, lang, false)}
                              </BlurredText>
                              <p className={`text-[10px] uppercase mt-0.5 ${currentTheme.text ? 'text-slate-500' : 'text-slate-500'}`}>{t[item.type]}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Gam3eyaTab 
            gam3eyat={gam3eyat} 
            setGam3eyat={setGam3eyat} 
            setShowAddGam3eyaModal={setShowAddGam3eyaModal}
            t={t}
            currentTheme={currentTheme}
            formatCurrency={formatCurrency}
            currency={currency}
            lang={lang}
            addTransactionDirectly={addTransactionDirectly}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/5 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto px-6 py-2 flex justify-between items-center relative">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${activeTab === 'home' ? currentTheme.accent : 'text-slate-500 hover:text-slate-400'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === 'home' ? 'bg-white/10' : 'bg-transparent'}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">{t.home}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${activeTab === 'transactions' ? currentTheme.accent : 'text-slate-500 hover:text-slate-400'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === 'transactions' ? 'bg-white/10' : 'bg-transparent'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">{lang === 'ar' ? 'المعاملات' : 'Transactions'}</span>
          </button>

          <div className="w-16 relative flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => openAddModal()}
              className={`absolute -top-10 flex items-center justify-center w-14 h-14 text-white rounded-full font-bold shadow-2xl transition-all duration-300 ring-4 ring-slate-900/50 ${currentTheme.btn}`}
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>

          <button 
            onClick={() => setActiveTab('gam3eya')}
            className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${activeTab === 'gam3eya' ? currentTheme.accent : 'text-slate-500 hover:text-slate-400'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === 'gam3eya' ? 'bg-white/10' : 'bg-transparent'}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">{t.gam3eya}</span>
          </button>

          <button 
            onClick={() => setShowSettingsModal(true)}
            className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 text-slate-500 hover:text-slate-400`}
          >
            <div className="p-1.5 rounded-xl bg-transparent">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
          </button>
        </div>
      </div>

      {/* Add Gam3eya Modal */}
      <AnimatePresence>
        {showAddGam3eyaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-6 my-8 relative overflow-hidden`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${currentTheme.text || 'text-slate-50'}`}>
                  <Users className={`w-6 h-6 ${currentTheme.accent}`} />
                  {t.addGam3eya}
                </h3>
                <button onClick={() => setShowAddGam3eyaModal(false)} className="text-slate-400 hover:text-slate-200 bg-white/5 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGam3eya} className="space-y-5">
                <div>
                  <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.name}</label>
                  <input
                    type="text" required value={gam3eyaFormData.name || ''} onChange={(e) => setGam3eyaFormData({ ...gam3eyaFormData, name: e.target.value })}
                    placeholder="e.g. Family Pool"
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 text-start transition-colors ${currentTheme.text || 'text-slate-50'}`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.monthlyAmount}</label>
                    <input
                      type="number" required min="1" value={gam3eyaFormData.monthlyAmount || ''} onChange={(e) => setGam3eyaFormData({ ...gam3eyaFormData, monthlyAmount: Number(e.target.value) })}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 text-start transition-colors ${currentTheme.text || 'text-slate-50'}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>Total Months</label>
                    <input
                      type="number" required min="2" max="24" value={gam3eyaFormData.totalMonths || ''} onChange={(e) => setGam3eyaFormData({ ...gam3eyaFormData, totalMonths: Number(e.target.value) })}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 text-start transition-colors ${currentTheme.text || 'text-slate-50'}`}
                    />
                  </div>
                </div>

                <button type="submit" className={`w-full py-4 rounded-2xl font-bold text-white transition-colors mt-4 ${currentTheme.btn}`}>
                  {t.save}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-t-[2rem] sm:rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${currentTheme.text || 'text-slate-50'}`}>
                  {editingId ? t.edit : t.addTransaction}
                </h3>
                <div className="flex gap-2 items-center">
                  {!editingId && (
                    <button onClick={() => setShowSmsParser(true)} className="text-sky-400 hover:text-sky-300 bg-sky-500/10 p-2 rounded-full flex items-center gap-2 px-3 relative">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-bold hidden sm:inline">{t.smartPaste}</span>
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">BETA</span>
                    </button>
                  )}
                  <button onClick={closeAddModal} className="text-slate-400 hover:text-slate-200 bg-white/5 p-2 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-5">
                {/* Type Selector */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                  {(['income', 'expense', 'debt'] as TransactionType[]).map((type) => (
                    <button
                      key={type} type="button" onClick={() => setFormData({ ...formData, type })}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        formData.type === type 
                          ? 'bg-white/20 text-white shadow-md border border-white/10' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t[type]}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div>
                  <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.amount}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-slate-400 text-lg">
                      {currentCurrencySymbol}
                    </span>
                    <input
                      type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      placeholder="0.00" min="0" step="0.01" autoFocus
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 ps-12 pe-4 text-2xl font-bold focus:outline-none focus:border-sky-500/50 text-start transition-colors ${currentTheme.text || 'text-slate-50'}`}
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.name}</label>
                  <input
                    type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Salary, Groceries..."
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 text-start transition-colors ${currentTheme.text || 'text-slate-50'}`}
                  />
                </div>

                {/* Wallet & Date Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.wallet}</label>
                    <div className="relative">
                      <select
                        value={formData.walletId || ''} onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 text-start transition-colors appearance-none ${currentTheme.text || 'text-slate-50'}`}
                      >
                        {wallets.map(w => <option key={w.id} value={w.id} className="bg-[#0f172a] text-white">{w.name}</option>)}
                      </select>
                      <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.date}</label>
                    <input
                      type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 text-start transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 ${currentTheme.text || 'text-slate-50'}`}
                    />
                  </div>
                </div>

                {formError && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">{formError}</div>}

                <div className="flex gap-3 pt-2 pb-6 sm:pb-0">
                  {editingId && (
                    <button
                      type="button" onClick={() => { handleDelete(editingId); closeAddModal(); }}
                      className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                  <button type="submit" className={`flex-1 text-white rounded-2xl font-bold text-lg py-4 transition-colors shadow-lg ${currentTheme.btn}`}>
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SMS Parser Modal */}
      <AnimatePresence>
        {showSmsParser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${currentTheme.text || 'text-slate-50'}`}>
                  <MessageSquare className={`w-6 h-6 ${currentTheme.accent}`} />
                  {t.smartPaste}
                </h3>
                <button onClick={() => setShowSmsParser(false)} className="text-slate-400 hover:text-slate-200 bg-white/5 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lang === 'ar' 
                      ? 'لأسباب تتعلق بالخصوصية والأمان، لا يمكن لتطبيقات الويب قراءة رسائلك النصية مباشرة. يرجى نسخ رسالة البنك ولصقها هنا، أو استخدام زر القراءة من الحافظة.' 
                      : 'For privacy and security, web apps cannot directly read your SMS. Please copy your bank message and paste it here, or use the clipboard button.'}
                  </p>
                </div>
                
                <button 
                  onClick={requestSmsPermission}
                  className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  {lang === 'ar' ? 'تفعيل القراءة التلقائية (أندرويد فقط)' : 'Enable Auto-Read (Android Only)'}
                </button>

                <div className="relative">
                  <textarea
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    placeholder={t.pasteSmsHere}
                    className={`w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 resize-none ${currentTheme.text || 'text-slate-50'}`}
                  />
                  <button 
                    onClick={handlePasteFromClipboard}
                    className="absolute bottom-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 transition-colors flex items-center gap-2 text-xs font-medium backdrop-blur-md"
                  >
                    <Upload className="w-4 h-4" />
                    {lang === 'ar' ? 'لصق من الحافظة' : 'Paste from Clipboard'}
                  </button>
                </div>
                <button 
                  onClick={handleParseSms}
                  disabled={!smsText.trim()}
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${currentTheme.btn}`}
                >
                  <Sparkles className="w-5 h-5" />
                  {t.parse}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center`}>
              <button onClick={() => setShowAboutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 bg-white/5 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Wallet className={`w-10 h-10 ${currentTheme.accent}`} />
              </div>
              
              <h2 className={`text-2xl font-bold mb-1 ${currentTheme.text || 'text-white'}`}>{t.brand}</h2>
              <p className="text-sky-400 text-sm font-bold mb-6">Version 1.0.0</p>
              
              <div className="space-y-4 text-sm text-start">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-slate-400 text-xs mb-1">{lang === 'ar' ? 'المطور' : 'Developer'}</p>
                  <p className={`font-bold ${currentTheme.text || 'text-white'}`}>{lang === 'ar' ? 'زياد يحي زكريا احمد' : 'Ziad Yehia Zakaria Ahmed'}</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">{lang === 'ar' ? 'الهاتف' : 'Phone'}</span>
                  <a href="tel:+201124148723" className="font-bold text-sky-400" dir="ltr">+20 112 414 8723</a>
                </div>
                
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Instagram</span>
                  <a href="https://instagram.com/ziadworkout" target="_blank" rel="noreferrer" className="font-bold text-pink-400" dir="ltr">@ziadworkout</a>
                </div>
                
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Facebook</span>
                  <a href="https://facebook.com/zidpy" target="_blank" rel="noreferrer" className="font-bold text-blue-400" dir="ltr">@zidpy</a>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mt-6">
                © {new Date().getFullYear()} {t.brand}. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Auth Modal */}
      <AnimatePresence>
        {showBalanceAuth && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center`}>
              <div className="w-16 h-16 mx-auto bg-sky-500/20 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-sky-400" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${currentTheme.text || 'text-white'}`}>{lang === 'ar' ? 'إظهار الرصيد' : 'Show Balance'}</h3>
              <p className="text-slate-400 text-sm mb-6">{t.enterPin}</p>
              
              <form onSubmit={handleBalancePinSubmit} className="space-y-4">
                <div>
                  <input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={4}
                    value={balancePinInput}
                    onChange={(e) => setBalancePinInput(e.target.value.replace(/\D/g, ''))}
                    className={`w-full text-center text-3xl tracking-[1em] bg-white/5 border ${balancePinError ? 'border-rose-500' : 'border-white/10'} rounded-2xl py-4 focus:outline-none focus:border-sky-500/50 ${currentTheme.text || 'text-white'}`}
                    autoFocus
                  />
                  {balancePinError && <p className="text-rose-400 text-sm mt-2">{t.wrongPin}</p>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowBalanceAuth(false); setBalancePinInput(''); setBalancePinError(false); }} className={`flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors`}>
                    {t.cancel}
                  </button>
                  <button type="submit" disabled={balancePinInput.length !== 4} className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors disabled:opacity-50 ${currentTheme.btn}`}>
                    {t.unlock}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-6 my-8 relative overflow-hidden`}>
              
              <AnimatePresence mode="wait">
                {!showWalletManager ? (
                  <motion.div key="main-settings" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xl font-bold flex items-center gap-2 ${currentTheme.text || 'text-slate-50'}`}>
                        <Settings className={`w-6 h-6 ${currentTheme.accent}`} />
                        {t.settings}
                      </h3>
                      <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-200 bg-white/5 p-2 rounded-full">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Security & Profile Entry */}
                    <div className="space-y-2">
                      <label className={`text-sm font-medium flex items-center gap-2 ${currentTheme.text ? 'text-slate-600' : 'text-slate-300'}`}><ShieldCheck className="w-4 h-4"/> {t.security}</label>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${currentTheme.text || 'text-slate-300'}`}>{t.enablePin}</span>
                          <button 
                            onClick={() => setUserPin(userPin ? '' : '0000')} // Simplified toggle for demo
                            className={`w-12 h-6 rounded-full transition-colors relative ${userPin ? 'bg-sky-500' : 'bg-slate-600'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${userPin ? 'start-7' : 'start-1'}`}></div>
                          </button>
                        </div>
                        {userPin && (
                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <span className={`text-sm ${currentTheme.text || 'text-slate-300'}`}>{t.biometricAuth}</span>
                            <button 
                              onClick={() => setUseBiometrics(!useBiometrics)}
                              className={`w-12 h-6 rounded-full transition-colors relative ${useBiometrics ? 'bg-sky-500' : 'bg-slate-600'}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${useBiometrics ? 'start-7' : 'start-1'}`}></div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Wallets Manager Entry */}
                    <button 
                      onClick={() => setShowWalletManager(true)}
                      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors"
                    >
                      <div className={`flex items-center gap-3 ${currentTheme.text || 'text-slate-200'}`}>
                        <Wallet className={`w-5 h-5 ${currentTheme.accent}`} />
                        <span className="font-medium">{t.wallets}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 rtl:rotate-180" />
                    </button>

                    {/* Theme */}
                    <div className="space-y-2">
                      <label className={`text-sm font-medium flex items-center gap-2 ${currentTheme.text ? 'text-slate-600' : 'text-slate-300'}`}><Palette className="w-4 h-4"/> {t.theme}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(['frosted', 'midnight', 'emerald', 'sunset', 'programmer', 'girly', 'business', 'gamer'] as Theme[]).map(th => (
                          <button key={th} onClick={() => setTheme(th)} className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors border capitalize ${theme === th ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                            {th}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${currentTheme.text ? 'text-slate-600' : 'text-slate-300'}`}>{t.language}</label>
                        <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50 [&>option]:bg-[#0f172a] [&>option]:text-white ${currentTheme.text || 'text-slate-50'}`}>
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${currentTheme.text ? 'text-slate-600' : 'text-slate-300'}`}>{t.currency}</label>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50 [&>option]:bg-[#0f172a] [&>option]:text-white ${currentTheme.text || 'text-slate-50'}`}>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                      </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* Data Management */}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleExport} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" /> {t.exportData}
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors text-sm font-medium">
                        <Upload className="w-4 h-4" /> {t.importData}
                      </button>
                      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setShowResetConfirm(true)} className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" /> {t.resetData}
                      </button>
                      <button onClick={() => { setShowSettingsModal(false); setShowAboutModal(true); }} className="w-full py-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                        <Info className="w-4 h-4" /> {lang === 'ar' ? 'عن التطبيق' : 'About App'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="wallet-manager" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => { setShowWalletManager(false); setEditingWalletId(null); }} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300">
                        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                      </button>
                      <h3 className={`text-xl font-bold ${currentTheme.text || 'text-slate-50'}`}>{t.wallets}</h3>
                    </div>

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pe-2 scrollbar-custom">
                      {wallets.map(w => (
                        <div key={w.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className={`flex items-center gap-3 ${currentTheme.text || 'text-slate-200'}`}>
                            <div className="p-2 bg-white/10 rounded-lg">{WALLET_ICONS[w.icon] || WALLET_ICONS['wallet']}</div>
                            <span className="font-medium">{w.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingWalletId(w.id); setWalletFormData({ name: w.name, icon: w.icon }); }} className="p-2 text-slate-400 hover:text-sky-400"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteWallet(w.id)} className="p-2 text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSaveWallet} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
                      <h4 className={`text-sm font-bold ${currentTheme.text || 'text-slate-300'}`}>{editingWalletId ? t.editWallet : t.addWallet}</h4>
                      
                      <div>
                        <label className={`text-xs mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.selectIcon}</label>
                        <div className="flex gap-2 flex-wrap">
                          {Object.keys(WALLET_ICONS).map(iconKey => (
                            <button 
                              key={iconKey} type="button" 
                              onClick={() => setWalletFormData({ ...walletFormData, icon: iconKey })}
                              className={`p-3 rounded-xl border transition-colors ${walletFormData.icon === iconKey ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-white/10 border-white/10 text-slate-400 hover:bg-white/20'}`}
                            >
                              {WALLET_ICONS[iconKey]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={`text-xs mb-2 block ${currentTheme.text ? 'text-slate-600' : 'text-slate-400'}`}>{t.walletName}</label>
                        <input 
                          type="text" value={walletFormData.name || ''} onChange={(e) => setWalletFormData({ ...walletFormData, name: e.target.value })}
                          className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-sky-500/50 ${currentTheme.text || 'text-slate-50'}`}
                          placeholder="e.g. PayPal, Cash..."
                        />
                      </div>

                      <div className="flex gap-2">
                        {editingWalletId && (
                          <button type="button" onClick={() => { setEditingWalletId(null); setWalletFormData({ icon: 'wallet', name: '' }); }} className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300">
                            {t.cancel}
                          </button>
                        )}
                        <button type="submit" disabled={!walletFormData.name?.trim()} className="flex-1 py-2 rounded-xl bg-sky-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                          {t.save}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalyticsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-3xl shadow-2xl max-w-3xl w-full p-6 my-8 relative overflow-hidden`}>
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${currentTheme.text || 'text-slate-50'}`}>
                  <TrendingUp className={`w-6 h-6 ${currentTheme.accent}`} />
                  {t.financialBreakdown}
                </h3>
                <button onClick={() => setShowAnalyticsModal(false)} className="text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 relative z-10">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.income}</p>
                  <p className={`text-lg font-bold text-emerald-400 truncate`}>{showBalances ? formatCurrency(totalIncome, currency, lang, false) : '***'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.expense}</p>
                  <p className={`text-lg font-bold text-rose-400 truncate`}>{showBalances ? formatCurrency(totalExpenses, currency, lang, false) : '***'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.debt}</p>
                  <p className={`text-lg font-bold text-purple-400 truncate`}>{showBalances ? formatCurrency(totalDebts, currency, lang, false) : '***'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.balance || (lang === 'ar' ? 'الرصيد' : 'Balance')}</p>
                  <p className={`text-lg font-bold ${remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'} truncate`}>{showBalances ? formatCurrency(remainingBalance, currency, lang, false) : '***'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <h4 className={`text-sm font-bold mb-4 ${currentTheme.text || 'text-slate-300'}`}>{t.cashFlow}</h4>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: t.income, amount: totalIncome, fill: '#34d399' },
                        { name: t.expense, amount: totalExpenses, fill: '#fb7185' },
                        { name: t.debt, amount: totalDebts, fill: '#a78bfa' },
                      ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => showBalances ? val : '***'} />
                        <RechartsTooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(value: number) => showBalances ? formatCurrency(value, currency, lang) : '***'} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col">
                  <h4 className={`text-sm font-bold mb-4 ${currentTheme.text || 'text-slate-300'}`}>{t.distribution}</h4>
                  <div className="flex-grow w-full relative min-h-[192px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={[{ name: t.expense, value: totalExpenses, color: '#fb7185' }, { name: t.debt, value: totalDebts, color: '#a78bfa' }].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {[{ name: t.expense, value: totalExpenses, color: '#fb7185' }, { name: t.debt, value: totalDebts, color: '#a78bfa' }].filter(d => d.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(value: number) => showBalances ? formatCurrency(value, currency, lang) : '***'} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
