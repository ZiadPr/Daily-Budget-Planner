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
import AppLogo from './components/AppLogo';
import { analyzeSMS, extractTransactionData, getSmsReasonLabel, getSmsStatusLabel } from './lib/smsParser';
import { prepareNativeAppShell, requestNotificationPermissions } from './lib/nativeMobile';
import {
  AutoLockSetting,
  SECURITY_QUESTION_OPTIONS,
  fromBase64Url,
  getAutoLockMs,
  hashSecret,
  normalizeSecurityAnswer,
  toBase64Url,
} from './lib/security';
import { isNativeAndroidApp, SmsMonitor, type SmsMonitorEvent } from './lib/smsMonitor';

// --- Types ---
type TransactionType = 'income' | 'expense' | 'debt';
type Language = 'en' | 'ar';
type Theme = 'frosted' | 'midnight' | 'emerald' | 'sunset' | 'programmer' | 'girly' | 'business' | 'gamer';
type PinLength = 4 | 6;
type LockScreenMode = 'pin' | 'question' | 'reset';

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
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  lastSpawnedDate?: string;
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
  { code: 'EUR', symbol: 'â‚¬', label: 'Euro' },
  { code: 'GBP', symbol: 'Â£', label: 'British Pound' },
  { code: 'EGP', symbol: 'EÂ£', label: 'Egyptian Pound' },
  { code: 'SAR', symbol: 'SR', label: 'Saudi Riyal' },
  { code: 'AED', symbol: 'Ø¯.Ø¥', label: 'UAE Dirham' },
];

