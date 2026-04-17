import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, CheckCircle, Circle, Trash2, Calendar, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';

export default function Gam3eyaTab({ gam3eyat, setGam3eyat, setShowAddGam3eyaModal, t, currentTheme, formatCurrency, currency, lang, addTransactionDirectly }: any) {
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<{gam3eya: any, memberId: string} | null>(null);

  const toggleMonthPaid = (gam3eyaId: string, memberId: string) => {
    const g = gam3eyat.find((gam: any) => gam.id === gam3eyaId);
    if (!g) return;

    const updatedMembers = g.members.map((m: any) => m.id === memberId ? { ...m, isPaid: !m.isPaid } : m);
    const allPaid = updatedMembers.every((m: any) => m.isPaid);

    if (allPaid && !g.isCompleted) {
      setPendingCompletion({ gam3eya: { ...g, members: updatedMembers }, memberId });
      setShowCompleteConfirm(true);
      return; // Wait for confirmation
    }

    setGam3eyat(gam3eyat.map((gam: any) => {
      if (gam.id === gam3eyaId) {
        return {
          ...gam,
          members: updatedMembers,
          isCompleted: allPaid
        };
      }
      return gam;
    }));
  };

  const confirmCompletion = () => {
    if (pendingCompletion) {
      const { gam3eya } = pendingCompletion;
      handleReceivePayout(gam3eya);
      setGam3eyat(gam3eyat.map((g: any) => 
        g.id === gam3eya.id ? { ...gam3eya, isCompleted: true } : g
      ));
      setShowCompleteConfirm(false);
      setPendingCompletion(null);
    }
  };

  const cancelCompletion = () => {
    setShowCompleteConfirm(false);
    setPendingCompletion(null);
  };

  const handleDeleteGam3eya = (id: string) => {
    if (window.confirm(lang === 'ar' ? 'هل تريد حذف هذه الجمعية؟' : 'Delete this money pool?')) {
      setGam3eyat(gam3eyat.filter((g: any) => g.id !== id));
    }
  };

  const handlePayMonthly = (g: any) => {
    // Find first unpaid month
    const firstUnpaid = g.members.find((m: any) => !m.isPaid);
    if (firstUnpaid) {
      addTransactionDirectly(`${lang === 'ar' ? 'دفع قسط جمعية' : 'Gam3eya Installment'}: ${g.name}`, g.monthlyAmount, 'expense');
      toggleMonthPaid(g.id, firstUnpaid.id);
    }
  };

  const handleReceivePayout = (g: any) => {
    const totalPayout = g.monthlyAmount * g.totalMonths;
    addTransactionDirectly(`${lang === 'ar' ? 'استلام قبض جمعية' : 'Gam3eya Payout'}: ${g.name}`, totalPayout, 'income');
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[0.75rem] text-text-secondary">{lang === 'ar' ? 'الجمعيات والمواعيد القادمة' : 'Track dues and payouts'}</p>
          <h2 className={`text-[1.25rem] font-bold ${currentTheme.text || 'text-slate-50'}`}>{t.gam3eya}</h2>
        </div>
        <button onClick={() => setShowAddGam3eyaModal(true)} className="touch-icon-button rounded-2xl bg-sky-500/20 text-sky-400">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {gam3eyat.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mobile-card flex h-56 flex-col items-center justify-center gap-4 border border-white/5 bg-white/[0.02] p-8 text-center text-slate-500">
          <Users className="h-10 w-10 opacity-30" />
          <button
            type="button"
            onClick={() => setShowAddGam3eyaModal(true)}
            className="min-h-11 rounded-full bg-accent-primary px-5 text-sm font-bold text-text-on-accent"
          >
            {t.addGam3eya}
          </button>
          <p className="text-sm">{lang === 'ar' ? 'لا توجد جمعيات حالياً.' : 'No money pools yet.'}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {gam3eyat.map((g: any) => (
            <motion.div key={g.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`mobile-card relative overflow-hidden border border-glass-border bg-glass-bg p-5 ${g.isCompleted ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-lg font-bold text-text-primary`}>{g.name} {g.isCompleted && (lang === 'ar' ? '(مكتملة)' : '(Completed)')}</h3>
                  <p className={`text-xs text-text-secondary`}>
                    {formatCurrency(g.monthlyAmount, currency, lang, false)} / {lang === 'ar' ? 'شهر' : 'month'}
                  </p>
                </div>
                <button onClick={() => handleDeleteGam3eya(g.id)} className="touch-icon-button text-text-secondary">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {!g.isCompleted && (
                <div className="flex gap-2 mb-6">
                  <button 
                    onClick={() => handlePayMonthly(g)}
                    className="flex-1 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center justify-center gap-2 text-xs font-medium"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    {lang === 'ar' ? 'دفع القسط' : 'Pay Installment'}
                  </button>
                  <button 
                    onClick={() => handleReceivePayout(g)}
                    className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex items-center justify-center gap-2 text-xs font-medium"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    {lang === 'ar' ? 'استلام القبض' : 'Receive Payout'}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider px-2">
                  <span>{lang === 'ar' ? 'الشهور' : 'Months'}</span>
                  <span>{lang === 'ar' ? 'الحالة' : 'Status'}</span>
                </div>
                {g.members.map((m: any, idx: number) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleMonthPaid(g.id, m.id)} className={`transition-colors ${m.isPaid ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-400'}`}>
                        {m.isPaid ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <span className={`font-medium ${currentTheme.text || 'text-slate-200'} ${m.isPaid ? 'line-through opacity-50' : ''}`}>
                        {lang === 'ar' ? `الشهر ${idx + 1}` : `Month ${idx + 1}`}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-medium ${m.isPaid ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {m.isPaid ? (lang === 'ar' ? 'تم الدفع' : 'Paid') : (lang === 'ar' ? 'في الانتظار' : 'Pending')}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Completion Confirmation Modal */}
      <AnimatePresence>
        {showCompleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`bg-gradient-to-br ${currentTheme.card} border border-white/10 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center`}>
              <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${currentTheme.text || 'text-white'}`}>
                {lang === 'ar' ? 'إكمال الجمعية' : 'Complete Gam3eya'}
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                {lang === 'ar' 
                  ? 'لقد تم دفع جميع الأقساط. هل تريد إكمال الجمعية واستلام القبض تلقائياً؟' 
                  : 'All installments have been paid. Do you want to complete the Gam3eya and receive the payout automatically?'}
              </p>
              
              <div className="flex gap-3">
                <button onClick={cancelCompletion} className={`flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors`}>
                  {t.cancel}
                </button>
                <button onClick={confirmCompletion} className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors bg-emerald-500 hover:bg-emerald-400`}>
                  {lang === 'ar' ? 'تأكيد واستلام' : 'Confirm & Receive'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
