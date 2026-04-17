export type SmsVerificationStatus = 'VERIFIED' | 'SUSPICIOUS' | 'FRAUD' | 'UNKNOWN';

export interface SmsAnalysisResult {
  status: SmsVerificationStatus;
  reason: string;
}

export const verifiedSenders = {
  banks: [
    { id: "CIB", nameAr: "بنك CIB", nameEn: "CIB Bank" },
    { id: "NBE", nameAr: "البنك الأهلي", nameEn: "National Bank of Egypt" },
    { id: "BanqueMisr", nameAr: "بنك مصر", nameEn: "Banque Misr" },
    { id: "QNB", nameAr: "QNB الأهلي", nameEn: "QNB Alahli" },
    { id: "ALEXBANK", nameAr: "بنك الإسكندرية", nameEn: "Alex Bank" },
    { id: "HSBC", nameAr: "HSBC مصر", nameEn: "HSBC Egypt" },
    { id: "Fawry", nameAr: "فوري", nameEn: "Fawry" },
    { id: "InstaPay", nameAr: "انستاباي", nameEn: "InstaPay" },
    { id: "VFCash", nameAr: "فودافون كاش", nameEn: "Vodafone Cash" },
    { id: "OrangeMoney", nameAr: "أورنج موني", nameEn: "Orange Money" }
  ],
  telecoms: [
    { id: "Vodafone", nameAr: "فودافون مصر", nameEn: "Vodafone Egypt" },
    { id: "Orange", nameAr: "أورنج مصر", nameEn: "Orange Egypt" },
    { id: "Etisalat", nameAr: "اتصالات مصر", nameEn: "e& Egypt" },
    { id: "WE", nameAr: "المصرية للاتصالات", nameEn: "WE Telecom" }
  ]
};

export function analyzeSMS(sender: string, body: string): SmsAnalysisResult {
  const allVerifiedIds = [
    ...verifiedSenders.banks.map(b => b.id.toLowerCase()),
    ...verifiedSenders.telecoms.map(t => t.id.toLowerCase())
  ];
  
  const senderLower = sender.toLowerCase();
  const isVerified = allVerifiedIds.includes(senderLower);
  const isPhoneNumber = /^(\+20|0)?1[0125][0-9]{8}$/.test(sender);
  const hasURL = /https?:\/\/|bit\.ly|t\.me/.test(body);
  const hasUrgency = /محظور|suspended|blocked|فوري|عاجل/i.test(body);
  const hasCredentialRequest = /PIN|كلمة السر|OTP|password/i.test(body);
  
  if (isPhoneNumber && /بنك|bank|حساب|account/i.test(body))
    return { status: 'FRAUD', reason: 'bank_from_phone' };
  if (hasURL && /bank|حساب/i.test(body))
    return { status: 'FRAUD', reason: 'suspicious_link' };
  if (isVerified)
    return { status: 'VERIFIED', reason: 'trusted_sender' };
  if (hasUrgency || hasCredentialRequest)
    return { status: 'SUSPICIOUS', reason: 'urgent_language' };
    
  return { status: 'UNKNOWN', reason: 'unrecognized_sender' };
}

export function extractTransactionData(body: string) {
  const amountMatch = body.match(/\b\d+(?:[.,]\d+)?\b/);
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : 0;
  
  const isIncome = /إيداع|راتب|استلام|اضافة|deposit|salary|received|added|تم اضافة|تم استلام/i.test(body);
  const isExpense = /خصم|سحب|دفع|شراء|فاتورة|withdrawal|payment|purchase|paid|spent|تم خصم|تم دفع/i.test(body);
  const type = isIncome ? 'income' : (isExpense ? 'expense' : 'expense');
  
  return { amount, type };
}

export function getSmsStatusLabel(status: SmsVerificationStatus, lang: 'en' | 'ar') {
  const labels = {
    VERIFIED: { en: 'Trusted', ar: 'موثوق' },
    SUSPICIOUS: { en: 'Suspicious', ar: 'مريب' },
    FRAUD: { en: 'Fraud risk', ar: 'احتيال محتمل' },
    UNKNOWN: { en: 'Unknown', ar: 'غير معروف' },
  } as const;

  return labels[status][lang];
}

export function getSmsReasonLabel(reason: string, lang: 'en' | 'ar') {
  const labels: Record<string, { en: string; ar: string }> = {
    trusted_sender: {
      en: 'Trusted sender ID',
      ar: 'مرسل معروف وموثوق',
    },
    bank_from_phone: {
      en: 'Claims to be a bank from a phone number',
      ar: 'يدّعي أنه بنك لكن المرسل رقم هاتف',
    },
    suspicious_link: {
      en: 'Contains a suspicious account-related link',
      ar: 'يحتوي على رابط مريب متعلق بالحساب',
    },
    urgent_language: {
      en: 'Urgent wording or credential request detected',
      ar: 'يوجد أسلوب استعجال أو طلب بيانات حساسة',
    },
    unrecognized_sender: {
      en: 'Unrecognized sender',
      ar: 'المرسل غير معروف',
    },
  };

  return labels[reason]?.[lang] ?? (lang === 'ar' ? 'لا يوجد تفسير إضافي' : 'No extra explanation');
}