const getTheme = (themeName: Theme, isDark: boolean) => {
  return {
    bg: 'bg-bg-primary',
    card: 'bg-glass-bg border-glass-border',
    accent: 'text-accent-primary',
    btn: 'bg-accent-primary text-text-on-accent hover:opacity-90',
    shadow: '',
    gradient: 'none',
    text: 'text-text-primary'
  };
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
    goalMet: "Goal met! ðŸŽ‰",
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
    dailyLimitWarning: "âš ï¸ Daily limit exceeded! You've spent more than your daily allowance today.",
    monthlyLimitWarning: "ðŸš¨ Monthly limit exceeded! Your expenses have surpassed your total income.",
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
    fakeBalance: "Fake Balance Mode",
    fakeBalanceDesc: "Show a fake high balance to hide your real money",
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
    brand: "Ù…ÙˆÙ†ÙŠ Ù†ÙˆØª",
    tagline: "ØªØ®Ø·ÙŠØ· Ø°ÙƒÙŠ Ù„Ù…Ø³ØªÙ‚Ø¨Ù„ Ù…Ø§Ù„ÙŠ Ø£ÙˆØ¶Ø­",
    availableBalance: "Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù…ØªØ§Ø­",
    dailyAllowance: "Ø§Ù„Ù…ØµØ±ÙˆÙ Ø§Ù„ÙŠÙˆÙ…ÙŠ",
    totalIncome: "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¯Ø®Ù„",
    fixedExpenses: "Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª Ø§Ù„Ø«Ø§Ø¨ØªØ©",
    debtsSavings: "Ø§Ù„Ø¯ÙŠÙˆÙ† ÙˆØ§Ù„Ù…Ø¯Ø®Ø±Ø§Øª",
    analytics: "Ø§Ù„ØªØ­Ù„ÙŠÙ„Ø§Øª",
    settings: "Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª",
    income: "Ø¯Ø®Ù„",
    expense: "Ù…ØµØ±ÙˆÙ",
    debt: "Ø¯ÙŠÙ†/ØªÙˆÙÙŠØ±",
    addTransaction: "Ø¥Ø¶Ø§ÙØ© Ù…Ø¹Ø§Ù…Ù„Ø©",
    name: "Ø§Ù„Ø§Ø³Ù…",
    amount: "Ø§Ù„Ù…Ø¨Ù„Øº",
    date: "Ø§Ù„ØªØ§Ø±ÙŠØ®",
    type: "Ø§Ù„Ù†ÙˆØ¹",
    wallet: "ÙˆØ³ÙŠÙ„Ø© Ø§Ù„Ø¯ÙØ¹",
    noTransactions: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¹Ø§Ù…Ù„Ø§Øª Ù…Ø³Ø¬Ù„Ø© Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.",
    savingsGoal: "Ù‡Ø¯Ù Ø§Ù„Ø¥Ø¯Ø®Ø§Ø±",
    language: "Ø§Ù„Ù„ØºØ©",
    currency: "Ø§Ù„Ø¹Ù…Ù„Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©",
    theme: "Ø§Ù„Ù…Ø¸Ù‡Ø± (Ø§Ù„Ø«ÙŠÙ…)",
    exportData: "ØªØµØ¯ÙŠØ± Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª",
    importData: "Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª",
    resetData: "Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª",
    resetConfirmTitle: "Ù…Ø³Ø­ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªØŸ",
    resetConfirmMsg: "Ø³ÙŠØ¤Ø¯ÙŠ Ù‡Ø°Ø§ Ø¥Ù„Ù‰ Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø¨ÙŠØ§Ù†Ø§ØªÙƒ Ø¨Ø´ÙƒÙ„ Ø¯Ø§Ø¦Ù…. Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹ Ø¹Ù† Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡.",
    cancel: "Ø¥Ù„ØºØ§Ø¡",
    confirm: "Ù†Ø¹Ù…ØŒ Ø§Ù…Ø³Ø­",
    goalProgress: "Ø§Ù„ØªÙ‚Ø¯Ù… Ù†Ø­Ùˆ Ù‡Ø¯Ù Ø§Ù„Ø¥Ø¯Ø®Ø§Ø±",
    goalMet: "ØªÙ… ØªØ­Ù‚ÙŠÙ‚ Ø§Ù„Ù‡Ø¯Ù! ðŸŽ‰",
    moreToGo: "Ù…ØªØ¨Ù‚ÙŠ Ù„Ù„Ù‡Ø¯Ù",
    errorName: "Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø£Ù† ÙŠÙƒÙˆÙ† Ø§Ù„Ø§Ø³Ù… ÙØ§Ø±ØºØ§Ù‹",
    errorAmount: "ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø§Ù„Ù…Ø¨Ù„Øº Ø±Ù‚Ù…Ø§Ù‹ Ù…ÙˆØ¬Ø¨Ø§Ù‹",
    errorDate: "ÙŠØ±Ø¬Ù‰ ØªØ­Ø¯ÙŠØ¯ ØªØ§Ø±ÙŠØ® ØµØ­ÙŠØ­",
    financialBreakdown: "Ø§Ù„ØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ©",
    recentTransactions: "Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø§Øª Ø§Ù„Ø£Ø®ÙŠØ±Ø©",
    save: "Ø­ÙØ¸",
    edit: "ØªØ¹Ø¯ÙŠÙ„",
    delete: "Ø­Ø°Ù",
    allTime: "ÙƒÙ„ Ø§Ù„ÙˆÙ‚Øª",
    thisMonth: "Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø±",
    cashFlow: "Ø§Ù„ØªØ¯ÙÙ‚ Ø§Ù„Ù†Ù‚Ø¯ÙŠ",
    distribution: "ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù†ÙÙ‚Ø§Øª",
    wallets: "Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹",
    addWallet: "Ø¥Ø¶Ø§ÙØ© Ø·Ø±ÙŠÙ‚Ø©",
    editWallet: "ØªØ¹Ø¯ÙŠÙ„ Ø·Ø±ÙŠÙ‚Ø©",
    walletName: "Ø§Ø³Ù… Ø§Ù„Ø·Ø±ÙŠÙ‚Ø©",
    selectIcon: "Ø§Ø®ØªØ± Ø£ÙŠÙ‚ÙˆÙ†Ø©",
    dailyLimitWarning: "âš ï¸ ØªØ­Ø°ÙŠØ±: Ù„Ù‚Ø¯ ØªØ¬Ø§ÙˆØ²Øª Ø§Ù„Ø­Ø¯ Ø§Ù„Ù…Ø³Ù…ÙˆØ­ Ø¨Ù‡ Ù„Ù…ØµØ±ÙˆÙÙƒ Ø§Ù„ÙŠÙˆÙ…ÙŠ!",
    monthlyLimitWarning: "ðŸš¨ ØªØ­Ø°ÙŠØ± Ø®Ø·ÙŠØ±: Ù…ØµØ±ÙˆÙØ§ØªÙƒ Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø± ØªØ¬Ø§ÙˆØ²Øª Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø¯Ø®Ù„Ùƒ!",
    convertedTo: "ÙŠØ¹Ø§Ø¯Ù„ Ø¨Ù€",
    today: "Ø§Ù„ÙŠÙˆÙ…",
    yesterday: "Ø£Ù…Ø³",
    setupWelcome: "Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ÙÙŠ Ù…ÙˆÙ†ÙŠ Ø¨Ù„Ø§Ù†Ø±",
    setupDesc: "Ø¯Ø¹Ù†Ø§ Ù†Ù‚ÙˆÙ… Ø¨Ø¥Ø¹Ø¯Ø§Ø¯ Ù…Ù„ÙÙƒ Ø§Ù„Ù…Ø§Ù„ÙŠ Ù„Ù„Ø¨Ø¯Ø¡.",
    setupName: "Ø¨Ù…Ø§Ø°Ø§ Ù†Ù†Ø§Ø¯ÙŠÙƒØŸ",
    setupCurrency: "Ø§Ø®ØªØ± Ø¹Ù…Ù„ØªÙƒ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©",
    setupPin: "Ù‚Ù… Ø¨ØªØ¹ÙŠÙŠÙ† Ø±Ù…Ø² PIN Ù…Ù† 4 Ø£Ø±Ù‚Ø§Ù… Ù„Ù„Ø£Ù…Ø§Ù† (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)",
    setupPinPlaceholder: "0000",
    setupStart: "Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¢Ù†",
    enterPin: "Ø£Ø¯Ø®Ù„ Ø±Ù…Ø² PIN Ù„Ù„Ø¯Ø®ÙˆÙ„",
    unlock: "ÙØªØ­",
    wrongPin: "Ø±Ù…Ø² PIN ØºÙŠØ± ØµØ­ÙŠØ­. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.",
    security: "Ø§Ù„Ø£Ù…Ø§Ù†",
    enablePin: "ØªÙØ¹ÙŠÙ„ Ø­Ù…Ø§ÙŠØ© PIN",
    changePin: "ØªØºÙŠÙŠØ± Ø±Ù…Ø² PIN",
    removePin: "Ø¥Ø²Ø§Ù„Ø© Ø±Ù…Ø² PIN",
    biometricAuth: "Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø¨ÙŠÙˆÙ…ØªØ±ÙŠØ©",
    biometricDesc: "Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨ØµÙ…Ø© Ø£Ùˆ Ø§Ù„ØªØ¹Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„ÙˆØ¬Ù‡ Ù„ÙØªØ­ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚",
    fakeBalance: "ÙˆØ¶Ø¹ Ø§Ù„ØªÙ…ÙˆÙŠÙ‡ (Ø±ØµÙŠØ¯ ÙˆÙ‡Ù…ÙŠ)",
    fakeBalanceDesc: "Ø¥Ø¸Ù‡Ø§Ø± Ø±ØµÙŠØ¯ ÙƒØ¨ÙŠØ± ÙˆÙ‡Ù…ÙŠ Ù„Ø¥Ø®ÙØ§Ø¡ Ø£Ù…ÙˆØ§Ù„Ùƒ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ©",
    hello: "Ø£Ù‡Ù„Ø§Ù‹",
    onboarding1Title: "Ø®ØµÙˆØµÙŠØ© ØªØ§Ù…Ø©",
    onboarding1Desc: "ÙŠØ¹Ù…Ù„ 100% Ø¨Ø¯ÙˆÙ† Ø¥Ù†ØªØ±Ù†Øª. Ø¨ÙŠØ§Ù†Ø§ØªÙƒ Ù„Ø§ ØªØºØ§Ø¯Ø± Ù‡Ø§ØªÙÙƒ Ø£Ø¨Ø¯Ø§Ù‹. Ù„Ø§ Ø³ÙŠØ±ÙØ±Ø§ØªØŒ Ù„Ø§ ØªØªØ¨Ø¹.",
    onboarding2Title: "ØªØªØ¨Ø¹ Ø°ÙƒÙŠ",
    onboarding2Desc: "ØªØªØ¨Ø¹ Ù…ØµØ±ÙˆÙØ§ØªÙƒØŒ Ø­Ù„Ù„ Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø¨Ù†Ùƒ Ø§Ù„Ù†ØµÙŠØ©ØŒ ÙˆÙ†Ø¸Ù… Ù…ÙŠØ²Ø§Ù†ÙŠØªÙƒ Ø§Ù„ÙŠÙˆÙ…ÙŠØ© Ø¨Ø³Ù‡ÙˆÙ„Ø©.",
    onboarding3Title: "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¬Ù…Ø¹ÙŠØ§Øª",
    onboarding3Desc: "Ù†Ø¸Ù… ÙˆØªØªØ¨Ø¹ Ø§Ù„Ø¬Ù…Ø¹ÙŠØ§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆÙ…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ù‚Ø¨Ø¶ Ù„Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø¨ÙƒÙ„ Ø³Ù‡ÙˆÙ„Ø©.",
    next: "Ø§Ù„ØªØ§Ù„ÙŠ",
    startSetup: "Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯",
    smartPaste: "Ù„ØµÙ‚ Ø°ÙƒÙŠ Ù„Ù„Ø±Ø³Ø§Ø¦Ù„",
    pasteSmsHere: "Ø§Ù„ØµÙ‚ Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø¨Ù†Ùƒ Ù‡Ù†Ø§ Ù„Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...",
    parse: "ØªØ­Ù„ÙŠÙ„",
    gam3eya: "Ø§Ù„Ø¬Ù…Ø¹ÙŠØ§Øª",
    home: "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©",
    addGam3eya: "Ø¬Ù…Ø¹ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©",
    members: "Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡",
    monthlyAmount: "Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ø´Ù‡Ø±ÙŠ",
    payoutMonth: "Ø´Ù‡Ø± Ø§Ù„Ù‚Ø¨Ø¶",
    markPaid: "ØªÙ… Ø§Ù„Ø¯ÙØ¹",
    currentMonth: "Ø§Ù„Ø´Ù‡Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ"
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
  const [pinErrorMessage, setPinErrorMessage] = useState('');
  const [lockScreenMode, setLockScreenMode] = useState<LockScreenMode>('pin');
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');
  const [resetPinValue, setResetPinValue] = useState('');
  const [resetPinConfirm, setResetPinConfirm] = useState('');
  const [resetPinLength, setResetPinLength] = useState<PinLength>(4);
  const [securityResetError, setSecurityResetError] = useState('');
  const [lockScreenTick, setLockScreenTick] = useState(Date.now());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'gam3eya' | 'transactions'>('home');
  
  // User Profile
  const [userName, setUserName] = useLocalStorage<string>('budget_user_name', '');
  const [pinHash, setPinHash] = useLocalStorage<string>('budget_pin_hash', '');
  const [pinLength, setPinLength] = useLocalStorage<PinLength>('budget_pin_length', 4);
  const [failedPinAttempts, setFailedPinAttempts] = useLocalStorage<number>('budget_pin_failed_attempts', 0);
  const [pinLockUntil, setPinLockUntil] = useLocalStorage<number>('budget_pin_lock_until', 0);
  const [securityQuestionId, setSecurityQuestionId] = useLocalStorage<string>('budget_security_question_id', SECURITY_QUESTION_OPTIONS[0].id);
  const [securityAnswerHash, setSecurityAnswerHash] = useLocalStorage<string>('budget_security_answer_hash', '');
  const [useBiometrics, setUseBiometrics] = useLocalStorage<boolean>('budget_use_biometrics', false);
  const [biometricCredentialId, setBiometricCredentialId] = useLocalStorage<string>('budget_biometric_credential_id', '');
  const [autoLockPreference, setAutoLockPreference] = useLocalStorage<AutoLockSetting>('budget_auto_lock_preference', '5');

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('budget_transactions', []);
  const [gam3eyat, setGam3eyat] = useLocalStorage<Gam3eya[]>('budget_gam3eyat', []);
  const [wallets, setWallets] = useLocalStorage<WalletType[]>('budget_wallets', [
    { id: '1', name: 'Cash / ÙƒØ§Ø´', icon: 'cash' },
    { id: '2', name: 'Bank / Ø¨Ù†Ùƒ', icon: 'bank' },
    { id: '3', name: 'Vodafone Cash', icon: 'mobile' }
  ]);
  const [currency, setCurrency] = useLocalStorage<string>('budget_currency', 'USD');
  const [savingsGoal, setSavingsGoal] = useLocalStorage<number>('budget_savings_goal', 0);
  const [lang, setLang] = useLocalStorage<Language>('budget_language', 'en');
  const [theme, setTheme] = useLocalStorage<Theme>('app_theme', 'midnight');
  const [fakeBalanceMode, setFakeBalanceMode] = useLocalStorage<boolean>('budget_fake_balance_enabled', false);
  const [fakeBalanceAmount, setFakeBalanceAmount] = useLocalStorage<number>('budget_fake_balance_amount', 0);
  
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
  const [smsSenderId, setSmsSenderId] = useState('');
  const [smsAlert, setSmsAlert] = useState<SmsMonitorEvent | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('budget_dark_mode', true);
  const [setupPinValue, setSetupPinValue] = useState('');
  const [setupPinLength, setSetupPinLength] = useState<PinLength>(4);
  const [setupSecurityQuestionId, setSetupSecurityQuestionId] = useState<string>(SECURITY_QUESTION_OPTIONS[0].id);
  const [setupSecurityAnswer, setSetupSecurityAnswer] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [settingsPinDraft, setSettingsPinDraft] = useState('');
  const [settingsPinConfirmDraft, setSettingsPinConfirmDraft] = useState('');
  const [settingsPinLengthDraft, setSettingsPinLengthDraft] = useState<PinLength>(4);
  const [settingsSecurityQuestionId, setSettingsSecurityQuestionId] = useState<string>(SECURITY_QUESTION_OPTIONS[0].id);
  const [settingsSecurityAnswer, setSettingsSecurityAnswer] = useState('');
  const [settingsSecurityError, setSettingsSecurityError] = useState<string | null>(null);
  const [settingsSecuritySuccess, setSettingsSecuritySuccess] = useState<string | null>(null);
  const [fakeBalanceInput, setFakeBalanceInput] = useState('');

  const lockTimerRef = useRef<number | null>(null);
  const lastInteractionAtRef = useRef(Date.now());
  const hiddenAtRef = useRef<number | null>(null);
  const hasInitializedSecurityRef = useRef(false);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
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
  const pinEnabled = pinHash.length > 0;
  const isPinTemporarilyLocked = pinLockUntil > lockScreenTick;
  const lockCountdownSeconds = Math.max(0, Math.ceil((pinLockUntil - lockScreenTick) / 1000));
  const securityQuestionLabel = SECURITY_QUESTION_OPTIONS.find((option) => option.id === securityQuestionId)?.label[lang] ?? SECURITY_QUESTION_OPTIONS[0].label[lang];
  const canUseBiometricsOnLockScreen = biometricSupported && useBiometrics && Boolean(biometricCredentialId);

  useEffect(() => {
    setResetPinLength(pinLength);
    setSettingsPinLengthDraft(pinLength);
    setSettingsSecurityQuestionId(securityQuestionId);
    setFakeBalanceInput(fakeBalanceAmount ? String(fakeBalanceAmount) : '');
  }, [pinLength, securityQuestionId, fakeBalanceAmount]);

  useEffect(() => {
    if (pinLockUntil <= Date.now()) {
      setLockScreenTick(Date.now());
      return;
    }

    const interval = window.setInterval(() => {
      setLockScreenTick(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [pinLockUntil]);

  // Process Recurring Transactions on Load
  useEffect(() => {
    if (transactions.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const newTransactions: Transaction[] = [];
    
    let modified = false;
    const currentTx = [...transactions];

    for (let i = 0; i < currentTx.length; i++) {
      const t = currentTx[i];
      if (t.recurring && t.recurring !== 'none') {
        const lastDate = t.lastSpawnedDate || t.date;
        if (lastDate >= today) continue;

        let d = new Date(lastDate);
        const tToday = new Date(today);
        
        while(true) {
          if (t.recurring === 'daily') {
            d.setDate(d.getDate() + 1);
          } else if (t.recurring === 'weekly') {
            d.setDate(d.getDate() + 7);
          } else if (t.recurring === 'monthly') {
            d.setMonth(d.getMonth() + 1);
          }

          if (d > tToday) break;

          const spawnDateStr = d.toISOString().split('T')[0];
          newTransactions.push({
            ...t,
            id: generateId(),
            date: spawnDateStr,
            recurring: 'none', // Spawned instances don't recurr
            name: `${t.name} (Auto)`
          });
          currentTx[i] = { ...currentTx[i], lastSpawnedDate: spawnDateStr };
          modified = true;
        }
      }
    }

    if (modified) {
      setTransactions([...newTransactions, ...currentTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, [transactions]); // Wait, if I put transactions in deps, it will re-run infinitely.

  useEffect(() => {
    let cancelled = false;

    const migrateLegacySecurity = async () => {
      try {
        const legacyPinRaw = window.localStorage.getItem('budget_user_pin');
        if (!pinHash && legacyPinRaw) {
          const parsedPin = JSON.parse(legacyPinRaw);
          if (typeof parsedPin === 'string' && /^\d{4,6}$/.test(parsedPin)) {
            const migratedHash = await hashSecret(parsedPin);
            if (cancelled) return;
            setPinHash(migratedHash);
            setPinLength(parsedPin.length === 6 ? 6 : 4);
          }
          window.localStorage.removeItem('budget_user_pin');
        }

        const legacyFakeModeRaw = window.localStorage.getItem('budget_fake_balance');
        if (legacyFakeModeRaw) {
          const parsedFakeMode = JSON.parse(legacyFakeModeRaw);
          if (!cancelled && typeof parsedFakeMode === 'boolean') {
            setFakeBalanceMode(parsedFakeMode);
          }
          window.localStorage.removeItem('budget_fake_balance');
        }

        window.localStorage.removeItem('budget_show_balances');
      } catch (error) {
        console.error('Failed to migrate legacy security settings', error);
      }
    };

    migrateLegacySecurity();

    return () => {
      cancelled = true;
    };
  }, [pinHash, setPinHash, setPinLength, setFakeBalanceMode]);

  useEffect(() => {
    let cancelled = false;

    const detectBiometricSupport = async () => {
      if (
        !window.isSecureContext ||
        !window.PublicKeyCredential ||
        !navigator.credentials ||
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
      ) {
        if (!cancelled) {
          setBiometricSupported(false);
        }
        return;
      }

      try {
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!cancelled) {
          setBiometricSupported(isAvailable);
        }
      } catch (error) {
        console.error('Failed to detect biometric support', error);
        if (!cancelled) {
          setBiometricSupported(false);
        }
      }
    };

    detectBiometricSupport();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasSeenOnboarding || !isSetupComplete) {
      setIsLocked(false);
      hasInitializedSecurityRef.current = false;
      return;
    }

    if (!hasInitializedSecurityRef.current) {
      setIsLocked(pinEnabled);
      hasInitializedSecurityRef.current = true;
      return;
    }

    if (!pinEnabled) {
      setIsLocked(false);
    }
  }, [hasSeenOnboarding, isSetupComplete, pinEnabled]);

  useEffect(() => {
    if (pinEnabled && isSetupComplete && hasSeenOnboarding) {
      setIsSplashVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSplashVisible(false);
      if (!pinEnabled || !isSetupComplete || !hasSeenOnboarding) {
        setIsLocked(false);
      }
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [pinEnabled, isSetupComplete, hasSeenOnboarding]);

  const clearAutoLockTimer = () => {
    if (lockTimerRef.current !== null) {
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  };

  const scheduleAutoLock = () => {
    clearAutoLockTimer();

    const autoLockMs = getAutoLockMs(autoLockPreference);
    if (!pinEnabled || !hasSeenOnboarding || !isSetupComplete || isLocked || autoLockMs === null) {
      return;
    }

    lockTimerRef.current = window.setTimeout(() => {
      lockApp();
    }, autoLockMs);
  };

  const markUserInteraction = () => {
    lastInteractionAtRef.current = Date.now();
    scheduleAutoLock();
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        clearAutoLockTimer();

        if (pinEnabled && hasSeenOnboarding && isSetupComplete) {
          lockApp();
        }

        return;
      }

      const hiddenFor = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      const autoLockMs = getAutoLockMs(autoLockPreference);
      hiddenAtRef.current = null;

      if (
        pinEnabled &&
        hasSeenOnboarding &&
        isSetupComplete &&
        autoLockMs !== null &&
        hiddenFor >= autoLockMs
      ) {
        lockApp();
        return;
      }

      markUserInteraction();
    };

    const handleActivity = () => {
      if (!document.hidden) {
        markUserInteraction();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity, { passive: true });

    handleActivity();

    return () => {
      clearAutoLockTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [autoLockPreference, pinEnabled, hasSeenOnboarding, isSetupComplete, isLocked]);

  const resetLockScreenState = () => {
    setPinInput('');
    setPinErrorMessage('');
    setLockScreenMode('pin');
    setSecurityAnswerInput('');
    setResetPinValue('');
    setResetPinConfirm('');
    setSecurityResetError('');
    setLockScreenTick(Date.now());
  };

  const lockApp = (mode: LockScreenMode = 'pin') => {
    setIsLocked(true);
    setPinInput('');
    setPinErrorMessage('');
    setLockScreenMode(mode);
    setSecurityAnswerInput('');
    setResetPinValue('');
    setResetPinConfirm('');
    setSecurityResetError('');
    setLockScreenTick(Date.now());
    clearAutoLockTimer();
  };

  const unlockApp = () => {
    setIsLocked(false);
    setFailedPinAttempts(0);
    setPinLockUntil(0);
    resetLockScreenState();
    markUserInteraction();
  };

  const handleBiometricAuth = async () => {
    if (!biometricSupported || !biometricCredentialId || !useBiometrics || !navigator.credentials) {
      return false;
    }

    try {
      setBiometricBusy(true);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [
            {
              id: fromBase64Url(biometricCredentialId),
              type: 'public-key',
            },
          ],
          timeout: 60000,
          userVerification: 'preferred',
        },
      });

      if (credential) {
        unlockApp();
        return true;
      }
    } catch (error) {
      console.error('Biometric authentication failed', error);
      setPinErrorMessage(lang === 'ar' ? 'ÙØ´Ù„ Ø§Ù„ØªØ­Ù‚Ù‚ Ø¨Ø§Ù„Ø¨ØµÙ…Ø©. Ø§Ø³ØªØ®Ø¯Ù… Ø±Ù…Ø² PIN.' : 'Biometric unlock failed. Use your PIN instead.');
    } finally {
      setBiometricBusy(false);
    }

    return false;
  };

  const handleRegisterBiometric = async () => {
    if (!pinEnabled) {
      setSettingsSecurityError(lang === 'ar' ? 'ÙØ¹Ù‘Ù„ Ø±Ù…Ø² PIN Ø£ÙˆÙ„Ø§Ù‹ Ù‚Ø¨Ù„ Ø§Ù„Ø¨ØµÙ…Ø©.' : 'Enable a PIN first before turning on biometrics.');
      setSettingsSecuritySuccess(null);
      return false;
    }

    if (!biometricSupported || !navigator.credentials) {
      return false;
    }

    try {
      setBiometricBusy(true);
      setSettingsSecurityError(null);
      setSettingsSecuritySuccess(null);

      const created = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: t.brand,
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(32)),
            name: `${userName || 'money-planner'}@local.device`,
            displayName: userName || t.brand,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'preferred',
            userVerification: 'preferred',
          },
          attestation: 'none',
          timeout: 60000,
          ...(biometricCredentialId
            ? {
                excludeCredentials: [
                  {
                    id: fromBase64Url(biometricCredentialId),
                    type: 'public-key' as const,
                  },
                ],
              }
            : {}),
        },
      });

      if (created instanceof PublicKeyCredential) {
        const credentialId = toBase64Url(new Uint8Array(created.rawId));
        setBiometricCredentialId(credentialId);
        setUseBiometrics(true);
        setSettingsSecuritySuccess(lang === 'ar' ? 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø© Ø¨Ù†Ø¬Ø§Ø­.' : 'Biometric unlock registered successfully.');
        return true;
      }
    } catch (error) {
      console.error('Biometric registration failed', error);
      setSettingsSecurityError(
        lang === 'ar'
          ? 'ØªØ¹Ø°Ù‘Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø© Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø².'
          : 'Biometric registration failed on this device.'
      );
    } finally {
      setBiometricBusy(false);
    }

    return false;
  };

  const handleToggleBiometric = async () => {
    if (useBiometrics) {
      setUseBiometrics(false);
      setSettingsSecuritySuccess(lang === 'ar' ? 'ØªÙ… Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ø¨ØµÙ…Ø©.' : 'Biometric unlock disabled.');
      return;
    }

    if (!biometricCredentialId) {
      const registered = await handleRegisterBiometric();
      if (!registered) {
        return;
      }
    }

    setUseBiometrics(true);
    setSettingsSecuritySuccess(lang === 'ar' ? 'ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø©.' : 'Biometric unlock enabled.');
  };

  const verifyPinCandidate = async (candidate: string) => {
    if (!pinEnabled) {
      unlockApp();
      return true;
    }

    if (isPinTemporarilyLocked) {
      setPinErrorMessage(
        lang === 'ar'
          ? `ØªÙ… Ù‚ÙÙ„ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ù…Ø¤Ù‚ØªÙ‹Ø§. Ø­Ø§ÙˆÙ„ Ø¨Ø¹Ø¯ ${lockCountdownSeconds} Ø«Ø§Ù†ÙŠØ©.`
          : `Too many attempts. Try again in ${lockCountdownSeconds} seconds.`
      );
      return false;
    }

    const hashedCandidate = await hashSecret(candidate);
    if (hashedCandidate === pinHash) {
      unlockApp();
      return true;
    }

    const nextAttempts = failedPinAttempts + 1;
    setFailedPinAttempts(nextAttempts);
    setPinInput('');

    if (nextAttempts >= 10) {
      setLockScreenMode('question');
      setPinErrorMessage(
        lang === 'ar'
          ? 'ØªÙ… ØªØ¬Ø§ÙˆØ² Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø§Ù„Ù…Ø³Ù…ÙˆØ­. Ø£Ø¬Ø¨ Ø¹Ù† Ø³Ø¤Ø§Ù„ Ø§Ù„Ø£Ù…Ø§Ù† Ù„Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† Ø§Ù„Ø±Ù…Ø².'
          : 'Too many failed attempts. Answer your security question to reset the PIN.'
      );
      return false;
    }

    if (nextAttempts >= 5) {
      setPinLockUntil(Date.now() + 60_000);
      setPinErrorMessage(
        lang === 'ar'
          ? 'ØªÙ… Ù‚ÙÙ„ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ù„Ù…Ø¯Ø© 60 Ø«Ø§Ù†ÙŠØ©.'
          : 'The PIN is locked for 60 seconds.'
      );
      return false;
    }

    setPinErrorMessage(t.wrongPin);
    return false;
  };

  useEffect(() => {
    if (!isLocked || lockScreenMode !== 'pin' || pinInput.length !== pinLength) {
      return;
    }

    void verifyPinCandidate(pinInput);
  }, [isLocked, lockScreenMode, pinInput, pinLength]);

  useEffect(() => {
    if (!isLocked || lockScreenMode !== 'pin') {
      return;
    }

    const handleLockScreenKeyboard = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key) && !isPinTemporarilyLocked) {
        setPinErrorMessage('');
        setPinInput((current) => (current.length < pinLength ? `${current}${event.key}` : current));
        return;
      }

      if (event.key === 'Backspace') {
        setPinInput((current) => current.slice(0, -1));
        return;
      }

      if (event.key === 'Escape') {
        setLockScreenMode('pin');
        setPinErrorMessage('');
        setSecurityResetError('');
      }
    };

    window.addEventListener('keydown', handleLockScreenKeyboard);
    return () => window.removeEventListener('keydown', handleLockScreenKeyboard);
  }, [isLocked, lockScreenMode, pinLength, isPinTemporarilyLocked]);

  const handleToggleBalance = () => {
    setIsPrivacyMode((current) => !current);
  };

  const handlePinDigit = (digit: string) => {
    if (!isLocked || lockScreenMode !== 'pin' || isPinTemporarilyLocked) {
      return;
    }

    setPinErrorMessage('');
    setPinInput((current) => (current.length < pinLength ? `${current}${digit}` : current));
  };

  const handlePinBackspace = () => {
    setPinInput((current) => current.slice(0, -1));
    setPinErrorMessage('');
  };

  const handleForgotPin = () => {
    setLockScreenMode('question');
    setPinErrorMessage('');
    setSecurityResetError('');
    setSecurityAnswerInput('');
  };

  const handleColorModeToggle = () => {
    const nextIsDarkMode = !isDarkMode;
    setIsDarkMode(nextIsDarkMode);

    const darkThemes: Theme[] = ['midnight', 'sunset', 'emerald', 'girly', 'programmer', 'gamer'];
    const lightThemes: Theme[] = ['frosted', 'business'];

    if (nextIsDarkMode && !darkThemes.includes(theme)) {
      setTheme('midnight');
    }

    if (!nextIsDarkMode && !lightThemes.includes(theme)) {
      setTheme('business');
    }
  };

  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSecurityError(null);
    setSettingsSecuritySuccess(null);

    const trimmedPin = settingsPinDraft.trim();
    const trimmedConfirm = settingsPinConfirmDraft.trim();
    const trimmedSecurityAnswer = settingsSecurityAnswer.trim();

    if (!/^-?\d*(\.\d+)?$/.test(fakeBalanceInput.trim()) && fakeBalanceInput.trim()) {
      setSettingsSecurityError(lang === 'ar' ? 'Ø£Ø¯Ø®Ù„ Ø±ØµÙŠØ¯Ù‹Ø§ ÙˆÙ‡Ù…ÙŠÙ‹Ø§ ØµØ§Ù„Ø­Ù‹Ø§.' : 'Enter a valid fake balance amount.');
      return;
    }

    const parsedFakeBalance = fakeBalanceInput.trim() ? Number(fakeBalanceInput) : 0;
    if (Number.isNaN(parsedFakeBalance) || parsedFakeBalance < 0) {
      setSettingsSecurityError(lang === 'ar' ? 'Ù‚ÙŠÙ…Ø© Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„ÙˆÙ‡Ù…ÙŠ ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† ØµÙØ±Ù‹Ø§ Ø£Ùˆ Ø£ÙƒØ«Ø±.' : 'Fake balance must be zero or greater.');
      return;
    }

    if (fakeBalanceMode && parsedFakeBalance <= 0) {
      setSettingsSecurityError(lang === 'ar' ? 'Ø£Ø¯Ø®Ù„ Ø±ØµÙŠØ¯Ù‹Ø§ ÙˆÙ‡Ù…ÙŠÙ‹Ø§ Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ± Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„ÙˆØ¶Ø¹.' : 'Enter a fake balance greater than zero to enable this mode.');
      return;
    }

    setFakeBalanceAmount(parsedFakeBalance);

    if (!trimmedPin && !pinEnabled) {
      setAutoLockPreference(autoLockPreference);
      setSettingsPinDraft('');
      setSettingsPinConfirmDraft('');
      setSettingsSecurityAnswer('');
      setSettingsSecuritySuccess(lang === 'ar' ? 'ØªÙ… Ø­ÙØ¸ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®ØµÙˆØµÙŠØ©.' : 'Privacy settings saved.');
      return;
    }

    if (!trimmedPin && pinEnabled) {
      return;
    }

    if (!/^\d+$/.test(trimmedPin) || trimmedPin.length !== settingsPinLengthDraft) {
      setSettingsSecurityError(
        lang === 'ar'
          ? `Ø£Ø¯Ø®Ù„ Ø±Ù…Ø² PIN Ù…ÙƒÙˆÙ‘Ù†Ù‹Ø§ Ù…Ù† ${settingsPinLengthDraft} Ø£Ø±Ù‚Ø§Ù….`
          : `Enter a ${settingsPinLengthDraft}-digit PIN.`
      );
      return;
    }

    if (trimmedPin !== trimmedConfirm) {
      setSettingsSecurityError(lang === 'ar' ? 'Ø±Ù…Ø²Ø§ PIN ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚ÙŠÙ†.' : 'PIN values do not match.');
      return;
    }

    const answerToSave = trimmedSecurityAnswer || '';
    if (!answerToSave && !securityAnswerHash) {
      setSettingsSecurityError(
        lang === 'ar'
          ? 'Ø£Ø¯Ø®Ù„ Ø¥Ø¬Ø§Ø¨Ø© Ø³Ø¤Ø§Ù„ Ø§Ù„Ø£Ù…Ø§Ù† Ù„Ù„Ø§Ø­ØªÙØ§Ø¸ Ø¨Ø®ÙŠØ§Ø± Ø§Ø³ØªØ¹Ø§Ø¯Ø© PIN.'
          : 'Add a security answer to keep PIN recovery available.'
      );
      return;
    }

    const hashedPin = await hashSecret(trimmedPin);
    setPinHash(hashedPin);
    setPinLength(settingsPinLengthDraft);
    setSecurityQuestionId(settingsSecurityQuestionId);

    if (answerToSave) {
      const hashedAnswer = await hashSecret(normalizeSecurityAnswer(answerToSave));
      setSecurityAnswerHash(hashedAnswer);
    }

    setFailedPinAttempts(0);
    setPinLockUntil(0);
    setSettingsPinDraft('');
    setSettingsPinConfirmDraft('');
    setSettingsSecurityAnswer('');
    setSettingsSecuritySuccess(lang === 'ar' ? 'ØªÙ… Ø­ÙØ¸ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø£Ù…Ø§Ù†.' : 'Security settings saved.');
  };

  const handleDisablePin = () => {
    const confirmed = window.confirm(
      lang === 'ar'
        ? 'Ù‡Ù„ ØªØ±ÙŠØ¯ ØªØ¹Ø·ÙŠÙ„ Ù‚ÙÙ„ PIN ÙˆØ§Ù„Ø¨ØµÙ…Ø©ØŸ'
        : 'Disable PIN lock and biometric unlock?'
    );

    if (!confirmed) {
      return;
    }

    setPinHash('');
    setPinLength(4);
    setUseBiometrics(false);
    setBiometricCredentialId('');
    setSecurityAnswerHash('');
    setFailedPinAttempts(0);
    setPinLockUntil(0);
    setSettingsPinDraft('');
    setSettingsPinConfirmDraft('');
    setSettingsSecurityAnswer('');
    setSettingsSecurityError(null);
    setSettingsSecuritySuccess(lang === 'ar' ? 'ØªÙ… ØªØ¹Ø·ÙŠÙ„ PIN ÙˆØ§Ù„Ø¨ØµÙ…Ø©.' : 'PIN and biometric unlock disabled.');
    setIsLocked(false);
  };

  const handleSecurityQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!securityAnswerHash) {
      setSecurityResetError(
        lang === 'ar'
          ? 'Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø³Ø¤Ø§Ù„ Ø£Ù…Ø§Ù† Ù…Ø­ÙÙˆØ¸ Ù„Ù‡Ø°Ø§ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚.'
          : 'No backup security question is configured for this app.'
      );
      return;
    }

    const hashedAnswer = await hashSecret(normalizeSecurityAnswer(securityAnswerInput));
    if (hashedAnswer !== securityAnswerHash) {
      setSecurityResetError(
        lang === 'ar'
          ? 'Ø¥Ø¬Ø§Ø¨Ø© Ø³Ø¤Ø§Ù„ Ø§Ù„Ø£Ù…Ø§Ù† ØºÙŠØ± ØµØ­ÙŠØ­Ø©.'
          : 'Incorrect answer to the security question.'
      );
      return;
    }

    setFailedPinAttempts(0);
    setPinLockUntil(0);
    setSecurityAnswerInput('');
    setSecurityResetError('');
    setPinErrorMessage('');
    setLockScreenMode('reset');
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d+$/.test(resetPinValue) || resetPinValue.length !== resetPinLength) {
      setSecurityResetError(
        lang === 'ar'
          ? `Ø£Ø¯Ø®Ù„ Ø±Ù…Ø² PIN Ù…ÙƒÙˆÙ‘Ù†Ù‹Ø§ Ù…Ù† ${resetPinLength} Ø£Ø±Ù‚Ø§Ù….`
          : `Enter a ${resetPinLength}-digit PIN.`
      );
      return;
    }

    if (resetPinValue !== resetPinConfirm) {
      setSecurityResetError(lang === 'ar' ? 'Ø±Ù…Ø²Ø§ PIN ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚ÙŠÙ†.' : 'PIN values do not match.');
      return;
    }

    const hashedPin = await hashSecret(resetPinValue);
    setPinHash(hashedPin);
    setPinLength(resetPinLength);
    setFailedPinAttempts(0);
    setPinLockUntil(0);
    setSecurityResetError('');
    setIsLocked(false);
    resetLockScreenState();
    markUserInteraction();
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    setSetupError(null);
    if (!userName.trim()) return;

    if (setupPinValue) {
      if (!/^\d+$/.test(setupPinValue) || setupPinValue.length !== setupPinLength) {
        setSetupError(
          lang === 'ar'
            ? `Ø£Ø¯Ø®Ù„ Ø±Ù…Ø² PIN Ù…ÙƒÙˆÙ‘Ù†Ù‹Ø§ Ù…Ù† ${setupPinLength} Ø£Ø±Ù‚Ø§Ù….`
            : `Enter a ${setupPinLength}-digit PIN.`
        );
        return;
      }

      if (!setupSecurityAnswer.trim()) {
        setSetupError(
          lang === 'ar'
            ? 'Ø£Ø¯Ø®Ù„ Ø¥Ø¬Ø§Ø¨Ø© Ø³Ø¤Ø§Ù„ Ø§Ù„Ø£Ù…Ø§Ù† Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø®ÙŠØ§Ø± Ù†Ø³ÙŠØª Ø§Ù„Ø±Ù…Ø².'
            : 'Add a backup security answer to enable PIN recovery.'
        );
        return;
      }

      const hashedPin = await hashSecret(setupPinValue);
      const hashedAnswer = await hashSecret(normalizeSecurityAnswer(setupSecurityAnswer));
      setPinHash(hashedPin);
      setPinLength(setupPinLength);
      setSecurityQuestionId(setupSecurityQuestionId);
      setSecurityAnswerHash(hashedAnswer);
      setFailedPinAttempts(0);
      setPinLockUntil(0);
      setUseBiometrics(false);
      setBiometricCredentialId('');
    } else {
      setPinHash('');
      setSecurityAnswerHash('');
      setFailedPinAttempts(0);
      setPinLockUntil(0);
      setUseBiometrics(false);
    }

    setIsSetupComplete(true);
    setHasSeenOnboarding(true);
    setIsLocked(false);
    setSetupPinValue('');
    setSetupSecurityAnswer('');
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

    let sender = smsSenderId.trim();

    if (!sender) {
      // Simulate looking for sender in pasted text since WebView is restricted
      const senderMatch = smsText.match(/(CIB|NBE|BanqueMisr|QNB|ALEXBANK|HSBC|Fawry|InstaPay|VFCash|OrangeMoney|Vodafone|Orange|Etisalat|WE)/i);
      if(senderMatch) {
          sender = senderMatch[0];
      } else {
          const firstWordMatch = smsText.match(/^[^\s]+/);
          sender = firstWordMatch ? firstWordMatch[0] : 'Unknown';
      }
    }

    const verificationResult = analyzeSMS(sender, smsText);
    const { amount, type } = extractTransactionData(smsText);
    
    let finalName = type === 'income' ? (lang === 'ar' ? 'Ø¥ÙŠØ¯Ø§Ø¹ Ø¨Ù†ÙƒÙŠ' : 'Bank Deposit') : (lang === 'ar' ? 'Ù…Ø¯ÙÙˆØ¹Ø§Øª Ø¨Ù†ÙƒÙŠØ©' : 'Bank Payment');
    
    if (verificationResult.status === 'VERIFIED') {
       finalName += ` (${sender})`;
    }

    setFormData({
      ...formData,
      amount: amount || undefined,
      type,
      name: finalName,
      date: new Date().toISOString().split('T')[0]
    });
    
    if (verificationResult.status === 'FRAUD' || verificationResult.status === 'SUSPICIOUS') {
      alert(`âš ï¸ Fraud Warning: ${verificationResult.reason}`);
    }

    setShowSmsParser(false);
    setShowAddModal(true);
    setSmsText('');
    setSmsSenderId('');
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
  const fakeBalanceActive = fakeBalanceMode && fakeBalanceAmount > 0;
  const displayedDashboardBalance = fakeBalanceActive ? fakeBalanceAmount : remainingBalance;
  const displayedDailyAllowance = fakeBalanceActive
    ? Math.max(fakeBalanceAmount / daysInMonth, 0)
    : dailyAllowance;

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
      walletId: formData.walletId,
      recurring: formData.recurring || 'none'
    };

    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? newTransaction : t));
    } else {
      setTransactions([newTransaction, ...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    closeAddModal();
  };

  const openAddModal = (type: TransactionType = 'expense') => {
    setFormData({ type, date: new Date().toISOString().split('T')[0], name: '', amount: undefined, walletId: wallets[0]?.id, recurring: 'none' });
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

  const closeSettingsPanel = () => {
    setShowWalletManager(false);
    setEditingWalletId(null);
    setShowSettingsModal(false);
  };

  const handleBackdropDismiss = (
    event: React.MouseEvent<HTMLDivElement>,
    onClose: () => void
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(lang === 'ar' ? 'Ù‡Ù„ ØªØ±ÙŠØ¯ Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø©ØŸ' : 'Delete this transaction?')) {
      return false;
    }

    setTransactions(transactions.filter(t => t.id !== id));
    return true;
  };

  const handleReset = () => {
    setTransactions([]);
    setGam3eyat([]);
    setWallets([
      { id: '1', name: 'Cash / ÙƒØ§Ø´', icon: 'cash' },
      { id: '2', name: 'Bank / Ø¨Ù†Ùƒ', icon: 'bank' },
      { id: '3', name: 'Vodafone Cash', icon: 'mobile' }
    ]);
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
    if (!window.confirm(lang === 'ar' ? 'Ù‡Ù„ ØªØ±ÙŠØ¯ Ø­Ø°Ù ÙˆØ³ÙŠÙ„Ø© Ø§Ù„Ø¯ÙØ¹ Ù‡Ø°Ù‡ØŸ' : 'Delete this payment method?')) {
      return;
    }

    setWallets(wallets.filter(w => w.id !== id));
    // Also remove walletId from transactions that used this wallet
    setTransactions(transactions.map(t => t.walletId === id ? { ...t, walletId: undefined } : t));
  };


  const currentCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';
  const analyticsHasData = totalIncome > 0 || totalExpenses > 0 || totalDebts > 0;
  const cashFlowChartData = [
    { name: t.income, amount: totalIncome, fill: '#34d399' },
    { name: t.expense, amount: totalExpenses, fill: '#fb7185' },
    { name: t.debt, amount: totalDebts, fill: '#a78bfa' },
  ];
  const distributionChartData = [
    { name: t.expense, value: totalExpenses, color: '#fb7185' },
    { name: t.debt, value: totalDebts, color: '#a78bfa' },
  ].filter((item) => item.value > 0);

  // Render Helpers
  const SensitiveText = ({
    children,
    className = "",
    mask = 'â€¢â€¢â€¢â€¢',
  }: {
    children: React.ReactNode,
    className?: string,
    mask?: string
  }) => (
    <span className={`relative inline-grid align-middle ${className}`}>
      <span className={`col-start-1 row-start-1 transition-all duration-300 ${isPrivacyMode ? 'scale-95 opacity-0 blur-sm' : 'scale-100 opacity-100 blur-0'}`}>
        {children}
      </span>
      <span aria-hidden className={`col-start-1 row-start-1 transition-all duration-300 ${isPrivacyMode ? 'scale-100 opacity-100 blur-0' : 'scale-95 opacity-0 blur-sm'}`}>
        {mask}
      </span>
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

  const getSmsAlertAccent = (status: SmsMonitorEvent['status']) => {
    switch (status) {
      case 'VERIFIED':
        return 'border-emerald-500/30 bg-emerald-500/12 text-emerald-300';
      case 'SUSPICIOUS':
        return 'border-amber-500/30 bg-amber-500/12 text-amber-300';
      case 'FRAUD':
        return 'border-rose-500/30 bg-rose-500/14 text-rose-300';
      default:
        return 'border-sky-500/30 bg-sky-500/12 text-sky-300';
    }
  };

  const getSmsAlertIcon = (status: SmsMonitorEvent['status']) => {
    switch (status) {
      case 'VERIFIED':
        return <ShieldCheck className="h-5 w-5" />;
      case 'SUSPICIOUS':
      case 'FRAUD':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const createSmsMonitorEvent = (sender: string, body: string): SmsMonitorEvent => {
    const analysis = analyzeSMS(sender, body);
    const { amount, type } = extractTransactionData(body);
    const statusLabel = getSmsStatusLabel(analysis.status, lang);
    const senderLabel = sender || (lang === 'ar' ? 'مرسل غير معروف' : 'Unknown sender');
    const amountLabel = amount > 0 ? formatCurrency(amount, currency, lang, false) : (lang === 'ar' ? 'بدون مبلغ واضح' : 'No clear amount');

    return {
      id: `sms-${Date.now()}`,
      sender: senderLabel,
      body,
      amount,
      type: type as SmsMonitorEvent['type'],
      status: analysis.status,
      reason: analysis.reason,
      timestamp: Date.now(),
      notificationTitle: `${lang === 'ar' ? 'رسالة مالية جديدة' : 'New money SMS'} • ${statusLabel}`,
      notificationBody: `${senderLabel} • ${amountLabel}`,
    };
  };

  const handleIncomingSmsEvent = (event: SmsMonitorEvent) => {
    setSmsText(event.body);
    setSmsSenderId(event.sender);
    setSmsAlert(event);
  };

  useEffect(() => {
    void prepareNativeAppShell(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    let isCancelled = false;
    let smsListener: { remove: () => Promise<void> | void } | null = null;

    const setupNativeSmsBridge = async () => {
      if (!isNativeAndroidApp()) {
        return;
      }

      try {
        smsListener = await SmsMonitor.addListener('smsReceived', (event) => {
          handleIncomingSmsEvent(event);
        });

        const pending = await SmsMonitor.getPendingSmsEvent();
        if (!isCancelled && pending.event) {
          handleIncomingSmsEvent(pending.event);
        }
      } catch (error) {
        console.error('Failed to initialize native SMS bridge', error);
      }
    };

    void setupNativeSmsBridge();

    return () => {
      isCancelled = true;
      smsListener?.remove?.();
    };
  }, []);

  // --- Android SMS Integration ---
  useEffect(() => {
    (window as any).receiveSMS = (smsBody: string, senderId?: string) => {
      if (!smsBody) {
        return;
      }

      console.log('Received SMS from Android:', smsBody);
      handleIncomingSmsEvent(createSmsMonitorEvent(senderId || '', smsBody));
    };

    return () => {
      delete (window as any).receiveSMS;
    };
  }, [lang, currency]);

  useEffect(() => {
    if (!smsAlert) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSmsAlert((current) => (current?.id === smsAlert.id ? null : current));
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [smsAlert]);

  const requestSmsPermission = async () => {
    if (isNativeAndroidApp()) {
      try {
        const [smsPermission, notificationPermission] = await Promise.all([
          SmsMonitor.requestPermissions(),
          requestNotificationPermissions(),
        ]);

        const isSmsGranted = smsPermission.sms === 'granted';
        const isNotificationGranted = notificationPermission.display === 'granted';

        alert(
          isSmsGranted && isNotificationGranted
            ? (lang === 'ar' ? 'تم تفعيل قراءة الرسائل والإشعارات على أندرويد.' : 'SMS reading and notifications are enabled on Android.')
            : (lang === 'ar' ? 'يجب السماح بالرسائل والإشعارات ليعمل الاستقبال التلقائي.' : 'Allow both SMS and notifications for auto-receive to work.')
        );
        return;
      } catch (error) {
        console.error('Failed to request SMS permissions', error);
      }
    }

    if ((window as any).AndroidBridge && (window as any).AndroidBridge.requestSmsPermission) {
      (window as any).AndroidBridge.requestSmsPermission();
      return;
    }

    alert(lang === 'ar' ? 'هذه الميزة تتطلب نسخة Android Capacitor.' : 'This feature requires the Android Capacitor build.');
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (showSmsParser) {
        setShowSmsParser(false);
        return;
      }

      if (showAboutModal) {
        setShowAboutModal(false);
        return;
      }

      if (showResetConfirm) {
        setShowResetConfirm(false);
        return;
      }

      if (showAddGam3eyaModal) {
        setShowAddGam3eyaModal(false);
        return;
      }

      if (showAddModal) {
        closeAddModal();
        return;
      }

      if (showAnalyticsModal) {
        setShowAnalyticsModal(false);
        return;
      }

      if (showWalletManager) {
        setShowWalletManager(false);
        setEditingWalletId(null);
        return;
      }

      if (showSettingsModal) {
        closeSettingsPanel();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [
    showSmsParser,
    showAboutModal,
    showResetConfirm,
    showAddGam3eyaModal,
    showAddModal,
    showAnalyticsModal,
    showWalletManager,
    showSettingsModal,
  ]);

  // --- Splash Screen ---
  if (isSplashVisible) {
    return (
      <motion.div 
        initial={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={`absolute inset-0 z-[100] flex flex-col items-center justify-center ${currentTheme.bg}`}
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
              <AppLogo size={72} />
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

  // --- Onboarding Screen ---
  if (!hasSeenOnboarding) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`absolute inset-0 z-[100] flex flex-col items-center justify-center p-6 ${currentTheme.bg}`} style={{ backgroundImage: currentTheme.gradient }}>
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
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                      {lang === 'ar' ? 'PIN Ø§Ø®ØªÙŠØ§Ø±ÙŠ' : 'Optional PIN'}
                    </label>
                    <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold">
                      {[4, 6].map((lengthOption) => (
                        <button
                          key={lengthOption}
                          type="button"
                          onClick={() => setSetupPinLength(lengthOption as PinLength)}
                          className={`min-h-9 min-w-11 rounded-full px-3 transition-colors ${setupPinLength === lengthOption ? 'bg-accent-primary text-text-on-accent' : 'text-text-secondary'}`}
                        >
                          {lengthOption}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <Lock className="absolute inset-y-0 start-4 my-auto w-5 h-5 text-slate-500" />
                    <input 
                      type="password"
                      inputMode="numeric"
                      maxLength={setupPinLength}
                      value={setupPinValue}
                      onChange={(e) => setSetupPinValue(e.target.value.replace(/\D/g, '').slice(0, setupPinLength))}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 ps-12 pe-4 tracking-[0.5em] focus:outline-none focus:border-sky-500/50 ${currentTheme.text || 'text-white'}`}
                      placeholder={setupPinLength === 6 ? '000000' : t.setupPinPlaceholder}
                    />
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    {lang === 'ar'
                      ? 'Ø¥Ø°Ø§ Ø£Ø¶ÙØª PIN Ø³ØªØ­ØªØ§Ø¬ Ø£ÙŠØ¶Ù‹Ø§ Ø¥Ù„Ù‰ Ø³Ø¤Ø§Ù„ Ø£Ù…Ø§Ù† Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„ÙˆØµÙˆÙ„.'
                      : 'If you add a PIN, a backup security question is required for recovery.'}
                  </p>
                </div>

                {setupPinValue && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                        {lang === 'ar' ? 'Ø³Ø¤Ø§Ù„ Ø§Ù„Ø£Ù…Ø§Ù†' : 'Security question'}
                      </label>
                      <select
                        value={setupSecurityQuestionId}
                        onChange={(e) => setSetupSecurityQuestionId(e.target.value)}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-sky-500/50 appearance-none ${currentTheme.text || 'text-white'}`}
                      >
                        {SECURITY_QUESTION_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id} className="bg-slate-900">
                            {option.label[lang]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                        {lang === 'ar' ? 'Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©' : 'Backup answer'}
                      </label>
                      <input
                        type="text"
                        value={setupSecurityAnswer}
                        onChange={(e) => setSetupSecurityAnswer(e.target.value)}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-sky-500/50 ${currentTheme.text || 'text-white'}`}
                        placeholder={lang === 'ar' ? 'Ø£Ø¯Ø®Ù„ Ø¥Ø¬Ø§Ø¨Ø© ØªØªØ°ÙƒØ±Ù‡Ø§ Ù„Ø§Ø­Ù‚Ù‹Ø§' : 'Enter an answer you can remember later'}
                      />
                    </div>
                  </>
                )}

                {setupError && (
                  <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {setupError}
                  </p>
                )}

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
      className={`app-container selection:bg-sky-500/30 selection:text-sky-100 transition-colors duration-500 font-sans ${currentTheme.bg} ${currentTheme.text || 'text-slate-50'}`}
      style={{ backgroundImage: currentTheme.gradient }}
    >
      <AnimatePresence>
        {smsAlert && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute inset-x-0 top-0 z-[65] px-4"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
            }}
          >
            <div className={`mx-auto flex max-w-[390px] items-start gap-3 rounded-[1.5rem] border px-4 py-4 shadow-2xl backdrop-blur-xl ${getSmsAlertAccent(smsAlert.status)}`}>
              <div className="mt-0.5 shrink-0">{getSmsAlertIcon(smsAlert.status)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary">
                  {smsAlert.notificationTitle}
                </p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  {smsAlert.amount > 0 ? formatCurrency(smsAlert.amount, currency, lang, false) : (lang === 'ar' ? 'مبلغ غير واضح' : 'Amount unclear')}
                  {' • '}
                  {getSmsStatusLabel(smsAlert.status, lang)}
                  {' • '}
                  {getSmsReasonLabel(smsAlert.reason, lang)}
                </p>
                <p className="mt-1 truncate text-xs text-text-secondary">{smsAlert.sender}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSmsParser(true);
                      setSmsAlert(null);
                    }}
                    className="min-h-11 rounded-full bg-white/10 px-4 text-xs font-bold text-text-primary"
                  >
                    {lang === 'ar' ? 'مراجعة الرسالة' : 'Review SMS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsAlert(null)}
                    className="min-h-11 text-xs font-semibold text-text-secondary"
                  >
                    {lang === 'ar' ? 'إخفاء' : 'Dismiss'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`mobile-main transition-[filter,transform,opacity] duration-300 ${isLocked ? 'pointer-events-none scale-[0.985] blur-sm' : ''}`}>
      {activeTab === 'home' && (
      <header className="mb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg">
              <AppLogo size={30} />
            </div>
            <div className="space-y-1">
              <p className="text-[0.75rem] leading-5 text-text-secondary">{t.tagline}</p>
              <h1 className={`text-[1.75rem] font-extrabold leading-none tracking-tight ${currentTheme.text || 'text-slate-50'}`}>
                {t.hello}, {userName || t.brand}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isDarkMode ? 'Use light theme' : 'Use dark theme'}
              onClick={handleColorModeToggle}
              className="touch-icon-button border border-white/10 bg-white/5 text-slate-300"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              aria-label={isPrivacyMode ? 'Show amounts' : 'Hide amounts'}
              onClick={handleToggleBalance}
              className="touch-icon-button border border-white/10 bg-white/5 text-slate-300"
            >
              {isPrivacyMode ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
            <button
              type="button"
              aria-label={lang === 'ar' ? 'ÙØªØ­ Ø§Ù„ØªØ­Ù„ÙŠÙ„Ø§Øª' : 'Open analytics'}
              onClick={() => setShowAnalyticsModal(true)}
              className="touch-icon-button border border-white/10 bg-white/5 text-slate-300"
            >
              <PieChart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      )}

      <div className="space-y-4 flex min-h-full flex-col">
        {activeTab === 'home' ? (
          <>
            {/* Warnings */}
            <AnimatePresence>
              {isMonthlyLimitExceeded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mobile-card flex items-start gap-3 border border-rose-500/50 bg-rose-500/20 p-4 text-rose-100">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{t.monthlyLimitWarning}</p>
                  </div>
                </motion.div>
              )}
              {isDailyLimitExceeded && !isMonthlyLimitExceeded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mobile-card flex items-start gap-3 border border-orange-500/50 bg-orange-500/20 p-4 text-orange-100">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{t.dailyLimitWarning}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Wallet Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
              className="mobile-card relative overflow-hidden border border-glass-border bg-glass-bg p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
              {fakeBalanceActive && (
                <div className="absolute end-4 top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/12 text-accent-primary">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              )}
              
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <p className="mb-1 text-[0.75rem] font-medium uppercase tracking-[0.24em] text-text-secondary">{t.availableBalance}</p>
                    <SensitiveText className="flex items-baseline gap-2 break-words text-[1.75rem] font-extrabold leading-none tracking-tight text-text-primary">
                      {formatCurrency(displayedDashboardBalance, currency, lang, true)}
                    </SensitiveText>
                  </div>
                  <div className="mobile-card flex items-center justify-between border border-glass-border bg-white/5 p-4 shadow-inner">
                    <div>
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.24em] text-accent-primary">{t.dailyAllowance}</p>
                      <p className="mt-1 text-[0.75rem] text-text-secondary">{lang === 'ar' ? 'Ø§Ù„Ù…ØªØ§Ø­ Ù„Ù„ÙŠÙˆÙ…' : 'Available for today'}</p>
                    </div>
                    <SensitiveText className="text-[1.25rem] font-bold text-text-primary">
                      {formatCurrency(displayedDailyAllowance, currency, lang, true)}
                    </SensitiveText>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-2 border-t border-glass-border pt-4">
                  <div className="mobile-card bg-white/5 p-3">
                    <p className="mb-1 flex items-center gap-1 truncate text-[0.625rem] uppercase text-text-secondary"><ArrowDownRight className="h-3 w-3 shrink-0 text-success"/> <span className="truncate">{t.income}</span></p>
                    <SensitiveText className="block truncate text-[0.875rem] font-bold text-text-primary">{formatCurrency(totalIncome, currency, lang, false)}</SensitiveText>
                  </div>
                  <div className="mobile-card bg-white/5 p-3">
                    <p className="mb-1 flex items-center gap-1 truncate text-[0.625rem] uppercase text-text-secondary"><ArrowUpRight className="h-3 w-3 shrink-0 text-danger"/> <span className="truncate">{t.expense}</span></p>
                    <SensitiveText className="block truncate text-[0.875rem] font-bold text-text-primary">{formatCurrency(totalExpenses, currency, lang, false)}</SensitiveText>
                  </div>
                  <div className="mobile-card bg-white/5 p-3">
                    <p className="mb-1 flex items-center gap-1 truncate text-[0.625rem] uppercase text-text-secondary"><RefreshCw className="h-3 w-3 shrink-0 text-warning"/> <span className="truncate">{t.debt}</span></p>
                    <SensitiveText className="block truncate text-[0.875rem] font-bold text-text-primary">{formatCurrency(totalDebts, currency, lang, false)}</SensitiveText>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Transactions List */}
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[0.75rem] text-text-secondary">{lang === 'ar' ? 'Ø¢Ø®Ø± Ù…Ø§ ØªÙ… ØªØ³Ø¬ÙŠÙ„Ù‡' : 'Latest activity'}</p>
                  <h2 className={`text-[1.25rem] font-bold ${currentTheme.text || 'text-slate-50'}`}>{t.recentTransactions}</h2>
                </div>
                {transactions.length > 1 && (
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`min-h-11 rounded-full border border-white/10 bg-white/5 px-4 text-[0.75rem] font-medium ${currentTheme.text || 'text-slate-300'}`}
                  >
                    {lang === 'ar' ? 'Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙ„' : 'Show All'}
                  </button>
                )}
              </div>

              {transactions.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mobile-card flex h-56 flex-col items-center justify-center gap-4 border border-white/5 bg-white/[0.02] p-8 text-center text-slate-500">
                  <Activity className="h-10 w-10 opacity-30" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t.noTransactions}</p>
                    <p className="text-xs text-text-secondary">{lang === 'ar' ? 'Ø§Ø¨Ø¯Ø£ Ø¨Ø¥Ø¶Ø§ÙØ© Ø£ÙˆÙ„ Ù…Ø¹Ø§Ù…Ù„Ø©.' : 'Add your first transaction to start tracking.'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddModal()}
                    className={`min-h-11 rounded-full px-5 text-sm font-bold ${currentTheme.btn}`}
                  >
                    {t.addTransaction}
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {groupedTransactions.slice(0, 1).map(([date, txs]) => [date, txs.slice(0, 1)] as [string, Transaction[]]).map(([date, dayTransactions]) => (
                    <div key={date} className="space-y-2">
                      <div className="sticky top-0 z-10 flex justify-center py-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md border ${currentTheme.text ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-slate-900/80 border-white/10 text-slate-400'}`}>
                          {getDateLabel(date)}
                        </span>
                      </div>
                      <div className="mobile-card space-y-1 border border-white/10 bg-white/[0.03] p-2 shadow-sm">
                        {dayTransactions.map((item) => {
                          const wallet = wallets.find(w => w.id === item.walletId);
                          return (
                            <motion.div 
                              layoutId={item.id}
                              key={item.id} 
                              className="mobile-card flex cursor-pointer items-center justify-between p-3" 
                              onClick={() => setActiveTab('transactions')}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${getTypeColor(item.type)}`}>
                                  {getTypeIcon(item.type)}
                                </div>
                                <div className="min-w-0">
                                  <p className={`truncate text-sm font-semibold ${currentTheme.text || 'text-slate-100'}`}>{item.name}</p>
                                  {wallet && (
                                    <div className={`mt-0.5 flex items-center gap-1 text-[0.75rem] ${currentTheme.text ? 'text-slate-500' : 'text-slate-500'}`}>
                                      {WALLET_ICONS[wallet.icon] || WALLET_ICONS['wallet']}
                                      <span className="truncate">{wallet.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-end shrink-0 ms-2">
                                <SensitiveText mask="***" className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-400' : (currentTheme.text || 'text-slate-100')}`}>
                                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency, lang, false)}
                                </SensitiveText>
                                <p className={`mt-0.5 text-[0.625rem] uppercase ${currentTheme.text ? 'text-slate-500' : 'text-slate-500'}`}>{t[item.type]}</p>
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
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <h2 className={`text-2xl font-bold ${currentTheme.text || 'text-slate-50'}`}>{lang === 'ar' ? 'Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø§Øª' : 'All Transactions'}</h2>
            </div>
            {transactions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mobile-card flex h-56 flex-col items-center justify-center gap-4 border border-white/5 bg-white/[0.02] p-8 text-center text-slate-500">
                <Activity className="h-10 w-10 opacity-30" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t.noTransactions}</p>
                  <p className="text-xs text-text-secondary">{lang === 'ar' ? 'Ø£Ø¶Ù Ø£ÙˆÙ„ Ù…Ø¹Ø§Ù…Ù„Ø© Ù…Ù† Ø²Ø± Ø§Ù„Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø³ÙÙ„ÙŠ.' : 'Use the center add button to create your first transaction.'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal()}
                  className={`min-h-11 rounded-full px-5 text-sm font-bold ${currentTheme.btn}`}
                >
                  {t.addTransaction}
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {groupedTransactions.map(([date, dayTransactions]) => (
                  <div key={date} className="space-y-2">
                    <div className="sticky top-0 z-10 flex justify-center py-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md border ${currentTheme.text ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-slate-900/80 border-white/10 text-slate-400'}`}>
                        {getDateLabel(date)}
                      </span>
                    </div>
                    <div className="mobile-card space-y-1 border border-white/10 bg-white/[0.03] p-2 shadow-sm">
                      {dayTransactions.map((item) => {
                        const wallet = wallets.find(w => w.id === item.walletId);
                        return (
                          <motion.div 
                            layoutId={item.id}
                            key={item.id} 
                            className="mobile-card flex cursor-pointer items-center justify-between p-3" 
                            onClick={() => openEditModal(item)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${getTypeColor(item.type)}`}>
                                {getTypeIcon(item.type)}
                              </div>
                              <div className="min-w-0">
                                <p className={`truncate text-sm font-semibold ${currentTheme.text || 'text-slate-100'}`}>{item.name}</p>
                                {wallet && (
                                  <div className={`mt-0.5 flex items-center gap-1 text-[0.75rem] ${currentTheme.text ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {WALLET_ICONS[wallet.icon] || WALLET_ICONS['wallet']}
                                    <span className="truncate">{wallet.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-end shrink-0 ms-2">
                              <SensitiveText mask="***" className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-400' : (currentTheme.text || 'text-slate-100')}`}>
                                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency, lang, false)}
                              </SensitiveText>
                              <p className={`mt-0.5 text-[0.625rem] uppercase ${currentTheme.text ? 'text-slate-500' : 'text-slate-500'}`}>{t[item.type]}</p>
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
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Primary">
        <div className="bottom-nav-inner mobile-card border border-white/10 bg-white/6 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
          <button 
            onClick={() => setActiveTab('home')}
            className={`bottom-nav-button rounded-2xl px-1 text-[0.625rem] font-bold transition-all ${activeTab === 'home' ? currentTheme.accent : 'text-slate-500'}`}
          >
            <span className={`touch-icon-button rounded-2xl transition-all ${activeTab === 'home' ? 'bg-white/10' : 'bg-transparent'}`}>
              <Home className="w-5 h-5" />
            </span>
            <span className="truncate">{t.home}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`bottom-nav-button rounded-2xl px-1 text-[0.625rem] font-bold transition-all ${activeTab === 'transactions' ? currentTheme.accent : 'text-slate-500'}`}
          >
            <span className={`touch-icon-button rounded-2xl transition-all ${activeTab === 'transactions' ? 'bg-white/10' : 'bg-transparent'}`}>
              <Activity className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold">{lang === 'ar' ? 'Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø§Øª' : 'Transactions'}</span>
          </button>

          <div className="fab-slot">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => openAddModal()}
              aria-label={t.addTransaction}
              className={`fab-button flex items-center justify-center text-white shadow-2xl ring-4 ring-slate-950/60 ${currentTheme.btn}`}
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>

          <button 
            onClick={() => setActiveTab('gam3eya')}
            className={`bottom-nav-button rounded-2xl px-1 text-[0.625rem] font-bold transition-all ${activeTab === 'gam3eya' ? currentTheme.accent : 'text-slate-500'}`}
          >
            <span className={`touch-icon-button rounded-2xl transition-all ${activeTab === 'gam3eya' ? 'bg-white/10' : 'bg-transparent'}`}>
              <Users className="w-5 h-5" />
            </span>
            <span className="truncate">{t.gam3eya}</span>
          </button>

          <button 
            onClick={() => {
              setShowWalletManager(false);
              setEditingWalletId(null);
              setShowSettingsModal(true);
            }}
            className={`bottom-nav-button rounded-2xl px-1 text-[0.625rem] font-bold transition-all ${showSettingsModal ? currentTheme.accent : 'text-slate-500'}`}
          >
            <span className={`touch-icon-button rounded-2xl transition-all ${showSettingsModal ? 'bg-white/10' : 'bg-transparent'}`}>
              <Settings className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold">{lang === 'ar' ? 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª' : 'Settings'}</span>
          </button>
        </div>
      </nav>
      </div>

      {/* Add Gam3eya Modal */}
      <AnimatePresence>
        {showAddGam3eyaModal && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="mobile-subpage z-[60]"
          >
            <div className="mobile-subpage-header">
              <button
                type="button"
                aria-label={t.cancel}
                onClick={() => setShowAddGam3eyaModal(false)}
                className="touch-icon-button border border-glass-border bg-bg-tertiary text-text-secondary"
              >
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              </button>
              <div className="min-w-0">
                <p className="text-[0.75rem] text-text-secondary">{t.gam3eya}</p>
                <h3 className="truncate text-[1.25rem] font-bold text-text-primary">{t.addGam3eya}</h3>
              </div>
            </div>

            <div className="mobile-subpage-body">
              <form onSubmit={handleSaveGam3eya} className="space-y-5">
                <div>
                  <label className={`text-xs font-medium uppercase tracking-wider mb-2 block text-text-secondary`}>{t.name}</label>
                  <input
                    type="text" required value={gam3eyaFormData.name || ''} onChange={(e) => setGam3eyaFormData({ ...gam3eyaFormData, name: e.target.value })}
                    placeholder="e.g. Family Pool"
                    className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 text-start transition-colors text-text-primary`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wider mb-2 block text-text-secondary`}>{t.monthlyAmount}</label>
                    <input
                      type="number" required min="1" value={gam3eyaFormData.monthlyAmount || ''} onChange={(e) => setGam3eyaFormData({ ...gam3eyaFormData, monthlyAmount: Number(e.target.value) })}
                      className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 text-start transition-colors text-text-primary`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wider mb-2 block text-text-secondary`}>Total Months</label>
                    <input
                      type="number" required min="2" max="24" value={gam3eyaFormData.totalMonths || ''} onChange={(e) => setGam3eyaFormData({ ...gam3eyaFormData, totalMonths: Number(e.target.value) })}
                      className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 text-start transition-colors text-text-primary`}
                    />
                  </div>
                </div>

                <button type="submit" className={`w-full py-4 rounded-2xl font-bold bg-accent-primary text-text-on-accent transition-opacity hover:opacity-90 mt-4`}>
                  {t.save}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="mobile-subpage"
          >
            <div className="mobile-subpage-header">
              <button
                type="button"
                aria-label={t.cancel}
                onClick={closeAddModal}
                className="touch-icon-button border border-glass-border bg-bg-tertiary text-text-secondary"
              >
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[0.75rem] text-text-secondary">{editingId ? t.edit : t.addTransaction}</p>
                <h3 className="truncate text-[1.25rem] font-bold text-text-primary">
                  {editingId ? t.edit : t.addTransaction}
                </h3>
              </div>
              {!editingId && (
                <button
                  type="button"
                  onClick={() => setShowSmsParser(true)}
                  className="relative flex min-h-11 items-center gap-2 rounded-full border border-glass-border bg-bg-tertiary px-4 text-[0.75rem] font-bold text-accent-primary"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{t.smartPaste}</span>
                  <span className="absolute -top-2 -right-1 rounded-full bg-danger px-1.5 py-0.5 text-[0.5rem] font-bold text-white">BETA</span>
                </button>
              )}
            </div>

            <div className="mobile-subpage-body">
              <form onSubmit={handleSaveTransaction} className="space-y-5">
                {/* Type Selector */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-bg-tertiary rounded-2xl border border-glass-border">
                  {(['income', 'expense', 'debt'] as TransactionType[]).map((type) => (
                    <button
                      key={type} type="button" onClick={() => setFormData({ ...formData, type })}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        formData.type === type 
                          ? 'bg-accent-primary text-text-on-accent shadow-md' 
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t[type]}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div>
                  <label className={`text-xs font-medium uppercase tracking-wider mb-2 block text-text-secondary`}>{t.amount}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-text-secondary text-lg">
                      {currentCurrencySymbol}
                    </span>
                    <input
                      type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      placeholder="0.00" min="0" step="0.01" autoFocus
                      className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl py-4 ps-12 pe-4 text-2xl font-bold focus:outline-none focus:border-accent-primary/50 text-start transition-colors text-text-primary`}
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className={`text-xs font-medium uppercase tracking-wider mb-2 block text-text-secondary`}>{t.name}</label>
                  <input
                    type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Salary, Groceries..."
                    className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 text-start transition-colors text-text-primary`}
                  />
                </div>

                {/* Wallet & Date Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wider mb-2 block text-text-secondary`}>{t.wallet}</label>
                    <div className="relative">
                      <select
                        value={formData.walletId || ''} onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                        className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 text-start transition-colors appearance-none text-text-primary`}
                      >
                        {wallets.map(w => <option key={w.id} value={w.id} className="bg-[#0f172a] text-white">{w.name}</option>)}
                      </select>
                      <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-medium uppercase tracking-wider mb-2 block text-text-secondary`}>{t.date}</label>
                    <input
                      type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 text-start transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 text-text-primary`}
                    />
                  </div>
                </div>

                {/* Recurring Options */}
                <div>
                  <label className={`text-xs font-medium uppercase tracking-wider mb-2 block text-text-secondary`}>{lang === 'ar' ? 'ØªÙƒØ±Ø§Ø±' : 'Recurring'}</label>
                  <div className="relative">
                    <select
                      value={formData.recurring || 'none'} onChange={(e) => setFormData({ ...formData, recurring: e.target.value as any })}
                      className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 text-start transition-colors appearance-none text-text-primary`}
                    >
                      <option value="none" className="bg-[#0f172a] text-white">{lang === 'ar' ? 'Ù„Ø§ ÙŠØªÙƒØ±Ø±' : 'None'}</option>
                      <option value="daily" className="bg-[#0f172a] text-white">{lang === 'ar' ? 'ÙŠÙˆÙ…ÙŠØ§Ù‹' : 'Daily'}</option>
                      <option value="weekly" className="bg-[#0f172a] text-white">{lang === 'ar' ? 'Ø£Ø³Ø¨ÙˆØ¹ÙŠØ§Ù‹' : 'Weekly'}</option>
                      <option value="monthly" className="bg-[#0f172a] text-white">{lang === 'ar' ? 'Ø´Ù‡Ø±ÙŠØ§Ù‹' : 'Monthly'}</option>
                    </select>
                    <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none text-text-secondary">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                  {formData.recurring && formData.recurring !== 'none' && (
                    <p className={`text-xs mt-2 text-accent-primary`}>
                      {lang === 'ar' ? 'Ø³ÙˆÙ ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¹Ø¯' : 'Transaction will be automatically generated.'}
                    </p>
                  )}
                </div>

                {formError && <div className="text-danger text-sm bg-danger/10 p-3 rounded-xl border border-danger/20">{formError}</div>}

                <div className="flex gap-3 pt-2 pb-6 sm:pb-0">
                  {editingId && (
                    <button
                      type="button" onClick={() => { if (handleDelete(editingId)) closeAddModal(); }}
                      className="p-4 rounded-2xl bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-colors"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                  <button type="submit" className={`flex-1 text-text-on-accent bg-accent-primary rounded-2xl font-bold text-lg py-4 transition-colors hover:opacity-90 shadow-lg`}>
                    {t.save}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-glass-bg border border-glass-border rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center backdrop-blur-xl`}>
              <div className="w-16 h-16 mx-auto bg-danger/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-danger" />
              </div>
              <h3 className={`text-xl font-bold mb-2 text-text-primary`}>
                {lang === 'ar' ? 'Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªØŸ' : 'Reset All Data?'}
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                {lang === 'ar' 
                  ? 'Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ø³ÙŠÙ‚ÙˆÙ… Ø¨Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø§Øª ÙˆØ§Ù„Ù…Ø­Ø§ÙØ¸ ÙˆØ§Ù„Ø¬Ù…Ø¹ÙŠØ§Øª Ø§Ù„Ù…ØªØ¹Ù„Ù‚Ø© Ø¨Ùƒ. Ù„Ù† ØªØªÙ…ÙƒÙ† Ù…Ù† Ø§Ù„ØªØ±Ø§Ø¬Ø¹ Ø¹Ù† Ù‡Ø°Ø§.' 
                  : 'This action will permanently delete all your transactions, wallets, and gam3eyat. This cannot be undone.'}
              </p>
              
              <div className="flex gap-3">
                <button onClick={() => setShowResetConfirm(false)} className={`flex-1 py-3 rounded-xl font-bold text-text-primary bg-bg-tertiary hover:opacity-80 border border-glass-border transition-colors`}>
                  {t.cancel}
                </button>
                <button onClick={handleReset} className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors bg-danger hover:opacity-90`}>
                  {lang === 'ar' ? 'Ù†Ø¹Ù…ØŒ Ø­Ø°Ù' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SMS Parser Modal */}
      <AnimatePresence>
        {showSmsParser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-glass-bg border border-glass-border rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden backdrop-blur-xl`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 text-text-primary`}>
                  <MessageSquare className={`w-6 h-6 text-accent-primary`} />
                  {t.smartPaste}
                </h3>
                <button onClick={() => setShowSmsParser(false)} className="text-text-secondary hover:text-text-primary bg-bg-tertiary p-2 rounded-full border border-glass-border">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-xl p-3 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {lang === 'ar' 
                      ? 'داخل نسخة Android الأصلية يستطيع التطبيق استقبال الرسائل تلقائيًا بعد منح الصلاحية. داخل المتصفح استخدم اللصق اليدوي أو القراءة من الحافظة.' 
                      : 'In the native Android build the app can receive SMS automatically after permission is granted. In the browser, use manual paste or the clipboard button.'}
                  </p>
                </div>
                
                <button 
                  onClick={requestSmsPermission}
                  className="w-full py-3 rounded-xl bg-success/10 hover:bg-success/20 border border-success/20 text-success transition-colors text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  {lang === 'ar' ? 'ØªÙØ¹ÙŠÙ„ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ© (Ø£Ù†Ø¯Ø±ÙˆÙŠØ¯ ÙÙ‚Ø·)' : 'Enable Auto-Read (Android Only)'}
                </button>

                <div className="relative space-y-3">
                  {/* Mock sender input for web testing */}
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'Ø§Ø³Ù… Ø§Ù„Ù…Ø±Ø³Ù„ (Sender ID)' : 'Sender ID'}
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    className={`w-full bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 transition-colors text-text-primary`}
                  />
                  <textarea
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    placeholder={t.pasteSmsHere}
                    className={`w-full h-32 bg-bg-tertiary border border-glass-border rounded-2xl p-4 focus:outline-none focus:border-accent-primary/50 resize-none text-text-primary`}
                  />
                  <button 
                    onClick={handlePasteFromClipboard}
                    className="absolute bottom-3 right-3 p-2 bg-glass-bg border border-glass-border hover:bg-bg-tertiary rounded-xl text-text-primary transition-colors flex items-center gap-2 text-xs font-medium backdrop-blur-md"
                  >
                    <Upload className="w-4 h-4" />
                    {lang === 'ar' ? 'Ù„ØµÙ‚ Ù…Ù† Ø§Ù„Ø­Ø§ÙØ¸Ø©' : 'Paste from Clipboard'}
                  </button>
                </div>
                <button 
                  onClick={handleParseSms}
                  disabled={!smsText.trim()}
                  className={`w-full py-4 rounded-2xl font-bold text-text-on-accent bg-accent-primary transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center`}>
              <button onClick={() => setShowAboutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 bg-white/5 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <AppLogo size={56} />
              </div>
              
              <h2 className={`text-2xl font-bold mb-1 ${currentTheme.text || 'text-white'}`}>{t.brand}</h2>
              <p className="text-sky-400 text-sm font-bold mb-6">Version 1.0.0</p>
              
              <div className="space-y-4 text-sm text-start">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-slate-400 text-xs mb-1">{lang === 'ar' ? 'Ø§Ù„Ù…Ø·ÙˆØ±' : 'Developer'}</p>
                  <p className={`font-bold ${currentTheme.text || 'text-white'}`}>{lang === 'ar' ? 'Ø²ÙŠØ§Ø¯ ÙŠØ­ÙŠ Ø²ÙƒØ±ÙŠØ§ Ø§Ø­Ù…Ø¯' : 'Ziad Yehia Zakaria Ahmed'}</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">{lang === 'ar' ? 'Ø§Ù„Ù‡Ø§ØªÙ' : 'Phone'}</span>
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
                Â© {new Date().getFullYear()} {t.brand}. {lang === 'ar' ? 'Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ‚ Ù…Ø­ÙÙˆØ¸Ø©.' : 'All rights reserved.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mobile-subpage z-50"
            style={{ backgroundImage: currentTheme.gradient }}
          >
            <div className="flex-1 overflow-y-auto">
              
              <AnimatePresence mode="wait">
                {!showWalletManager ? (
                  <motion.div key="main-settings" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                    <div className="mobile-subpage-header">
                      <button onClick={closeSettingsPanel} className="touch-icon-button border border-glass-border bg-bg-tertiary text-text-secondary">
                        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-[0.75rem] text-text-secondary">{t.security}</p>
                        <h3 className="truncate text-[1.25rem] font-bold text-text-primary">{t.settings}</h3>
                      </div>
                    </div>

                    <div className="mobile-subpage-body pt-2 space-y-6">

                    {/* Security & Profile Entry */}
                    <div className="space-y-2">
                      <label className={`text-sm font-medium flex items-center gap-2 text-text-secondary`}><ShieldCheck className="w-4 h-4"/> {t.security}</label>
                      <form onSubmit={handleSaveSecuritySettings} className="bg-bg-tertiary border border-glass-border rounded-2xl p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {pinEnabled
                                ? (lang === 'ar' ? `Ù‚ÙÙ„ PIN Ù…ÙØ¹Ù„ (${pinLength} Ø£Ø±Ù‚Ø§Ù…)` : `PIN lock enabled (${pinLength} digits)`)
                                : (lang === 'ar' ? 'Ù‚ÙÙ„ PIN ØºÙŠØ± Ù…ÙØ¹Ù„' : 'PIN lock is off')}
                            </p>
                            <p className="mt-1 text-[0.75rem] text-text-secondary">
                              {lang === 'ar'
                                ? 'Ø§Ù„Ù‚ÙÙ„ ÙŠØ¸Ù‡Ø± Ù…Ø¨Ø§Ø´Ø±Ø© Ø¹Ù†Ø¯ ÙØªØ­ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø£Ùˆ Ø¹Ù†Ø¯ Ø¹ÙˆØ¯ØªÙ‡ Ù…Ù† Ø§Ù„Ø®Ù„ÙÙŠØ©.'
                                : 'The app locks on open, on backgrounding, and after inactivity.'}
                            </p>
                          </div>
                          {pinEnabled && (
                            <button
                              type="button"
                              onClick={handleDisablePin}
                              className="min-h-11 rounded-full border border-danger/25 bg-danger/10 px-4 text-[0.75rem] font-bold text-danger"
                            >
                              {lang === 'ar' ? 'ØªØ¹Ø·ÙŠÙ„' : 'Disable'}
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                            {lang === 'ar' ? 'Ø·ÙˆÙ„ Ø±Ù…Ø² PIN' : 'PIN length'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[4, 6].map((lengthOption) => (
                              <button
                                key={lengthOption}
                                type="button"
                                onClick={() => setSettingsPinLengthDraft(lengthOption as PinLength)}
                                className={`min-h-11 rounded-2xl border text-sm font-semibold transition-colors ${settingsPinLengthDraft === lengthOption ? 'border-accent-primary/50 bg-accent-primary/15 text-accent-primary' : 'border-glass-border bg-white/5 text-text-secondary'}`}
                              >
                                {lengthOption} {lang === 'ar' ? 'Ø£Ø±Ù‚Ø§Ù…' : 'digits'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                              {pinEnabled ? (lang === 'ar' ? 'PIN Ø¬Ø¯ÙŠØ¯' : 'New PIN') : (lang === 'ar' ? 'ØªÙØ¹ÙŠÙ„ PIN' : 'Enable PIN')}
                            </label>
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={settingsPinLengthDraft}
                              value={settingsPinDraft}
                              onChange={(e) => setSettingsPinDraft(e.target.value.replace(/\D/g, '').slice(0, settingsPinLengthDraft))}
                              className="w-full rounded-2xl border border-glass-border bg-white/5 px-4 py-4 tracking-[0.4em] text-text-primary focus:border-accent-primary/50 focus:outline-none"
                              placeholder={settingsPinLengthDraft === 6 ? '000000' : '0000'}
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                              {lang === 'ar' ? 'ØªØ£ÙƒÙŠØ¯ PIN' : 'Confirm PIN'}
                            </label>
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={settingsPinLengthDraft}
                              value={settingsPinConfirmDraft}
                              onChange={(e) => setSettingsPinConfirmDraft(e.target.value.replace(/\D/g, '').slice(0, settingsPinLengthDraft))}
                              className="w-full rounded-2xl border border-glass-border bg-white/5 px-4 py-4 tracking-[0.4em] text-text-primary focus:border-accent-primary/50 focus:outline-none"
                              placeholder={settingsPinLengthDraft === 6 ? '000000' : '0000'}
                            />
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-glass-border pt-4">
                          <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                              {lang === 'ar' ? 'Ø³Ø¤Ø§Ù„ Ø§Ù„Ø£Ù…Ø§Ù†' : 'Security question'}
                            </label>
                            <select
                              value={settingsSecurityQuestionId}
                              onChange={(e) => setSettingsSecurityQuestionId(e.target.value)}
                              className="w-full rounded-2xl border border-glass-border bg-white/5 px-4 py-4 text-sm text-text-primary focus:border-accent-primary/50 focus:outline-none"
                            >
                              {SECURITY_QUESTION_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label[lang]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                              {lang === 'ar' ? 'Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø©' : 'Recovery answer'}
                            </label>
                            <input
                              type="text"
                              value={settingsSecurityAnswer}
                              onChange={(e) => setSettingsSecurityAnswer(e.target.value)}
                              className="w-full rounded-2xl border border-glass-border bg-white/5 px-4 py-4 text-text-primary focus:border-accent-primary/50 focus:outline-none"
                              placeholder={securityAnswerHash ? (lang === 'ar' ? 'Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºÙ‹Ø§ Ù„Ù„Ø§Ø­ØªÙØ§Ø¸ Ø¨Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©' : 'Leave blank to keep the current answer') : (lang === 'ar' ? 'Ø¥Ø¬Ø§Ø¨Ø© Ù…Ø·Ù„ÙˆØ¨Ø© Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹ PIN' : 'Required for PIN recovery')}
                            />
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-glass-border pt-4">
                          <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                              {lang === 'ar' ? 'Ø§Ù„Ù‚ÙÙ„ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ' : 'Auto-lock'}
                            </label>
                            <select
                              value={autoLockPreference}
                              onChange={(e) => setAutoLockPreference(e.target.value as AutoLockSetting)}
                              className="w-full rounded-2xl border border-glass-border bg-white/5 px-4 py-4 text-sm text-text-primary focus:border-accent-primary/50 focus:outline-none"
                            >
                              <option value="1">{lang === 'ar' ? 'Ø¯Ù‚ÙŠÙ‚Ø© ÙˆØ§Ø­Ø¯Ø©' : '1 minute'}</option>
                              <option value="5">{lang === 'ar' ? '5 Ø¯Ù‚Ø§Ø¦Ù‚' : '5 minutes'}</option>
                              <option value="10">{lang === 'ar' ? '10 Ø¯Ù‚Ø§Ø¦Ù‚' : '10 minutes'}</option>
                              <option value="30">{lang === 'ar' ? '30 Ø¯Ù‚ÙŠÙ‚Ø©' : '30 minutes'}</option>
                              <option value="never">{lang === 'ar' ? 'Ø£Ø¨Ø¯Ù‹Ø§' : 'Never'}</option>
                            </select>
                          </div>

                          {biometricSupported && pinEnabled && (
                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-glass-border bg-white/5 px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-text-primary">{t.biometricAuth}</p>
                                <p className="text-[0.75rem] text-text-secondary">
                                  {biometricCredentialId
                                    ? (useBiometrics ? (lang === 'ar' ? 'Ø§Ù„Ø¨ØµÙ…Ø© Ù…ÙØ¹Ù„Ø© Ø¹Ù„Ù‰ Ø´Ø§Ø´Ø© Ø§Ù„Ù‚ÙÙ„.' : 'Biometric unlock is enabled on the lock screen.') : (lang === 'ar' ? 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø© Ù„ÙƒÙ†Ù‘Ù‡Ø§ ØºÙŠØ± Ù…ÙØ¹Ù„Ø©.' : 'Biometric is registered but currently disabled.'))
                                    : (lang === 'ar' ? 'Ø³Ø¬Ù‘Ù„ Ø¨ØµÙ…Ø©/ÙˆØ¬Ù‡ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø².' : 'Register this device for fingerprint / face unlock.')}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleToggleBiometric}
                                disabled={biometricBusy}
                                className={`min-h-11 rounded-full px-4 text-sm font-bold ${biometricBusy ? 'bg-white/10 text-text-secondary' : currentTheme.btn}`}
                              >
                                {biometricBusy
                                  ? (lang === 'ar' ? 'Ø¬Ø§Ø±Ù...' : 'Working...')
                                  : useBiometrics
                                    ? (lang === 'ar' ? 'Ø¥ÙŠÙ‚Ø§Ù' : 'Disable')
                                    : biometricCredentialId
                                      ? (lang === 'ar' ? 'ØªÙØ¹ÙŠÙ„' : 'Enable')
                                      : (lang === 'ar' ? 'ØªØ³Ø¬ÙŠÙ„' : 'Register')}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 border-t border-glass-border pt-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <span className={`text-sm block text-text-primary`}>{t.fakeBalance}</span>
                              <span className="text-[10px] text-text-secondary">{t.fakeBalanceDesc}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFakeBalanceMode((current) => !current)}
                              className={`relative h-6 w-12 rounded-full transition-colors ${fakeBalanceMode ? 'bg-accent-primary' : 'bg-text-secondary'}`}
                            >
                              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${fakeBalanceMode ? 'start-7' : 'start-1'}`}></div>
                            </button>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fakeBalanceInput}
                            onChange={(e) => setFakeBalanceInput(e.target.value)}
                            className="w-full rounded-2xl border border-glass-border bg-white/5 px-4 py-4 text-text-primary focus:border-accent-primary/50 focus:outline-none"
                            placeholder={lang === 'ar' ? 'Ù…Ø«Ø§Ù„: 25000' : 'Example: 25000'}
                          />
                        </div>

                        {settingsSecurityError && (
                          <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                            {settingsSecurityError}
                          </p>
                        )}

                        {settingsSecuritySuccess && (
                          <p className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                            {settingsSecuritySuccess}
                          </p>
                        )}

                        <button type="submit" className={`w-full min-h-11 rounded-2xl text-sm font-bold ${currentTheme.btn}`}>
                          {lang === 'ar' ? 'Ø­ÙØ¸ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø£Ù…Ø§Ù†' : 'Save Security Settings'}
                        </button>
                      </form>
                    </div>

                    {/* Wallets Manager Entry */}
                    <button 
                      onClick={() => setShowWalletManager(true)}
                      className="w-full flex items-center justify-between p-4 bg-bg-tertiary hover:bg-glass-bg border border-glass-border rounded-2xl transition-colors"
                    >
                      <div className={`flex items-center gap-3 text-text-primary`}>
                        <Wallet className={`w-5 h-5 text-accent-primary`} />
                        <span className="font-medium">{t.wallets}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-secondary rtl:rotate-180" />
                    </button>

                    {/* Theme */}
                    <div className="space-y-2">
                      <label className={`text-sm font-medium flex items-center gap-2 text-text-secondary`}><Palette className="w-4 h-4"/> {t.theme}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['midnight', 'frosted', 'sunset', 'emerald', 'girly', 'programmer', 'gamer', 'business'] as Theme[]).map(th => (
                          <button key={th} onClick={() => {
                            setTheme(th);
                            localStorage.setItem('app_theme', `${th}`);
                            document.documentElement.setAttribute('data-theme', th);
                          }} className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors border capitalize ${theme === th ? 'bg-accent-primary/20 border-accent-primary/50 text-accent-primary' : 'bg-bg-tertiary border-glass-border text-text-secondary hover:bg-glass-bg'}`}>
                            {th}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={`text-sm font-medium text-text-secondary`}>{t.language}</label>
                        <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className={`w-full bg-bg-tertiary border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary/50 [&>option]:bg-bg-primary text-text-primary`}>
                          <option value="en">English</option>
                          <option value="ar">Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={`text-sm font-medium text-text-secondary`}>{t.currency}</label>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`w-full bg-bg-tertiary border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary/50 [&>option]:bg-bg-primary text-text-primary`}>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                      </div>
                    </div>

                    <hr className="border-glass-border" />

                    {/* Data Management */}
                    <div className="grid grid-cols-1 gap-3">
                      <button onClick={handleExport} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-bg-tertiary hover:bg-glass-bg border border-glass-border text-text-primary transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" /> {t.exportData}
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-bg-tertiary hover:bg-glass-bg border border-glass-border text-text-primary transition-colors text-sm font-medium">
                        <Upload className="w-4 h-4" /> {t.importData}
                      </button>
                      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <button onClick={() => setShowResetConfirm(true)} className="w-full py-3 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger transition-colors text-sm font-medium flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" /> {t.resetData}
                      </button>
                      <button onClick={() => { setShowSettingsModal(false); setShowAboutModal(true); }} className="w-full py-3 rounded-xl bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/20 text-accent-primary transition-colors text-sm font-medium flex items-center justify-center gap-2">
                        <Info className="w-4 h-4" /> {lang === 'ar' ? 'Ø¹Ù† Ø§Ù„ØªØ·Ø¨ÙŠÙ‚' : 'About App'}
                      </button>
                    </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="wallet-manager" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                    <div className="mobile-subpage-header">
                      <button onClick={() => { setShowWalletManager(false); setEditingWalletId(null); }} className="touch-icon-button border border-glass-border bg-bg-tertiary text-text-secondary">
                        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-[0.75rem] text-text-secondary">{t.settings}</p>
                        <h3 className="truncate text-[1.25rem] font-bold text-text-primary">{t.wallets}</h3>
                      </div>
                    </div>

                    <div className="mobile-subpage-body pt-2 space-y-6">
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pe-2 scrollbar-custom">
                      {wallets.map(w => (
                        <div key={w.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-xl border border-glass-border">
                          <div className={`flex items-center gap-3 text-text-primary`}>
                            <div className="p-2 bg-glass-bg rounded-lg">{WALLET_ICONS[w.icon] || WALLET_ICONS['wallet']}</div>
                            <span className="font-medium">{w.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingWalletId(w.id); setWalletFormData({ name: w.name, icon: w.icon }); }} className="p-2 text-text-secondary hover:text-accent-primary"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteWallet(w.id)} className="p-2 text-text-secondary hover:text-danger"><Trash2 className="w-4 h-4" /></button>
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalyticsModal && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mobile-subpage z-50"
            style={{ backgroundImage: currentTheme.gradient }}
          >
            <div className="mobile-subpage-header">
              <button onClick={() => setShowAnalyticsModal(false)} className="touch-icon-button border border-white/10 bg-white/5 text-slate-300">
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              <div className="min-w-0">
                <p className="text-[0.75rem] text-text-secondary">{lang === 'ar' ? 'Ù…Ù„Ø®Øµ Ø¨ØµØ±ÙŠ Ù„ÙˆØ¶Ø¹Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ' : 'A quick visual snapshot of your budget'}</p>
                <h3 className={`truncate text-[1.25rem] font-bold ${currentTheme.text || 'text-slate-50'}`}>
                  {t.financialBreakdown}
                </h3>
              </div>
            </div>

            <div className="mobile-subpage-body pt-2">
              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.income}</p>
                  <SensitiveText mask="***" className={`text-lg font-bold text-emerald-400 truncate`}>{formatCurrency(totalIncome, currency, lang, false)}</SensitiveText>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.expense}</p>
                  <SensitiveText mask="***" className={`text-lg font-bold text-rose-400 truncate`}>{formatCurrency(totalExpenses, currency, lang, false)}</SensitiveText>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.debt}</p>
                  <SensitiveText mask="***" className={`text-lg font-bold text-purple-400 truncate`}>{formatCurrency(totalDebts, currency, lang, false)}</SensitiveText>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.balance || (lang === 'ar' ? 'Ø§Ù„Ø±ØµÙŠØ¯' : 'Balance')}</p>
                  <SensitiveText mask="***" className={`text-lg font-bold ${remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'} truncate`}>{formatCurrency(remainingBalance, currency, lang, false)}</SensitiveText>
                </div>
              </div>

              {analyticsHasData ? (
              <div className="grid grid-cols-1 gap-4 relative z-10">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <h4 className={`text-sm font-bold mb-4 ${currentTheme.text || 'text-slate-300'}`}>{t.cashFlow}</h4>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashFlowChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => isPrivacyMode ? '***' : String(val)} />
                        <RechartsTooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(value: number) => isPrivacyMode ? '***' : formatCurrency(value, currency, lang)} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col min-h-[280px]">
                  <h4 className={`text-sm font-bold mb-4 ${currentTheme.text || 'text-slate-300'}`}>{t.distribution}</h4>
                  <div className="flex-grow w-full relative min-h-[192px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={distributionChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {distributionChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(value: number) => isPrivacyMode ? '***' : formatCurrency(value, currency, lang)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              ) : (
              <div className="mobile-card flex min-h-[320px] flex-col items-center justify-center gap-4 border border-white/5 bg-white/[0.03] p-8 text-center">
                <PieChart className="h-10 w-10 text-text-secondary/60" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text-primary">{lang === 'ar' ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª ÙƒØ§ÙÙŠØ© Ù„Ù„ØªØ­Ù„ÙŠÙ„' : 'Not enough data for analytics yet'}</p>
                  <p className="text-xs text-text-secondary">{lang === 'ar' ? 'Ø£Ø¶Ù Ø£ÙˆÙ„ Ù…Ø¹Ø§Ù…Ù„Ø© Ù„ÙŠØ¸Ù‡Ø± Ø§Ù„ØªØ¯ÙÙ‚ Ø§Ù„Ù†Ù‚Ø¯ÙŠ ÙˆØ§Ù„ØªÙˆØ²ÙŠØ¹.' : 'Add your first transaction to unlock charts and breakdowns.'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAnalyticsModal(false); openAddModal(); }}
                  className={`min-h-11 rounded-full px-5 text-sm font-bold ${currentTheme.btn}`}
                >
                  {t.addTransaction}
                </button>
              </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLocked && isSetupComplete && hasSeenOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[90] bg-[rgba(5,10,20,0.96)] backdrop-blur-2xl"
          >
            <div
              className="flex h-full flex-col items-center justify-center px-6 text-center"
              style={{
                paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                paddingLeft: 'calc(env(safe-area-inset-left) + 16px)',
                paddingRight: 'calc(env(safe-area-inset-right) + 16px)',
              }}
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 shadow-2xl">
                <AppLogo size={64} />
              </div>
              <h2 className="text-[1.75rem] font-extrabold tracking-tight text-text-primary">{t.brand}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-text-secondary">
                {lockScreenMode === 'pin'
                  ? (lang === 'ar' ? 'Ø£Ø¯Ø®Ù„ Ø±Ù…Ø² PIN Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø©.' : 'Enter your PIN to continue.')
                  : lockScreenMode === 'question'
                    ? (lang === 'ar' ? 'Ø£Ø¬Ø¨ Ø¹Ù† Ø³Ø¤Ø§Ù„ Ø§Ù„Ø£Ù…Ø§Ù† Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„ÙˆØµÙˆÙ„.' : 'Answer your security question to recover access.')
                    : (lang === 'ar' ? 'Ø£Ù†Ø´Ø¦ Ø±Ù…Ø² PIN Ø¬Ø¯ÙŠØ¯Ù‹Ø§ Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø©.' : 'Create a new PIN to continue.')}
              </p>

              {lockScreenMode === 'pin' ? (
                <div className="mt-8 w-full max-w-xs">
                  <div className="mb-5 flex items-center justify-center gap-3">
                    {Array.from({ length: pinLength }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-4 w-4 rounded-full border transition-all ${pinInput.length > index ? 'border-accent-primary bg-accent-primary shadow-[0_0_20px_rgba(59,130,246,0.35)]' : 'border-white/20 bg-white/5'}`}
                      />
                    ))}
                  </div>

                  {pinErrorMessage && (
                    <p className="mb-3 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                      {pinErrorMessage}
                    </p>
                  )}

                  {isPinTemporarilyLocked && (
                    <p className="mb-4 text-sm font-medium text-warning">
                      {lang === 'ar' ? `Ø§Ù„Ù‚ÙÙ„ Ù…Ø¤Ù‚Øª Ù„Ù…Ø¯Ø© ${lockCountdownSeconds}Ø«` : `Locked for ${lockCountdownSeconds}s`}
                    </p>
                  )}

                  <div className="grid grid-cols-3 justify-items-center gap-4">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        disabled={isPinTemporarilyLocked}
                        onClick={() => handlePinDigit(digit)}
                        className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/10 bg-white/6 text-xl font-bold text-text-primary shadow-lg transition-transform active:scale-95 disabled:opacity-40"
                      >
                        {digit}
                      </button>
                    ))}

                    {canUseBiometricsOnLockScreen ? (
                      <button
                        type="button"
                        onClick={() => void handleBiometricAuth()}
                        disabled={biometricBusy}
                        className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-accent-primary/25 bg-accent-primary/12 text-accent-primary shadow-lg transition-transform active:scale-95 disabled:opacity-40"
                        aria-label={t.biometricAuth}
                      >
                        <Fingerprint className="h-7 w-7" />
                      </button>
                    ) : (
                      <div className="h-[4.5rem] w-[4.5rem]" />
                    )}

                    <button
                      type="button"
                      disabled={isPinTemporarilyLocked}
                      onClick={() => handlePinDigit('0')}
                      className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/10 bg-white/6 text-xl font-bold text-text-primary shadow-lg transition-transform active:scale-95 disabled:opacity-40"
                    >
                      0
                    </button>

                    <button
                      type="button"
                      disabled={!pinInput.length}
                      onClick={handlePinBackspace}
                      className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/10 bg-white/6 text-text-primary shadow-lg transition-transform active:scale-95 disabled:opacity-40"
                      aria-label={lang === 'ar' ? 'Ø­Ø°Ù Ø±Ù‚Ù…' : 'Delete digit'}
                    >
                      <ChevronLeft className="h-7 w-7 rtl:rotate-180" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotPin}
                    className="mt-5 min-h-11 text-sm font-semibold text-accent-primary"
                  >
                    {lang === 'ar' ? 'Ù†Ø³ÙŠØª Ø±Ù…Ø² PINØŸ' : 'Forgot PIN?'}
                  </button>
                </div>
              ) : lockScreenMode === 'question' ? (
                <form onSubmit={handleSecurityQuestionSubmit} className="mt-8 w-full max-w-sm space-y-4 text-start">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-text-primary">
                    {securityQuestionLabel}
                  </div>
                  <input
                    type="text"
                    value={securityAnswerInput}
                    onChange={(e) => setSecurityAnswerInput(e.target.value)}
                    className="w-full rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4 text-text-primary focus:border-accent-primary/50 focus:outline-none"
                    placeholder={lang === 'ar' ? 'Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„Ø³Ø¤Ø§Ù„' : 'Your answer'}
                    autoFocus
                  />
                  {securityResetError && (
                    <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                      {securityResetError}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLockScreenMode('pin');
                        setSecurityResetError('');
                      }}
                      className="min-h-11 rounded-2xl border border-white/10 bg-white/6 px-4 text-sm font-bold text-text-primary"
                    >
                      {lang === 'ar' ? 'Ø±Ø¬ÙˆØ¹' : 'Back'}
                    </button>
                    <button type="submit" className={`min-h-11 rounded-2xl px-4 text-sm font-bold ${currentTheme.btn}`}>
                      {lang === 'ar' ? 'ØªØ­Ù‚Ù‚' : 'Verify'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPinSubmit} className="mt-8 w-full max-w-sm space-y-4 text-start">
                  <div className="grid grid-cols-2 gap-2">
                    {[4, 6].map((lengthOption) => (
                      <button
                        key={lengthOption}
                        type="button"
                        onClick={() => setResetPinLength(lengthOption as PinLength)}
                        className={`min-h-11 rounded-2xl border text-sm font-semibold transition-colors ${resetPinLength === lengthOption ? 'border-accent-primary/50 bg-accent-primary/15 text-accent-primary' : 'border-white/10 bg-white/6 text-text-secondary'}`}
                      >
                        {lengthOption} {lang === 'ar' ? 'Ø£Ø±Ù‚Ø§Ù…' : 'digits'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={resetPinLength}
                    value={resetPinValue}
                    onChange={(e) => setResetPinValue(e.target.value.replace(/\D/g, '').slice(0, resetPinLength))}
                    className="w-full rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4 tracking-[0.4em] text-text-primary focus:border-accent-primary/50 focus:outline-none"
                    placeholder={resetPinLength === 6 ? '000000' : '0000'}
                    autoFocus
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={resetPinLength}
                    value={resetPinConfirm}
                    onChange={(e) => setResetPinConfirm(e.target.value.replace(/\D/g, '').slice(0, resetPinLength))}
                    className="w-full rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4 tracking-[0.4em] text-text-primary focus:border-accent-primary/50 focus:outline-none"
                    placeholder={lang === 'ar' ? 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø±Ù…Ø²' : 'Confirm PIN'}
                  />
                  {securityResetError && (
                    <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                      {securityResetError}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLockScreenMode('question');
                        setSecurityResetError('');
                      }}
                      className="min-h-11 rounded-2xl border border-white/10 bg-white/6 px-4 text-sm font-bold text-text-primary"
                    >
                      {lang === 'ar' ? 'Ø±Ø¬ÙˆØ¹' : 'Back'}
                    </button>
                    <button type="submit" className={`min-h-11 rounded-2xl px-4 text-sm font-bold ${currentTheme.btn}`}>
                      {lang === 'ar' ? 'Ø­ÙØ¸ PIN' : 'Save PIN'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

