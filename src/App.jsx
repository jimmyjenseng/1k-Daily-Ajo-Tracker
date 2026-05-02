import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, PlusCircle, CheckCircle2, XCircle,
  AlertTriangle, Download, Lock, Unlock, Edit2, Trash2,
  X, TrendingUp, Calendar, Coins, Trophy, ArrowRightLeft,
  RefreshCw, WifiOff,
} from 'lucide-react';
import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────
const START_DATE    = new Date('2026-05-02T00:00:00');
const DAILY_AMOUNT  = 1000;
const FINE_AMOUNT   = 500;
const DEFAULT_PASSWORD = '3914';

const INITIAL_HANDS = [
  { no: 1,  name: 'Mummy David 1'  }, { no: 2,  name: 'ID 1'          }, { no: 3,  name: 'Sis Esther 1'  },
  { no: 4,  name: 'Mr Akeem'       }, { no: 5,  name: 'Sis Esther 2'  }, { no: 6,  name: 'Mrs Dosu'      },
  { no: 7,  name: 'T&K 1'          }, { no: 8,  name: 'Mummy Ola 1'   }, { no: 9,  name: 'Bidex 1'       },
  { no: 10, name: 'Sis Esther 3'  }, { no: 11, name: 'T&K 2'          }, { no: 12, name: 'Mummy Aishat'  },
  { no: 13, name: 'ID 2'           }, { no: 14, name: 'Bidex 2'        }, { no: 15, name: 'Mummy David 2' },
  { no: 16, name: 'Mr Habeeb'      }, { no: 17, name: 'Mrs Abiola 1'  }, { no: 18, name: 'Sis Tomi 1'    },
  { no: 19, name: 'Mrs Abiola 2'  }, { no: 20, name: 'Esther 1'       }, { no: 21, name: 'Mummy Ola 2'   },
  { no: 22, name: 'Sis Tomi 2'    }, { no: 23, name: 'Sis Tomi 3'    }, { no: 24, name: 'ID 3'           },
  { no: 25, name: 'Esther 2'       }, { no: 26, name: 'Mummy Awal'    }, { no: 27, name: 'Sis Tomi 4'    },
  { no: 28, name: 'Mathew'         }, { no: 29, name: 'Mrs Abiola 3'  }, { no: 30, name: 'T&K 3'         },
];
const DEFAULT_ORDER = INITIAL_HANDS.map(h => h.no);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt       = n  => '\u20a6' + Number(n).toLocaleString('en-NG');
const todayKey  = () => new Date().toISOString().slice(0, 10);
const isAfter9pm= () => new Date().getHours() >= 21;
const getDaysElapsed = () =>
  Math.max(0, Math.floor((Date.now() - START_DATE.getTime()) / 86_400_000));

// ─── Supabase helpers ─────────────────────────────────────────────────────────
const sbGet = async key => {
  const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
  return data ? data.value : null;
};
const sbSet = (key, value) =>
  supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });

