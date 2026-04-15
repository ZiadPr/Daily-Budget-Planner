import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, CheckCircle, Circle, Trash2, Calendar, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function Gam3eyaTab({ gam3eyat, setGam3eyat, setShowAddGam3eyaModal, t, currentTheme, formatCurrency, currency, lang, addTransactionDirectly }: any) {
  const toggleMonthPaid = (gam3eyaId: string, memberId: string) => {
    setGam3eyat(gam3eyat.map((g: any) => {
      if (g.id === gam3eyaId) {
        const updatedMembers = g.members.map((m: any) => m.id === memberId ? { ...m, isPaid: !m.isPaid } : m);
        const allPaid = updatedMembers.every((m: any) => m.isPaid);
        if (allPaid && !g.isCompleted) {
          // Auto payout if not already completed
          handleReceivePayout(g);
        }
        return {
          ...g,
          members: updatedMembers,
          isCompleted: allPaid
        };
      }
      return g;
    }));
  };

  const handleDeleteGam3eya = (id: string) => {
    setGam3eyat(gam3eyat.filter((g: any) => g.id !== id));
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
    <div className="flex flex-col flex-grow space-y-6 pb-24">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className={`text-2xl font-bold ${currentTheme.text || 'text-slate-50'}`}>{t.gam3eya}</h2>
        <button onClick={() => setShowAddGam3eyaModal(true)} className={`p-2 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors`}>
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {gam3eyat.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-500 h-48">
          <Users className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">{lang === 'ar' ? 'لا توجد جمعيات حالياً.' : 'No money pools yet.'}</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {gam3eyat.map((g: any) => (
            <motion.div key={g.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`bg-white/5 border border-white/10 rounded-[2rem] p-5 relative overflow-hidden ${g.isCompleted ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-lg font-bold ${currentTheme.text || 'text-slate-50'}`}>{g.name} {g.isCompleted && (lang === 'ar' ? '(مكتملة)' : '(Completed)')}</h3>
                  <p className={`text-xs ${currentTheme.text ? 'text-slate-500' : 'text-slate-400'}`}>
                    {formatCurrency(g.monthlyAmount, currency, lang, false)} / {lang === 'ar' ? 'شهر' : 'month'}
                  </p>
                </div>
                <button onClick={() => handleDeleteGam3eya(g.id)} className="p-2 text-slate-400 hover:text-rose-400 transition-colors">
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
    </div>
  );
}