const sbGetPayments = async () => {
  const { data, error } = await supabase
    .from('payments').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Pill({ children, variant = 'default' }) {
  const cls = {
    default: 'bg-[#2a2a2a] text-[#a3a3a3]',
    green:   'bg-green-500/10 text-green-400 border border-green-500/20',
    red:     'bg-red-500/10 text-red-400 border border-red-500/20',
    orange:  'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  }[variant];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${cls}`}>{children}</span>;
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card p-5 flex flex-col gap-2 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-[#6b7280] text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? 'bg-[#22c55e]/10' : 'bg-[#2a2a2a]'}`}>
          <Icon size={15} className={accent ? 'text-[#22c55e]' : 'text-[#6b7280]'} />
        </div>
      </div>
      <div className="font-display text-2xl text-white">{value}</div>
      {sub && <div className="text-xs text-[#6b7280]">{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct }) {
  return (
    <div className="w-full bg-[#2a2a2a] rounded-full h-2 overflow-hidden">
      <div className="h-full bg-[#22c55e] rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141414] border border-[#2a2a2a] rounded-3xl w-full max-w-md max-h-[90dvh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
          <h3 className="font-display text-lg text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#2a2a2a] transition-colors">
            <X size={16} className="text-[#6b7280]" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#2a2a2a] border-t-[#22c55e] animate-spin" />
      <p className="text-[#6b7280] text-sm">Loading data…</p>
    </div>
  );
}

// ─── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock, onClose, storedPw }) {
  const [pw, setPw]   = useState('');
  const [err, setErr] = useState(false);
  const attempt = () => {
    if (pw === (storedPw || DEFAULT_PASSWORD)) onUnlock();
    else { setErr(true); setPw(''); }
  };
  return (
    <Modal open onClose={onClose} title="Admin Access">
      <div className="flex flex-col gap-4">
        <p className="text-[#6b7280] text-sm">Enter the admin password to continue.</p>
        <input
          type="password"
          className={`input ${err ? 'border-red-500' : ''}`}
          placeholder="Password"
          value={pw}
          autoFocus
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
        />
        {err && <p className="text-red-400 text-xs">Incorrect password</p>}
        <button className="btn-primary w-full" onClick={attempt}>Unlock</button>
      </div>
    </Modal>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ payments, order, fines, defaults }) {
  const daysElapsed        = getDaysElapsed();
  const totalDays          = INITIAL_HANDS.length;
  const todayCollectorNo   = order[daysElapsed] ?? null;
  const todayCollectorHand = INITIAL_HANDS.find(h => h.no === todayCollectorNo);

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalFines     = Object.values(fines).reduce((s, v) => s + v, 0);
  const defaultCount   = Object.keys(defaults).length;
  const pct            = (daysElapsed / totalDays) * 100;
  const todayPmts      = payments.filter(p => p.date === todayKey());
  const todayTotal     = todayPmts.reduce((s, p) => s + p.amount, 0);
  const recentPmts     = [...payments]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {todayCollectorHand && (
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs text-[#6b7280] uppercase tracking-widest font-medium">Today's Collector</span>
                <h2 className="font-display text-3xl text-white mt-1">{todayCollectorHand.name}</h2>
                <p className="text-[#6b7280] text-sm mt-1">Hand #{todayCollectorHand.no} &middot; Day {daysElapsed + 1}</p>
              </div>
              <span className="text-4xl select-none">🎉</span>
            </div>
            <ProgressBar pct={pct} />
            <div className="flex justify-between mt-1.5 text-xs text-[#6b7280]">
              <span>Day {daysElapsed} of {totalDays}</span>
              <span>{Math.round(pct)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Coins}         label="Total Collected" value={fmt(totalCollected)} sub="All time"              accent />
        <StatCard icon={Calendar}      label="Days Elapsed"    value={daysElapsed}         sub={`of ${totalDays} days`} />
        <StatCard icon={TrendingUp}    label="Today's Total"   value={fmt(todayTotal)}     sub={`${todayPmts.length} payment(s)`} />
        <StatCard icon={AlertTriangle} label="Total Fines"     value={fmt(totalFines)}     sub={`${defaultCount} defaulter(s)`} />
      </div>

      {todayCollectorHand && (() => {
        const handFines      = fines[todayCollectorNo] || 0;
        const expectedPayout = INITIAL_HANDS.length * DAILY_AMOUNT - handFines;
        return (
          <div className="card2 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Expected Payout Today</p>
              <p className="font-display text-xl text-white">{fmt(expectedPayout)}</p>
              {handFines > 0 && <p className="text-xs text-red-400 mt-0.5">&minus;{fmt(handFines)} fines deducted</p>}
            </div>
            <Trophy size={28} className="text-[#22c55e] opacity-60" />
          </div>
        );
      })()}

      {recentPmts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="flex flex-col gap-2">
            {recentPmts.map((p, i) => {
              const hand = INITIAL_HANDS.find(h => h.no === p.hand_no);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{hand?.name || `Hand #${p.hand_no}`}</p>
                    <p className="text-xs text-[#6b7280]">{p.date} &middot; {p.note || 'Payment'}</p>
                  </div>
                  <span className="font-mono text-[#22c55e] text-sm font-medium">+{fmt(p.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hands Tab ─────────────────────────────────────────────────────────────────
function HandsTab({ payments, order, setOrderRemote, fines, defaults, isAdmin }) {
  const [swapMode, setSwapMode] = useState(false);
  const [swapA,    setSwapA]    = useState(null);

  const daysElapsed = getDaysElapsed();
  const after9      = isAfter9pm();

  useEffect(() => { if (!isAdmin) { setSwapMode(false); setSwapA(null); } }, [isAdmin]);

  const getPaidDays = no => payments.filter(p => p.hand_no === no).length;
  const paidToday   = no => payments.some(p => p.hand_no === no && p.date === todayKey());
  const isDefaulted = no => after9 && !paidToday(no);

  const handleSwapSelect = async handNo => {
    if (!swapA) {
      setSwapA(handNo);
      toast('Now tap the second hand to swap with', { icon: '🔄' });
    } else if (swapA === handNo) {
      setSwapA(null);
    } else {
      const newOrder = [...order];
      const iA = newOrder.indexOf(swapA);
      const iB = newOrder.indexOf(handNo);
      if (iA !== -1 && iB !== -1) {
        [newOrder[iA], newOrder[iB]] = [newOrder[iB], newOrder[iA]];
        await setOrderRemote(newOrder);
        toast.success(`Swapped positions ${iA + 1} & ${iB + 1}`);
      }
      setSwapA(null);
      setSwapMode(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-white">
          All Hands <span className="text-[#6b7280] font-sans text-base font-normal">({INITIAL_HANDS.length})</span>
        </h2>
        {isAdmin && (
          <button
            onClick={() => { setSwapMode(s => !s); setSwapA(null); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all
              ${swapMode ? 'bg-[#22c55e] text-black' : 'btn-ghost'}`}
          >
            <ArrowRightLeft size={13} />
            {swapMode ? 'Cancel Swap' : 'Swap Order'}
          </button>
        )}
      </div>

      {swapMode && (
        <div className="card2 p-3 text-xs text-[#6b7280] flex items-center gap-2">
          <ArrowRightLeft size={13} className="text-[#22c55e] shrink-0" />
          {swapA
            ? `Selected Hand #${swapA}. Now tap the hand to swap with.`
            : 'Tap any two hands to swap their payout positions.'}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {order.map((handNo, posIdx) => {
          const hand      = INITIAL_HANDS.find(h => h.no === handNo);
          if (!hand) return null;
          const paidDays  = getPaidDays(handNo);
          const paid      = paidToday(handNo);
          const defaulted = isDefaulted(handNo);
          const handFines = fines[handNo] || 0;
          const defCnt    = defaults[handNo] || 0;
          const isToday   = posIdx === daysElapsed;
          const isPast    = posIdx < daysElapsed;
          const isSelected= swapA === handNo;

          const payoutDate = new Date(START_DATE);
          payoutDate.setDate(payoutDate.getDate() + posIdx);
          const dateStr = payoutDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

          return (
            <div
              key={handNo}
              onClick={swapMode ? () => handleSwapSelect(handNo) : undefined}
              className={[
                'card2 p-4 transition-all duration-200',
                swapMode   ? 'cursor-pointer hover:border-[#22c55e]/50' : '',
                isSelected ? 'border-[#22c55e] ring-1 ring-[#22c55e]' : '',
                isToday    ? 'border-[#22c55e]/40 bg-[#22c55e]/5' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div className={[
                  'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-medium shrink-0',
                  isToday ? 'bg-[#22c55e] text-black' : isPast ? 'bg-[#2a2a2a] text-[#6b7280]' : 'bg-[#2a2a2a] text-[#a3a3a3]',
                ].join(' ')}>
                  {posIdx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm truncate">{hand.name}</span>
                    {isToday && <Pill variant="green">Today 🎉</Pill>}
                    {defCnt >= 2 && <Pill variant="red">2&times; default</Pill>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#6b7280]">#{hand.no} &middot; {dateStr}</span>
                    <span className="text-xs text-[#6b7280]">{paidDays}d paid</span>
                    {handFines > 0 && <span className="text-xs text-red-400">Fine: {fmt(handFines)}</span>}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-0.5">
                  {paid ? (
                    <CheckCircle2 size={18} className="text-[#22c55e]" />
                  ) : defaulted ? (
                    <>
                      <XCircle size={18} className="text-red-400" />
                      <span className="text-[10px] text-red-400 font-medium">+{fmt(FINE_AMOUNT)}</span>
                    </>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#3a3a3a]" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Log Payment Tab ──────────────────────────────────────────────────────────
function LogPaymentTab({
  payments,
  fines, setFinesRemote,
  defaults, setDefaultsRemote,
  order, setOrderRemote,
  isAdmin, setIsAdmin,
  storedPw, setStoredPwRemote,
}) {
  const [showGate,     setShowGate]     = useState(false);
  const [form,         setForm]         = useState({ handNo: '', amount: DAILY_AMOUNT, note: '', date: todayKey() });
  const [editingId,    setEditingId]    = useState(null);
  const [deleteConf,   setDeleteConf]   = useState(null);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw,        setNewPw]        = useState('');
  const [filterDate,   setFilterDate]   = useState(todayKey());
  const [saving,       setSaving]       = useState(false);

  const handleSubmit = async () => {
    if (!form.handNo)                         return toast.error('Select a hand');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('payments').update({
          hand_no: Number(form.handNo), amount: Number(form.amount),
          note: form.note || null, date: form.date,
        }).eq('id', editingId);
        if (error) throw error;
        toast.success('Payment updated');
        setEditingId(null);
      } else {
        const { error } = await supabase.from('payments').insert({
          date: form.date, hand_no: Number(form.handNo),
          amount: Number(form.amount), note: form.note || null,
        });
        if (error) throw error;
        const hand = INITIAL_HANDS.find(h => h.no === Number(form.handNo));
        toast.success(`Logged ${fmt(Number(form.amount))} for ${hand?.name}`);
      }
      setForm({ handNo: '', amount: DAILY_AMOUNT, note: '', date: todayKey() });
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    } finally { setSaving(false); }
  };

  const startEdit = p => {
    setEditingId(p.id);
    setForm({ handNo: String(p.hand_no), amount: p.amount, note: p.note || '', date: p.date });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePayment = async id => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) return toast.error('Delete failed: ' + error.message);
    toast.success('Payment deleted');
    setDeleteConf(null);
  };

  const markDefault = async handNo => {
    if (!handNo) return toast.error('Select a hand first');
    const updFines    = { ...fines,    [handNo]: (fines[handNo]    || 0) + FINE_AMOUNT };
    const updDefaults = { ...defaults, [handNo]: (defaults[handNo] || 0) + 1 };
    await setFinesRemote(updFines);
    await setDefaultsRemote(updDefaults);

    if (updDefaults[handNo] >= 2) {
      const lastTwo = order.slice(-2);
      if (!lastTwo.includes(handNo)) {
        const newOrder = [...order.filter(n => n !== handNo), handNo];
        await setOrderRemote(newOrder);
        toast(`Hand moved to end of cycle (2 defaults)`, { icon: '⚠️' });
      }
    }
    toast(`${fmt(FINE_AMOUNT)} fine added for Hand #${handNo}`, { icon: '⚠️' });
  };

  const exportCSV = () => {
    const rows = [['Date','Hand No','Name','Amount','Note','Created At']];
    [...payments].sort((a,b) => a.date.localeCompare(b.date)).forEach(p => {
      const hand = INITIAL_HANDS.find(h => h.no === p.hand_no);
      rows.push([p.date, p.hand_no, hand?.name||'', p.amount, p.note||'', p.created_at]);
    });
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ajo_payments.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const changePw = async () => {
    if (!newPw || newPw.length < 4) return toast.error('Min 4 characters');
    await setStoredPwRemote(newPw);
    setNewPw(''); setShowChangePw(false);
    toast.success('Password changed');
  };

  // group for history display
  const paymentsByDate = payments.reduce((acc, p) => {
    (acc[p.date] = acc[p.date] || []).push(p);
    return acc;
  }, {});
  const sortedDates = Object.keys(paymentsByDate).sort().reverse();

  // ─── Locked ───
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
        <Lock size={32} className="text-[#6b7280]" />
      </div>
      <div className="text-center">
        <h2 className="font-display text-2xl text-white mb-2">Admin Area</h2>
        <p className="text-[#6b7280] text-sm">Password required to log payments</p>
      </div>
      <button className="btn-primary px-8 py-3" onClick={() => setShowGate(true)}>Enter Password</button>
      {showGate && (
        <PasswordGate
          storedPw={storedPw}
          onUnlock={() => { setIsAdmin(true); setShowGate(false); toast.success('Admin unlocked!'); }}
          onClose={() => setShowGate(false)}
        />
      )}
    </div>
  );

  // ─── Unlocked ───
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Unlock size={16} className="text-[#22c55e]" />
          <h2 className="font-display text-xl text-white">Log Payment</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setIsAdmin(false); toast('Admin session ended', { icon: '🔒' }); }}
            className="border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs font-medium hover:border-red-400 transition-colors flex items-center gap-1.5"
          >
            <Lock size={11} /> Lock
          </button>
          <button onClick={() => setShowChangePw(true)} className="btn-ghost text-xs px-3 py-2">Change PW</button>
          <button onClick={exportCSV} className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* Log form */}
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">
          {editingId ? '✏️ Edit Payment' : '+ New Payment'}
        </h3>
        <div>
          <label className="text-xs text-[#6b7280] mb-1.5 block">Hand</label>
          <select className="input" value={form.handNo} onChange={e => setForm(f => ({ ...f, handNo: e.target.value }))}>
            <option value="">Select hand…</option>
            {order.map(no => { const h = INITIAL_HANDS.find(x => x.no === no); return h ? <option key={no} value={no}>#{no} — {h.name}</option> : null; })}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#6b7280] mb-1.5 block">Amount (N)</label>
            <input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#6b7280] mb-1.5 block">Date</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#6b7280] mb-1.5 block">Note (optional)</label>
          <input type="text" className="input" placeholder="e.g. Cash, Transfer…" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={handleSubmit} disabled={saving}
          >
            {saving && <RefreshCw size={13} className="animate-spin" />}
            {editingId ? 'Update Payment' : 'Log Payment'}
          </button>
          {editingId && (
            <button className="btn-ghost px-4" onClick={() => { setEditingId(null); setForm({ handNo: '', amount: DAILY_AMOUNT, note: '', date: todayKey() }); }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Mark Default */}
      <div className="card p-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">Mark as Defaulted</h3>
        <div className="flex gap-2">
          <select className="input flex-1" id="defaultSelect">
            <option value="">Select hand…</option>
            {order.map(no => { const h = INITIAL_HANDS.find(x => x.no === no); return h ? <option key={no} value={no}>#{no} — {h.name}</option> : null; })}
          </select>
          <button
            className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors whitespace-nowrap"
            onClick={() => { const sel = document.getElementById('defaultSelect'); if (sel.value) markDefault(Number(sel.value)); else toast.error('Select a hand first'); }}
          >
            Add Fine
          </button>
        </div>
        <p className="text-xs text-[#6b7280]">Adds {fmt(FINE_AMOUNT)} fine. 2 defaults = hand moved to end of cycle.</p>
      </div>

      {/* Fines summary */}
      {Object.keys(fines).length > 0 && (
        <div className="card p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">Fines Summary</h3>
          {Object.entries(fines).map(([handNo, amount]) => {
            const hand   = INITIAL_HANDS.find(h => h.no === Number(handNo));
            const defCnt = defaults[handNo] || 0;
            return (
              <div key={handNo} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{hand?.name || `Hand #${handNo}`}</p>
                  <p className="text-xs text-[#6b7280]">{defCnt} default{defCnt !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-red-400 text-sm font-mono font-medium">{fmt(amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment history */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">Payment History</h3>
          <select
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-1.5 text-xs text-[#a3a3a3] focus:outline-none"
            value={filterDate} onChange={e => setFilterDate(e.target.value)}
          >
            <option value="">All dates</option>
            {sortedDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {sortedDates.filter(d => !filterDate || d === filterDate).length === 0 && (
          <p className="text-[#6b7280] text-sm text-center py-4">No payments logged yet</p>
        )}

        {sortedDates.filter(d => !filterDate || d === filterDate).map(date => {
          const pmts     = paymentsByDate[date] || [];
          const dayTotal = pmts.reduce((s, p) => s + p.amount, 0);
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#6b7280]">{date}</span>
                <span className="text-xs font-mono text-[#22c55e]">{fmt(dayTotal)}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {pmts.map(p => {
                  const hand = INITIAL_HANDS.find(h => h.no === p.hand_no);
                  return (
                    <div key={p.id} className="card2 p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{hand?.name || `Hand #${p.hand_no}`}</p>
                        <p className="text-xs text-[#6b7280]">{p.note || 'Payment'} · {fmt(p.amount)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => startEdit(p)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors">
                          <Edit2 size={12} className="text-[#6b7280]" />
                        </button>
                        <button onClick={() => setDeleteConf(p.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors">
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Modal */}
      <Modal open={!!deleteConf} onClose={() => setDeleteConf(null)} title="Confirm Delete">
        <div className="flex flex-col gap-4">
          <p className="text-[#a3a3a3] text-sm">Delete this payment? This cannot be undone.</p>
          <div className="flex gap-2">
            <button className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-2.5 rounded-xl text-sm font-medium" onClick={() => deletePayment(deleteConf)}>Delete</button>
            <button className="flex-1 btn-ghost" onClick={() => setDeleteConf(null)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Change PW Modal */}
      <Modal open={showChangePw} onClose={() => setShowChangePw(false)} title="Change Password">
        <div className="flex flex-col gap-4">
          <input type="password" className="input" placeholder="New password (min 4 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} />
          <button className="btn-primary w-full" onClick={changePw}>Update Password</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,     setTab]     = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [online,  setOnline]  = useState(navigator.onLine);

  const [payments, setPayments] = useState([]);
  const [order,    setOrder]    = useState(DEFAULT_ORDER);
  const [fines,    setFines]    = useState({});
  const [defaults, setDefaults] = useState({});
  const [storedPw, setStoredPw] = useState(DEFAULT_PASSWORD);

  // Online/offline indicator
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Initial data load
  useEffect(() => {
    (async () => {
      try {
        const [pmts, ord, fin, def, pw] = await Promise.all([
          sbGetPayments(),
          sbGet('payout_order'),
          sbGet('fines'),
          sbGet('defaults'),
          sbGet('password'),
        ]);
        setPayments(pmts);
        if (ord) setOrder(ord);
        if (fin) setFines(fin);
        if (def) setDefaults(def);
        if (pw)  setStoredPw(pw);
      } catch (e) {
        toast.error('Failed to load — check your connection');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Real-time: payments table
  useEffect(() => {
    const channel = supabase
      .channel('rt-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, async () => {
        const data = await sbGetPayments();
        setPayments(data);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // Real-time: settings table
  useEffect(() => {
    const channel = supabase
      .channel('rt-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, ({ new: row }) => {
        if (!row) return;
        if (row.key === 'payout_order') setOrder(row.value);
        if (row.key === 'fines')        setFines(row.value);
        if (row.key === 'defaults')     setDefaults(row.value);
        if (row.key === 'password')     setStoredPw(row.value);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // Remote setters — write to Supabase; state updates arrive via subscription
  const setOrderRemote    = useCallback(v => sbSet('payout_order', v), []);
  const setFinesRemote    = useCallback(v => sbSet('fines', v),        []);
  const setDefaultsRemote = useCallback(v => sbSet('defaults', v),     []);
  const setStoredPwRemote = useCallback(v => sbSet('password', v),     []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hands',     label: 'Hands',     icon: Users            },
    { id: 'log',       label: 'Log',       icon: PlusCircle       },
  ];

  return (
    <div className="min-h-dvh bg-[#0a0a0a] font-body">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1e1e1e', color: '#f5f5f5', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: '13px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0a0a0a' } },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-white leading-none">Ajo Tracker</h1>
            <p className="text-[10px] text-[#6b7280] mt-0.5 font-mono">
              Day {getDaysElapsed() + 1} &middot; {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-1 rounded-lg">
                <Unlock size={11} className="text-[#22c55e]" />
                <span className="text-[10px] text-[#22c55e] font-medium">Admin</span>
              </div>
            )}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${!online ? 'bg-red-500/10' : ''}`}>
              {online
                ? <><div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" /><span className="text-xs text-[#6b7280]">Live</span></>
                : <><WifiOff size={12} className="text-red-400" /><span className="text-xs text-red-400">Offline</span></>
              }
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-28">
        {loading ? <Spinner /> : (
          <>
            {tab === 'dashboard' && (
              <Dashboard payments={payments} order={order} fines={fines} defaults={defaults} />
            )}
            {tab === 'hands' && (
              <HandsTab
                payments={payments}
                order={order}       setOrderRemote={setOrderRemote}
                fines={fines}
                defaults={defaults}
                isAdmin={isAdmin}
              />
            )}
            {tab === 'log' && (
              <LogPaymentTab
                payments={payments}
                fines={fines}           setFinesRemote={setFinesRemote}
                defaults={defaults}     setDefaultsRemote={setDefaultsRemote}
                order={order}           setOrderRemote={setOrderRemote}
                isAdmin={isAdmin}       setIsAdmin={setIsAdmin}
                storedPw={storedPw}     setStoredPwRemote={setStoredPwRemote}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#1a1a1a]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-around">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-col items-center gap-1 px-5 py-1 rounded-2xl transition-all duration-200 ${active ? 'text-[#22c55e]' : 'text-[#4a4a4a] hover:text-[#6b7280]'}`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-[#22c55e]' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
